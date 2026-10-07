import { createClient } from "@/src/lib/supabase/server";

import type { LeadStage, LeadSummary, LeadTemperature } from "@/src/lib/types/lead";

/* =========================================================
   METRICS
========================================================= */

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

  /* =========================================================
     STAGES
  ========================================================= */

  const { data: stages, error: stagesError } = await supabase
    .from("lead_stages")
    .select("id, slug, stage_type");

  if (stagesError) {
    console.error("getLeadMetrics stages error:", stagesError);
  }

  const newStageId = stages?.find((stage) => stage.slug === "new")?.id;

  const openStageIds = (stages ?? []).filter((stage) => stage.stage_type === "open").map((stage) => stage.id);

  const wonStageIds = (stages ?? []).filter((stage) => stage.stage_type === "won").map((stage) => stage.id);

  const lostStageIds = (stages ?? []).filter((stage) => stage.stage_type === "lost").map((stage) => stage.id);

  /* =========================================================
     COUNT HELPERS
  ========================================================= */

  function baseQuery() {
    return supabase.from("leads").select("*", {
      count: "exact",
      head: true,
    });
  }

  const countWhere = (build: (query: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) =>
    build(baseQuery());

  /* =========================================================
     METRIC COUNTS
  ========================================================= */

  const [totalRes, newLeadsRes, followUpsDueRes, hotLeadsRes, wonRes, lostRes] = await Promise.all([
    countWhere((query) => query),

    newStageId
      ? countWhere((query) => query.eq("stage_id", newStageId))
      : Promise.resolve({
          count: 0,
        }),

    openStageIds.length > 0
      ? countWhere((query) =>
          query
            .in("stage_id", openStageIds)
            .lte("next_follow_up_at", new Date().toISOString())
            .not("next_follow_up_at", "is", null),
        )
      : Promise.resolve({
          count: 0,
        }),

    openStageIds.length > 0
      ? countWhere((query) => query.in("stage_id", openStageIds).eq("temperature", "Hot"))
      : Promise.resolve({
          count: 0,
        }),

    wonStageIds.length > 0
      ? countWhere((query) => query.in("stage_id", wonStageIds))
      : Promise.resolve({
          count: 0,
        }),

    lostStageIds.length > 0
      ? countWhere((query) => query.in("stage_id", lostStageIds))
      : Promise.resolve({
          count: 0,
        }),
  ]);

  /* =========================================================
     7 DAY TREND
  ========================================================= */

  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentLeads, error: recentLeadsError } = await supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (recentLeadsError) {
    console.error("getLeadMetrics recent leads error:", recentLeadsError);
  }

  const totalTrend = Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const day = new Date(sevenDaysAgo);

      day.setDate(day.getDate() + index);

      const dayKey = day.toDateString();

      return (recentLeads ?? []).filter((lead) => new Date(lead.created_at).toDateString() === dayKey).length;
    },
  );

  const totalChange = (totalTrend[6] ?? 0) - (totalTrend[5] ?? 0);

  /* =========================================================
     RETURN
  ========================================================= */

  return {
    total: totalRes.count ?? 0,

    totalChange,

    totalTrend,

    newLeads: newLeadsRes.count ?? 0,

    followUpsDue: followUpsDueRes.count ?? 0,

    hotLeads: hotLeadsRes.count ?? 0,

    won: wonRes.count ?? 0,

    lost: lostRes.count ?? 0,
  };
}

/* =========================================================
   KANBAN TYPES
========================================================= */

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

/* =========================================================
   LEAD TAG TYPES
========================================================= */

type LeadTag = LeadSummary["tags"][number];

type LeadTagRelation = LeadTag | LeadTag[] | null;

interface LeadTagLinkRow {
  lead_id: string;
  tag: LeadTagRelation;
}

/* =========================================================
   STAFF TYPES
========================================================= */

interface StaffProfileRow {
  id: string;

  full_name: string | null;
}

/* =========================================================
   KANBAN DATA
========================================================= */

