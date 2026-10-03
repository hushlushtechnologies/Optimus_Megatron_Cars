import { createClient } from "@/src/lib/supabase/server";
import type { CustomerFilters } from "@/src/lib/utils/customer-filters";
import { parseTagIds } from "@/src/lib/utils/customer-filters";

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

export async function getCustomerMetrics(): Promise<CustomerMetrics> {
  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRes, activeRes, newTodayRes, newThisMonthRes, inactiveRes, activeDealsRes] = await Promise.all([
    supabase.from("customer_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("customer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("lifecycle_status", "Active"),
    supabase
      .from("customer_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("customer_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("customer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("lifecycle_status", "Inactive"),
    supabase.from("customer_vehicle_relations").select("customer_id").eq("relationship_status", "Active"),
  ]);

  const withActiveDeals = new Set((activeDealsRes.data ?? []).map((row) => row.customer_id)).size;

  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data: recentCustomers } = await supabase
    .from("customer_profiles")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  const totalTrend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + i);
    const dayKey = day.toDateString();
    return (recentCustomers ?? []).filter((c) => new Date(c.created_at).toDateString() === dayKey).length;
  });

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
  profile_photo_url: string | null;
  location: { name: string } | null;
  source: { name: string } | null;
  primary_relationship_manager: { full_name: string } | null;
  activeDealsCount: number;
  purchasedCount: number;
}

interface GetCustomerRowsParams {
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  filters?: CustomerFilters;
}

const CUSTOMER_SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  "recently-active": { column: "last_activity_at", ascending: false },
  "name-asc": { column: "full_name", ascending: true },
  "name-desc": { column: "full_name", ascending: false },
};

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
  profile_photo_url: string | null;
  location: { name: string } | null;
  source: { name: string } | null;
  primary_relationship_manager: { full_name: string } | null;
}

export async function getCustomerRows({
  search,
  sort = "newest",
  page = 1,
  pageSize = 25,
  filters = {},
}: GetCustomerRowsParams) {
  const supabase = await createClient();

  // Junction-table filters resolve to a customer-id allowlist first,
  // since PostgREST can't express "has a matching row in another table"
  // as a plain column filter the way `.eq()`/`.gte()` can.
  const idFilterSets: string[][] = [];

  const tagIds = parseTagIds(filters);
  if (tagIds.length > 0) {
    const { data } = await supabase.from("customer_tag_links").select("customer_id").in("tag_id", tagIds);
    idFilterSets.push(Array.from(new Set((data ?? []).map((r) => r.customer_id))));
  }

  if (filters.hasActiveDeals) {
    const { data } = await supabase
      .from("customer_vehicle_relations")
      .select("customer_id")
      .eq("relationship_status", "Active");
    idFilterSets.push(Array.from(new Set((data ?? []).map((r) => r.customer_id))));
  }

  if (filters.hasPurchased) {
    const { data } = await supabase
      .from("customer_vehicle_relations")
      .select("customer_id")
      .eq("relationship_type", "Purchased");
    idFilterSets.push(Array.from(new Set((data ?? []).map((r) => r.customer_id))));
  }

  // If any junction-table filter is active but matched zero customers,
  // the whole query is empty — return early rather than querying with
  // an empty .in() array, which Postgres would otherwise reject.
  if (idFilterSets.some((set) => set.length === 0)) {
    return { rows: [] as CustomerRow[], totalCount: 0 };
  }

  const allowedIds =
    idFilterSets.length > 0 ? idFilterSets.reduce((acc, set) => acc.filter((id) => set.includes(id))) : null;

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
      profile_photo_url,
      location:locations(name),
      source:customer_sources(name),
      primary_relationship_manager:profiles!customer_profiles_primary_relationship_manager_profile_fkey(
        full_name
      )
    `,
    { count: "exact" },
  );

  if (allowedIds) query = query.in("id", allowedIds);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,customer_number.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }
  if (filters.status) query = query.eq("lifecycle_status", filters.status);
  if (filters.accountStatus) query = query.eq("account_status", filters.accountStatus);
  if (filters.source) query = query.eq("source_id", filters.source);
  if (filters.location) query = query.eq("location_id", filters.location);
  if (filters.prm) query = query.eq("primary_relationship_manager_id", filters.prm);
  if (filters.joinedFrom) query = query.gte("created_at", filters.joinedFrom);
  if (filters.joinedTo) query = query.lte("created_at", `${filters.joinedTo}T23:59:59`);

  const sortConfig = CUSTOMER_SORT_MAP[sort] ?? CUSTOMER_SORT_MAP.newest;
  query = query.order(sortConfig.column, {
    ascending: sortConfig.ascending,
    nullsFirst: false,
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

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

  const rawRows = (data ?? []) as unknown as RawCustomerRow[];
  const customerIds = rawRows.map((c) => c.id);
  const dealCounts = new Map<string, { active: number; purchased: number }>();

  if (customerIds.length > 0) {
    const { data: relations } = await supabase
      .from("customer_vehicle_relations")
      .select("customer_id, relationship_type, relationship_status")
      .in("customer_id", customerIds);

    (relations ?? []).forEach((r) => {
      const entry = dealCounts.get(r.customer_id) ?? {
        active: 0,
        purchased: 0,
      };
      if (r.relationship_status === "Active") entry.active += 1;
      if (r.relationship_type === "Purchased") entry.purchased += 1;
      dealCounts.set(r.customer_id, entry);
    });
  }

  const rows: CustomerRow[] = rawRows.map((c) => ({
    ...c,
    activeDealsCount: dealCounts.get(c.id)?.active ?? 0,
    purchasedCount: dealCounts.get(c.id)?.purchased ?? 0,
  }));

  return { rows, totalCount: count ?? 0 };
}
