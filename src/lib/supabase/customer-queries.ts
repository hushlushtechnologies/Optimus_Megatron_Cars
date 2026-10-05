import { createClient } from "@/src/lib/supabase/server";

import type { CustomerFilters } from "@/src/lib/utils/customer-filters";
import { parseTagIds } from "@/src/lib/utils/customer-filters";

/* =========================================================
   CUSTOMER METRICS
========================================================= */

export interface CustomerMetrics {
  total: number;
  totalChange: number;
  totalTrend: number[];

  active: number;
  newToday: number;
  newThisMonth: number;
  withActiveDeals: number;
  inactive: number;
}

interface GetCustomerMetricsParams {
  archived?: boolean;
}

export async function getCustomerMetrics({
  archived = false,
}: GetCustomerMetricsParams = {}): Promise<CustomerMetrics> {
  const supabase = await createClient();

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  /* ---------------------------------------------------------
     BUILD METRIC QUERIES
  --------------------------------------------------------- */

  const totalQuery = supabase.from("customer_profiles").select("*", {
    count: "exact",
    head: true,
  });

  const activeQuery = supabase
    .from("customer_profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("lifecycle_status", "Active");

  const newTodayQuery = supabase
    .from("customer_profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("created_at", startOfToday.toISOString());

  const newThisMonthQuery = supabase
    .from("customer_profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("created_at", startOfMonth.toISOString());

  const inactiveQuery = supabase
    .from("customer_profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("lifecycle_status", "Inactive");

  /*
   * We also get the IDs in the current archive scope.
   *
   * This allows "withActiveDeals" to respect
   * active vs archived customer view.
   */
  const scopedCustomerIdsQuery = supabase.from("customer_profiles").select("id");

  const [totalRes, activeRes, newTodayRes, newThisMonthRes, inactiveRes, activeDealsRes, scopedCustomersRes] =
    await Promise.all([
      archived ? totalQuery.not("archived_at", "is", null) : totalQuery.is("archived_at", null),

      archived ? activeQuery.not("archived_at", "is", null) : activeQuery.is("archived_at", null),

      archived ? newTodayQuery.not("archived_at", "is", null) : newTodayQuery.is("archived_at", null),

      archived ? newThisMonthQuery.not("archived_at", "is", null) : newThisMonthQuery.is("archived_at", null),

      archived ? inactiveQuery.not("archived_at", "is", null) : inactiveQuery.is("archived_at", null),

      supabase.from("customer_vehicle_relations").select("customer_id").eq("relationship_status", "Active"),

      archived
        ? scopedCustomerIdsQuery.not("archived_at", "is", null)
        : scopedCustomerIdsQuery.is("archived_at", null),
    ]);

  /* ---------------------------------------------------------
     ACTIVE DEAL COUNT
  --------------------------------------------------------- */

  const scopedCustomerIds = new Set((scopedCustomersRes.data ?? []).map((customer) => customer.id));

  const withActiveDeals = new Set(
    (activeDealsRes.data ?? [])
      .filter((relation) => scopedCustomerIds.has(relation.customer_id))
      .map((relation) => relation.customer_id),
  ).size;

  /* ---------------------------------------------------------
     7 DAY TREND
  --------------------------------------------------------- */

  const sevenDaysAgo = new Date(startOfToday);

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  let recentCustomersQuery = supabase
    .from("customer_profiles")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  recentCustomersQuery = archived
    ? recentCustomersQuery.not("archived_at", "is", null)
    : recentCustomersQuery.is("archived_at", null);

  const { data: recentCustomers, error: recentCustomersError } = await recentCustomersQuery;

  if (recentCustomersError) {
    console.error(
      `[getCustomerMetrics:recentCustomers]
code: ${recentCustomersError.code ?? "unknown"}
message: ${recentCustomersError.message ?? "unknown"}
details: ${recentCustomersError.details ?? "none"}
hint: ${recentCustomersError.hint ?? "none"}`,
    );
  }

  const totalTrend = Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const day = new Date(sevenDaysAgo);

      day.setDate(day.getDate() + index);

      const dayKey = day.toDateString();

      return (recentCustomers ?? []).filter(
        (customer) => new Date(customer.created_at).toDateString() === dayKey,
      ).length;
    },
  );

  const totalChange = (totalTrend[6] ?? 0) - (totalTrend[5] ?? 0);

  return {
    total: totalRes.count ?? 0,

    totalChange,

    totalTrend,

    active: activeRes.count ?? 0,

    newToday: newTodayRes.count ?? 0,

    newThisMonth: newThisMonthRes.count ?? 0,

    withActiveDeals,

    inactive: inactiveRes.count ?? 0,
  };
}

/* =========================================================
   CUSTOMER ROW TYPES
========================================================= */

export interface CustomerRow {
  id: string;
  customer_number: string;
  full_name: string;
  email: string;
  phone: string;

  lifecycle_status: string;
  account_status: string;

  created_at: string;
  last_activity_at: string | null;

  archived_at: string | null;

  profile_photo_url: string | null;

  location: {
    name: string;
  } | null;

  source: {
    name: string;
  } | null;

  primary_relationship_manager: {
    full_name: string;
  } | null;

  activeDealsCount: number;
  purchasedCount: number;

  tags: {
    id: string;
    name: string;
    color_hex: string;
  }[];
}

interface GetCustomerRowsParams {
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  filters?: CustomerFilters;

  archived?: boolean;
}

/* =========================================================
   SORTING
========================================================= */

const CUSTOMER_SORT_MAP: Record<
  string,
  {
    column: string;
    ascending: boolean;
  }
> = {
  newest: {
    column: "created_at",
    ascending: false,
  },

  oldest: {
    column: "created_at",
    ascending: true,
  },

  "recently-active": {
    column: "last_activity_at",
    ascending: false,
  },

  "name-asc": {
    column: "full_name",
    ascending: true,
  },

  "name-desc": {
    column: "full_name",
    ascending: false,
  },
};

/* =========================================================
   INTERNAL TYPES
========================================================= */

interface RawCustomerRow {
  id: string;
  customer_number: string;
  full_name: string;
  email: string;
  phone: string;

  lifecycle_status: string;
  account_status: string;

  created_at: string;

  last_activity_at: string | null;

  archived_at: string | null;

  profile_photo_url: string | null;

  location: {
    name: string;
  } | null;

  source: {
    name: string;
  } | null;

  primary_relationship_manager: {
    full_name: string;
  } | null;
}

interface CustomerListTag {
  id: string;
  name: string;
  color_hex: string;
}

type CustomerTagRelation = CustomerListTag | CustomerListTag[] | null;

interface CustomerTagLinkRow {
  customer_id: string;
  tag: CustomerTagRelation;
}

interface CustomerVehicleRelationRow {
  customer_id: string;

  relationship_type: string | null;

  relationship_status: string | null;
}

/* =========================================================
   GET CUSTOMER ROWS
========================================================= */

export async function getCustomerRows({
  search,
  sort = "newest",
  page = 1,
  pageSize = 25,
  filters = {},
  archived = false,
}: GetCustomerRowsParams) {
  const supabase = await createClient();

  /* =========================================================
     JUNCTION FILTERS
  ========================================================= */

  const idFilterSets: string[][] = [];

  /* ---------------------------------------------------------
     TAG FILTER
  --------------------------------------------------------- */

  const tagIds = parseTagIds(filters);

  if (tagIds.length > 0) {
    const { data, error } = await supabase
      .from("customer_tag_links")
      .select("customer_id")
      .in("tag_id", tagIds);

    if (error) {
      console.error(
        `[getCustomerRows:tagFilter]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
      );
    }

    idFilterSets.push(Array.from(new Set((data ?? []).map((row) => row.customer_id))));
  }

  /* ---------------------------------------------------------
     ACTIVE DEAL FILTER
  --------------------------------------------------------- */

  if (filters.hasActiveDeals) {
    const { data, error } = await supabase
      .from("customer_vehicle_relations")
      .select("customer_id")
      .eq("relationship_status", "Active");

    if (error) {
      console.error(
        `[getCustomerRows:activeDealsFilter]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
      );
    }

    idFilterSets.push(Array.from(new Set((data ?? []).map((row) => row.customer_id))));
  }

  /* ---------------------------------------------------------
     PURCHASED FILTER
  --------------------------------------------------------- */

  if (filters.hasPurchased) {
    const { data, error } = await supabase
      .from("customer_vehicle_relations")
      .select("customer_id")
      .eq("relationship_type", "Purchased");

    if (error) {
      console.error(
        `[getCustomerRows:purchasedFilter]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
      );
    }

    idFilterSets.push(Array.from(new Set((data ?? []).map((row) => row.customer_id))));
  }

  /*
   * If any active junction filter
   * matches zero customers, there
   * cannot be a final result.
   */

  if (idFilterSets.some((set) => set.length === 0)) {
    return {
      rows: [] as CustomerRow[],

      totalCount: 0,
    };
  }

  /* ---------------------------------------------------------
     INTERSECT FILTER IDS
  --------------------------------------------------------- */

  const allowedIds =
    idFilterSets.length > 0
      ? idFilterSets.reduce((accumulator, set) => accumulator.filter((id) => set.includes(id)))
      : null;

  /* =========================================================
     MAIN CUSTOMER QUERY
  ========================================================= */

  let query = supabase.from("customer_profiles").select(
    `
          id,
          customer_number,
          full_name,
          email,
          phone,
          lifecycle_status,
          account_status,
          created_at,
          last_activity_at,
          archived_at,
          profile_photo_url,
          location:locations(name),
          source:customer_sources(name),
          primary_relationship_manager:profiles!customer_profiles_primary_relationship_manager_profile_fkey(
            full_name
          )
        `,
    {
      count: "exact",
    },
  );

  /* ---------------------------------------------------------
     ARCHIVED / ACTIVE VIEW
  --------------------------------------------------------- */

  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  /* ---------------------------------------------------------
     ALLOWED IDS
  --------------------------------------------------------- */

  if (allowedIds) {
    query = query.in("id", allowedIds);
  }

  /* ---------------------------------------------------------
     SEARCH
  --------------------------------------------------------- */

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,customer_number.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  /* ---------------------------------------------------------
     FILTERS
  --------------------------------------------------------- */

  if (filters.status) {
    query = query.eq("lifecycle_status", filters.status);
  }

  if (filters.accountStatus) {
    query = query.eq("account_status", filters.accountStatus);
  }

  if (filters.source) {
    query = query.eq("source_id", filters.source);
  }

  if (filters.location) {
    query = query.eq("location_id", filters.location);
  }

  if (filters.prm) {
    query = query.eq("primary_relationship_manager_id", filters.prm);
  }

  if (filters.joinedFrom) {
    query = query.gte("created_at", filters.joinedFrom);
  }

  if (filters.joinedTo) {
    query = query.lte("created_at", `${filters.joinedTo}T23:59:59`);
  }

  /* ---------------------------------------------------------
     SORT
  --------------------------------------------------------- */

  const sortConfig = CUSTOMER_SORT_MAP[sort] ?? CUSTOMER_SORT_MAP.newest;

  query = query.order(sortConfig.column, {
    ascending: sortConfig.ascending,

    nullsFirst: false,
  });

  /* ---------------------------------------------------------
     PAGINATION
  --------------------------------------------------------- */

  const from = (page - 1) * pageSize;

  const to = from + pageSize - 1;

  query = query.range(from, to);

  /* ---------------------------------------------------------
     EXECUTE
  --------------------------------------------------------- */

  const { data, error, count } = await query;

  if (error) {
    console.error(
      `[getCustomerRows]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
    );

    return {
      rows: [] as CustomerRow[],

      totalCount: 0,
    };
  }

  /* =========================================================
     NORMALIZE ROWS
  ========================================================= */

  const rawRows = (data ?? []) as unknown as RawCustomerRow[];

  const customerIds = rawRows.map((customer) => customer.id);

  /* =========================================================
     DEAL COUNTS
  ========================================================= */

  const dealCounts = new Map<
    string,
    {
      active: number;
      purchased: number;
    }
  >();

  /* =========================================================
     TAGS
  ========================================================= */

  const tagsByCustomer = new Map<string, CustomerListTag[]>();

  if (customerIds.length > 0) {
    const [relationsResult, tagsResult] = await Promise.all([
      supabase
        .from("customer_vehicle_relations")
        .select(
          `
              customer_id,
              relationship_type,
              relationship_status
            `,
        )
        .in("customer_id", customerIds),

      supabase
        .from("customer_tag_links")
        .select(
          `
              customer_id,
              tag:customer_tags(
                id,
                name,
                color_hex
              )
            `,
        )
        .in("customer_id", customerIds),
    ]);

    /* -------------------------------------------------------
       VEHICLE RELATIONS
    ------------------------------------------------------- */

    if (relationsResult.error) {
      console.error(
        `[getCustomerRows:relations]
code: ${relationsResult.error.code ?? "unknown"}
message: ${relationsResult.error.message ?? "unknown"}
details: ${relationsResult.error.details ?? "none"}
hint: ${relationsResult.error.hint ?? "none"}`,
      );
    }

    const relations = (relationsResult.data ?? []) as unknown as CustomerVehicleRelationRow[];

    for (const relation of relations) {
      const current = dealCounts.get(relation.customer_id) ?? {
        active: 0,
        purchased: 0,
      };

      if (relation.relationship_status === "Active") {
        current.active += 1;
      }

      if (relation.relationship_type === "Purchased") {
        current.purchased += 1;
      }

      dealCounts.set(relation.customer_id, current);
    }

    /* -------------------------------------------------------
       TAG RELATIONS
    ------------------------------------------------------- */

    if (tagsResult.error) {
      console.error(
        `[getCustomerRows:tags]
code: ${tagsResult.error.code ?? "unknown"}
message: ${tagsResult.error.message ?? "unknown"}
details: ${tagsResult.error.details ?? "none"}
hint: ${tagsResult.error.hint ?? "none"}`,
      );
    }

    const tagLinks = (tagsResult.data ?? []) as unknown as CustomerTagLinkRow[];

    for (const row of tagLinks) {
      if (!row.tag) {
        continue;
      }

      const tags = Array.isArray(row.tag) ? row.tag : [row.tag];

      const existing = tagsByCustomer.get(row.customer_id) ?? [];

      existing.push(...tags);

      tagsByCustomer.set(row.customer_id, existing);
    }
  }

  /* =========================================================
     FINAL ROWS
  ========================================================= */

  const rows: CustomerRow[] = rawRows.map((customer) => ({
    ...customer,

    activeDealsCount: dealCounts.get(customer.id)?.active ?? 0,

    purchasedCount: dealCounts.get(customer.id)?.purchased ?? 0,

    tags: tagsByCustomer.get(customer.id) ?? [],
  }));

  return {
    rows,
    totalCount: count ?? 0,
  };
}
