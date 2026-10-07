import { createClient } from "@/src/lib/supabase/server";

import type { LeadStage, LeadSummary, LeadTemperature } from "@/src/lib/types/lead";

import type { LeadFilters } from "@/src/lib/utils/lead-filters";

import { parseLeadTagIds } from "@/src/lib/utils/lead-filters";

/* -------------------------------------------------------------------------- */
/*                                   METRICS                                  */
/* -------------------------------------------------------------------------- */

export interface LeadMetrics {
  total: number;
  totalChange: number;
  totalTrend: number[];
  newLeads: number;
  followUpsDue: number;
  hotLeads: number;
  won: number;
  lost: number;
}

export async function getLeadMetrics(): Promise<LeadMetrics> {
  const supabase = await createClient();

  const { data: stages } = await supabase.from("lead_stages").select("id, slug, stage_type");

  const newStageId = stages?.find((stage) => stage.slug === "new")?.id;

  const openStageIds = (stages ?? []).filter((stage) => stage.stage_type === "open").map((stage) => stage.id);

  const wonStageIds = (stages ?? []).filter((stage) => stage.stage_type === "won").map((stage) => stage.id);

  const lostStageIds = (stages ?? []).filter((stage) => stage.stage_type === "lost").map((stage) => stage.id);

  function baseQuery() {
    return supabase.from("leads").select("*", {
      count: "exact",
      head: true,
    });
  }

  const countWhere = (build: (query: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) =>
    build(baseQuery());

  const [totalRes, newLeadsRes, followUpsDueRes, hotLeadsRes, wonRes, lostRes] = await Promise.all([
    countWhere((query) => query),

    newStageId ? countWhere((query) => query.eq("stage_id", newStageId)) : Promise.resolve({ count: 0 }),

    openStageIds.length
      ? countWhere((query) =>
          query
            .in("stage_id", openStageIds)
            .lte("next_follow_up_at", new Date().toISOString())
            .not("next_follow_up_at", "is", null),
        )
      : Promise.resolve({ count: 0 }),

    openStageIds.length
      ? countWhere((query) => query.in("stage_id", openStageIds).eq("temperature", "Hot"))
      : Promise.resolve({ count: 0 }),

    wonStageIds.length
      ? countWhere((query) => query.in("stage_id", wonStageIds))
      : Promise.resolve({ count: 0 }),

    lostStageIds.length
      ? countWhere((query) => query.in("stage_id", lostStageIds))
      : Promise.resolve({ count: 0 }),
  ]);

  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentLeads } = await supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  const totalTrend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo);

    day.setDate(day.getDate() + index);

    const dayKey = day.toDateString();

    return (recentLeads ?? []).filter((lead) => new Date(lead.created_at).toDateString() === dayKey).length;
  });

  return {
    total: totalRes.count ?? 0,

    totalChange: (totalTrend[6] ?? 0) - (totalTrend[5] ?? 0),

    totalTrend,

    newLeads: newLeadsRes.count ?? 0,

    followUpsDue: followUpsDueRes.count ?? 0,

    hotLeads: hotLeadsRes.count ?? 0,

    won: wonRes.count ?? 0,

    lost: lostRes.count ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*                              SHARED FILTERING                              */
/* -------------------------------------------------------------------------- */

interface ApplyFiltersParams {
  supabase: Awaited<ReturnType<typeof createClient>>;
  search?: string;
  filters: LeadFilters;
  archived?: boolean;
}

interface IdRow {
  id: string;
}

interface LeadTagLinkRow {
  lead_id: string;
}

interface LeadTagWithRelationRow {
  lead_id: string;

  tag: {
    id: string;
    name: string;
    slug: string;
    color_hex: string;
  } | null;
}

/**
 * Resolves search + filters into a query returning matching lead ids.
 *
 * Filters that live outside the leads table first resolve the related ids,
 * then narrow the leads query using `.in()`.
 */
async function buildFilteredLeadsQuery({ supabase, search, filters, archived = false }: ApplyFiltersParams) {
  let query = supabase.from("leads").select("id");
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  /* ------------------------------------------------------------------------ */
  /*                                  SEARCH                                  */
  /* ------------------------------------------------------------------------ */

  if (search) {
    const [{ data: customerMatches }, { data: carMatches }] = await Promise.all([
      supabase
        .from("customer_profiles")
        .select("id")
        .or(`full_name.ilike.%${search}%,customer_number.ilike.%${search}%,phone.ilike.%${search}%`),

      supabase.from("cars").select("id").or(`display_title.ilike.%${search}%,stock_id.ilike.%${search}%`),
    ]);

    const { data: matchingBrands } = await supabase.from("brands").select("id").ilike("name", `%${search}%`);

    const matchingBrandIds = (matchingBrands ?? []).map((brand) => brand.id);

    let brandCarMatches: IdRow[] = [];

    if (matchingBrandIds.length > 0) {
      const { data } = await supabase.from("cars").select("id").in("brand_id", matchingBrandIds);

      brandCarMatches = (data ?? []) as IdRow[];
    }

    const customerIds = (customerMatches ?? []).map((customer) => customer.id);

    const directCarIds = (carMatches ?? []).map((car) => car.id);

    const brandCarIds = brandCarMatches.map((car) => car.id);

    const carIds = Array.from(new Set([...directCarIds, ...brandCarIds]));

    const orParts = [`lead_number.ilike.%${search}%`];

    if (customerIds.length > 0) {
      orParts.push(`customer_id.in.(${customerIds.join(",")})`);
    }

    if (carIds.length > 0) {
      orParts.push(`car_id.in.(${carIds.join(",")})`);
    }

    query = query.or(orParts.join(","));
  }

  /* ------------------------------------------------------------------------ */
  /*                              DIRECT FILTERS                              */
  /* ------------------------------------------------------------------------ */

  if (filters.stage) {
    query = query.eq("stage_id", filters.stage);
  }

  if (filters.assignedStaff) {
    query = query.eq("assigned_staff_id", filters.assignedStaff);
  }

  if (filters.source) {
    query = query.eq("source_id", filters.source);
  }

  if (filters.temperature) {
    query = query.eq("temperature", filters.temperature);
  }

  if (filters.vehicle) {
    query = query.eq("car_id", filters.vehicle);
  }

  if (filters.lostReason) {
    query = query.eq("lost_reason_id", filters.lostReason);
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", filters.createdFrom);
  }

  if (filters.createdTo) {
    query = query.lte("created_at", `${filters.createdTo}T23:59:59`);
  }

  /* ------------------------------------------------------------------------ */
  /*                             FOLLOW-UP FILTER                              */
  /* ------------------------------------------------------------------------ */

  if (filters.followUpStatus === "overdue") {
    query = query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", new Date().toISOString());
  } else if (filters.followUpStatus === "upcoming") {
    query = query.not("next_follow_up_at", "is", null).gt("next_follow_up_at", new Date().toISOString());
  } else if (filters.followUpStatus === "none") {
    query = query.is("next_follow_up_at", null);
  }

  /* ------------------------------------------------------------------------ */
  /*                          BRAND / LOCATION FILTER                          */
  /* ------------------------------------------------------------------------ */

  if (filters.brand || filters.location) {
    let carQuery = supabase.from("cars").select("id");

    if (filters.brand) {
      carQuery = carQuery.eq("brand_id", filters.brand);
    }

    if (filters.location) {
      carQuery = carQuery.eq("location_id", filters.location);
    }

    const { data: matchingCars } = await carQuery;

    const carIds = (matchingCars ?? []).map((car) => car.id);

    query = query.in("car_id", carIds.length ? carIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  /* ------------------------------------------------------------------------ */
  /*                                TAG FILTER                                */
  /* ------------------------------------------------------------------------ */

  const tagIds = parseLeadTagIds(filters);

  if (tagIds.length > 0) {
    const { data: tagLinks } = await supabase.from("lead_tag_links").select("lead_id").in("tag_id", tagIds);

    const typedTagLinks = (tagLinks ?? []) as LeadTagLinkRow[];

    const leadIds = Array.from(new Set(typedTagLinks.map((link) => link.lead_id)));

    query = query.in("id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  return query;
}

/* -------------------------------------------------------------------------- */
/*                                    SORT                                    */
/* -------------------------------------------------------------------------- */

interface LeadSortConfig {
  column: string;
  ascending: boolean;
  foreignTable?: string;
}

const SORT_MAP: Record<string, LeadSortConfig> = {
  newest: {
    column: "created_at",
    ascending: false,
  },

  oldest: {
    column: "created_at",
    ascending: true,
  },

  "recently-updated": {
    column: "last_activity_at",
    ascending: false,
  },

  "next-follow-up": {
    column: "next_follow_up_at",
    ascending: true,
  },

  "hot-leads": {
    column: "temperature",
    ascending: true,
  },

  "customer-name": {
    column: "full_name",
    ascending: true,
    foreignTable: "customer",
  },
};

/* -------------------------------------------------------------------------- */
/*                                  KANBAN                                    */
/* -------------------------------------------------------------------------- */

export interface LeadKanbanData {
  stages: LeadStage[];

  leadsByStage: Record<string, LeadSummary[]>;
}

interface RawKanbanLeadRow {
  id: string;

  lead_number: string;

  temperature: LeadTemperature;

  source_detail: string | null;

  assigned_staff_id: string | null;

  next_follow_up_at: string | null;

  last_activity_at: string | null;

  created_at: string;

  stage_id: string;

  stage: LeadStage;

  customer: {
    id: string;
    full_name: string;
    customer_number: string;
    phone: string;
  };

  car: {
    id: string;
    display_title: string;
    stock_id: string;

    brand: {
      name: string;
    } | null;
  } | null;

  source: {
    name: string;
  } | null;
}

interface StaffProfileRow {
  id: string;
  full_name: string | null;
}

interface GetLeadsForKanbanParams {
  search?: string;
  sort?: string;
  filters?: LeadFilters;
}

export async function getLeadsForKanban({
  search,
  sort = "newest",
  filters = {},
}: GetLeadsForKanbanParams = {}): Promise<LeadKanbanData> {
  const supabase = await createClient();

  const { data: stagesData } = await supabase
    .from("lead_stages")
    .select("id, name, slug, stage_type, color_hex, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");

  const stages = (stagesData ?? []) as LeadStage[];

  const idQuery = await buildFilteredLeadsQuery({
    supabase,
    search,
    filters,
  });

  const { data: idRows, error: idError } = await idQuery;

  if (idError) {
    console.error("getLeadsForKanban (filter resolution) error:", idError);
  }

  const typedIdRows = (idRows ?? []) as IdRow[];

  const allowedIds = typedIdRows.map((row) => row.id);

  const leadsByStage: Record<string, LeadSummary[]> = {};

  stages.forEach((stage) => {
    leadsByStage[stage.id] = [];
  });

  const hasFilters = Boolean(search) || Object.keys(filters).length > 0;

  if (hasFilters && allowedIds.length === 0) {
    return {
      stages,
      leadsByStage,
    };
  }

  let dataQuery = supabase.from("leads").select(`
      id,
      lead_number,
      temperature,
      source_detail,
      assigned_staff_id,
      next_follow_up_at,
      last_activity_at,
      created_at,
      stage_id,
      stage:lead_stages(
        id,
        name,
        slug,
        stage_type,
        color_hex,
        sort_order,
        is_active
      ),
      customer:customer_profiles(
        id,
        full_name,
        customer_number,
        phone
      ),
      car:cars(
        id,
        display_title,
        stock_id,
        brand:brands(name)
      ),
      source:customer_sources(name)
    `);

  if (hasFilters) {
    dataQuery = dataQuery.in("id", allowedIds);
  }

  const sortConfig = SORT_MAP[sort] ?? SORT_MAP.newest;

  if (sortConfig.foreignTable) {
    dataQuery = dataQuery.order(sortConfig.column, {
      ascending: sortConfig.ascending,

      foreignTable: sortConfig.foreignTable,
    });
  } else {
    dataQuery = dataQuery.order(sortConfig.column, {
      ascending: sortConfig.ascending,

      nullsFirst: false,
    });
  }

  const { data: leadsData, error } = await dataQuery;

  if (error) {
    console.error("getLeadsForKanban error:", error);

    return {
      stages,
      leadsByStage,
    };
  }

  const rawLeads = (leadsData ?? []) as unknown as RawKanbanLeadRow[];

  /* ----------------------------- Staff lookup ----------------------------- */

  const staffIds = new Set<string>();

  rawLeads.forEach((lead) => {
    if (lead.assigned_staff_id) {
      staffIds.add(lead.assigned_staff_id);
    }
  });

  let profiles: StaffProfileRow[] = [];

  if (staffIds.size > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(staffIds));

    profiles = (profileData ?? []) as StaffProfileRow[];
  }

  const staffName = (id: string | null): string | null => {
    if (!id) {
      return null;
    }

    return profiles.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  /* ------------------------------ Tag lookup ------------------------------ */

  const leadIds = rawLeads.map((lead) => lead.id);

  const tagsByLead = new Map<string, LeadSummary["tags"]>();

  if (leadIds.length > 0) {
    const { data: tagLinks } = await supabase
      .from("lead_tag_links")
      .select(
        `
        lead_id,
        tag:lead_tags(
          id,
          name,
          slug,
          color_hex
        )
      `,
      )
      .in("lead_id", leadIds);

    const typedTagLinks = (tagLinks ?? []) as unknown as LeadTagWithRelationRow[];

    typedTagLinks.forEach((row) => {
      if (!row.tag) {
        return;
      }

      const existing = tagsByLead.get(row.lead_id) ?? [];

      existing.push(row.tag);

      tagsByLead.set(row.lead_id, existing);
    });
  }

  /* -------------------------- Build lead summaries ------------------------- */

  rawLeads.forEach((raw) => {
    const summary: LeadSummary = {
      id: raw.id,

      lead_number: raw.lead_number,

      stage: raw.stage,

      temperature: raw.temperature,

      source_name: raw.source?.name ?? null,

      source_detail: raw.source_detail,

      customer: raw.customer,

      vehicle: raw.car
        ? {
            id: raw.car.id,

            display_title: raw.car.display_title,

            brand_name: raw.car.brand?.name ?? null,

            stock_id: raw.car.stock_id,
          }
        : null,

      assigned_staff_id: raw.assigned_staff_id,

      assigned_staff_name: staffName(raw.assigned_staff_id),

      tags: tagsByLead.get(raw.id) ?? [],

      next_follow_up_at: raw.next_follow_up_at,

      last_activity_at: raw.last_activity_at,

      created_at: raw.created_at,
    };

    if (!leadsByStage[raw.stage_id]) {
      leadsByStage[raw.stage_id] = [];
    }

    leadsByStage[raw.stage_id].push(summary);
  });

  return {
    stages,
    leadsByStage,
  };
}

/* -------------------------------------------------------------------------- */
/*                                TABLE VIEW                                  */
/* -------------------------------------------------------------------------- */

export interface LeadRow {
  id: string;
  lead_number: string;
  customer_name: string;
  customer_number: string;
  vehicle_title: string | null;
  brand_name: string | null;
  source_name: string | null;

  stage: {
    name: string;
    color_hex: string;
    stage_type: string;
  };

  temperature: LeadTemperature;

  assigned_staff_name: string | null;

  next_follow_up_at: string | null;

  last_activity_at: string | null;

  created_at: string;

  archived_at: string | null;
}

interface RawTableLeadRow {
  id: string;

  lead_number: string;

  temperature: LeadTemperature;

  assigned_staff_id: string | null;

  next_follow_up_at: string | null;

  last_activity_at: string | null;

  created_at: string;

  archived_at: string | null;

  stage: {
    name: string;
    color_hex: string;
    stage_type: string;
  };

  customer: {
    full_name: string;
    customer_number: string;
  };

  car: {
    display_title: string;

    brand: {
      name: string;
    } | null;
  } | null;

  source: {
    name: string;
  } | null;
}

interface GetLeadRowsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  filters?: LeadFilters;
  archived?: boolean;
}

export async function getLeadRows({
  page = 1,
  pageSize = 25,
  search,
  sort = "newest",
  filters = {},
  archived = false,
}: GetLeadRowsParams) {
  const supabase = await createClient();

  const idQuery = await buildFilteredLeadsQuery({
    supabase,
    search,
    filters,
    archived,
  });

  const { data: idRows, error: idError } = await idQuery;

  if (idError) {
    console.error("getLeadRows (filter resolution) error:", idError);
  }

  const typedIdRows = (idRows ?? []) as IdRow[];

  const allowedIds = typedIdRows.map((row) => row.id);

  // Archived view always needs the id-filtered path
  // because archived=true is itself a real filter.
  const needsIdFilter = Boolean(search) || Object.keys(filters).length > 0 || archived;

  if (needsIdFilter && allowedIds.length === 0) {
    return {
      rows: [] as LeadRow[],
      totalCount: 0,
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase.from("leads").select(
    `
      id,
      lead_number,
      temperature,
      assigned_staff_id,
      next_follow_up_at,
      last_activity_at,
      created_at,
      archived_at,
      stage:lead_stages(
        name,
        color_hex,
        stage_type
      ),
      customer:customer_profiles(
        full_name,
        customer_number
      ),
      car:cars(
        display_title,
        brand:brands(name)
      ),
      source:customer_sources(name)
    `,
    {
      count: "exact",
    },
  );

  if (needsIdFilter) {
    dataQuery = dataQuery.in("id", allowedIds);
  } else {
    dataQuery = dataQuery.is("archived_at", null);
  }

  const sortConfig = SORT_MAP[sort] ?? SORT_MAP.newest;

  if (sortConfig.foreignTable) {
    dataQuery = dataQuery.order(sortConfig.column, {
      ascending: sortConfig.ascending,
      foreignTable: sortConfig.foreignTable,
    });
  } else {
    dataQuery = dataQuery.order(sortConfig.column, {
      ascending: sortConfig.ascending,
      nullsFirst: false,
    });
  }

  dataQuery = dataQuery.range(from, to);

  const { data, error, count } = await dataQuery;

  if (error) {
    console.error("getLeadRows error:", error);

    return {
      rows: [] as LeadRow[],
      totalCount: 0,
    };
  }

  const rawRows = (data ?? []) as unknown as RawTableLeadRow[];

  const staffIds = new Set<string>();

  rawRows.forEach((row) => {
    if (row.assigned_staff_id) {
      staffIds.add(row.assigned_staff_id);
    }
  });

  let profiles: StaffProfileRow[] = [];

  if (staffIds.size > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(staffIds));

    profiles = (profileData ?? []) as StaffProfileRow[];
  }

  const staffName = (id: string | null): string | null => {
    if (!id) {
      return null;
    }

    return profiles.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  const rows: LeadRow[] = rawRows.map((row) => ({
    id: row.id,
    lead_number: row.lead_number,
    customer_name: row.customer.full_name,
    customer_number: row.customer.customer_number,
    vehicle_title: row.car?.display_title ?? null,
    brand_name: row.car?.brand?.name ?? null,
    source_name: row.source?.name ?? null,
    stage: row.stage,
    temperature: row.temperature,
    assigned_staff_name: staffName(row.assigned_staff_id),
    next_follow_up_at: row.next_follow_up_at,
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
    archived_at: row.archived_at,
  }));

  return {
    rows,
    totalCount: count ?? 0,
  };
}