export async function getLeadsForKanban(): Promise<LeadKanbanData> {
  const supabase = await createClient();

  /* =========================================================
     STAGES
  ========================================================= */

  const { data: stagesData, error: stagesError } = await supabase
    .from("lead_stages")
    .select(
      `
        id,
        name,
        slug,
        stage_type,
        color_hex,
        sort_order,
        is_active
      `,
    )
    .eq("is_active", true)
    .order("sort_order");

  if (stagesError) {
    console.error("getLeadsForKanban stages error:", stagesError);
  }

  const stages = (stagesData ?? []) as LeadStage[];

  /* =========================================================
     LEADS
  ========================================================= */

  const { data: leadsData, error } = await supabase
    .from("leads")
    .select(
      `
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
          brand:brands(
            name
          )
        ),

        source:customer_sources(
          name
        )
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("getLeadsForKanban error:", error);

    const empty: Record<string, LeadSummary[]> = {};

    for (const stage of stages) {
      empty[stage.id] = [];
    }

    return {
      stages,
      leadsByStage: empty,
    };
  }

  const rawLeads = (leadsData ?? []) as unknown as RawKanbanLeadRow[];

  /* =========================================================
     STAFF NAMES
  ========================================================= */

  const staffIds = new Set<string>();

  for (const lead of rawLeads) {
    if (lead.assigned_staff_id) {
      staffIds.add(lead.assigned_staff_id);
    }
  }

  let profiles: StaffProfileRow[] = [];

  if (staffIds.size > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(staffIds));

    if (profileError) {
      console.error("getLeadsForKanban profiles error:", profileError);
    }

    profiles = (profileData ?? []) as StaffProfileRow[];
  }

  const staffName = (id: string | null): string | null => {
    if (!id) {
      return null;
    }

    return profiles.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  /* =========================================================
     TAGS
  ========================================================= */

  const leadIds = rawLeads.map((lead) => lead.id);

  const tagsByLead = new Map<string, LeadSummary["tags"]>();

  if (leadIds.length > 0) {
    const { data: tagLinksData, error: tagLinksError } = await supabase
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

    if (tagLinksError) {
      console.error("getLeadsForKanban tags error:", tagLinksError);
    }

    const tagLinks = (tagLinksData ?? []) as unknown as LeadTagLinkRow[];

    for (const row of tagLinks) {
      if (!row.tag) {
        continue;
      }

      const tags = Array.isArray(row.tag) ? row.tag : [row.tag];

      const existing = tagsByLead.get(row.lead_id) ?? [];

      existing.push(...tags);

      tagsByLead.set(row.lead_id, existing);
    }
  }

  /* =========================================================
     GROUP LEADS BY STAGE
  ========================================================= */

  const leadsByStage: Record<string, LeadSummary[]> = {};

  for (const stage of stages) {
    leadsByStage[stage.id] = [];
  }

  for (const raw of rawLeads) {
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

      /* =================================================
           NEW FIELD
        ================================================= */

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
  }

  return {
    stages,
    leadsByStage,
  };
}

/* =========================================================
   TABLE VIEW - PHASE 6
========================================================= */

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

  /* =========================================================
     NEW FIELD
  ========================================================= */

  assigned_staff_id: string | null;

  assigned_staff_name: string | null;

  next_follow_up_at: string | null;

  last_activity_at: string | null;

  created_at: string;
}

interface RawTableLeadRow {
  id: string;

  lead_number: string;

  temperature: LeadTemperature;

  assigned_staff_id: string | null;

  next_follow_up_at: string | null;

  last_activity_at: string | null;

  created_at: string;

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
}

/* =========================================================
   TABLE ROWS
========================================================= */

export async function getLeadRows({ page = 1, pageSize = 25 }: GetLeadRowsParams) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;

  const to = from + pageSize - 1;

  /* =========================================================
     LEADS
  ========================================================= */

  const { data, error, count } = await supabase
    .from("leads")
    .select(
      `
        id,
        lead_number,
        temperature,
        assigned_staff_id,
        next_follow_up_at,
        last_activity_at,
        created_at,

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
          brand:brands(
            name
          )
        ),

        source:customer_sources(
          name
        )
      `,
      {
        count: "exact",
      },
    )
    .order("created_at", {
      ascending: false,
    })
    .range(from, to);

  if (error) {
    console.error("getLeadRows error:", error);

    return {
      rows: [] as LeadRow[],

      totalCount: 0,
    };
  }

  const rawRows = (data ?? []) as unknown as RawTableLeadRow[];

  /* =========================================================
     STAFF NAMES
  ========================================================= */

  const staffIds = new Set<string>();

  for (const row of rawRows) {
    if (row.assigned_staff_id) {
      staffIds.add(row.assigned_staff_id);
    }
  }

  let profiles: StaffProfileRow[] = [];

  if (staffIds.size > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(staffIds));

    if (profileError) {
      console.error("getLeadRows profiles error:", profileError);
    }

    profiles = (profileData ?? []) as StaffProfileRow[];
  }

  const staffName = (id: string | null): string | null => {
    if (!id) {
      return null;
    }

    return profiles.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  /* =========================================================
     FINAL TABLE ROWS
  ========================================================= */

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

    /* =================================================
           NEW FIELD
        ================================================= */

    assigned_staff_id: row.assigned_staff_id,

    assigned_staff_name: staffName(row.assigned_staff_id),

    next_follow_up_at: row.next_follow_up_at,

    last_activity_at: row.last_activity_at,

    created_at: row.created_at,
  }));

  return {
    rows,

    totalCount: count ?? 0,
  };
}
