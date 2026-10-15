import type { createClient } from "@/src/lib/supabase/server";
import { parseLeadTagIds, type LeadFilters } from "@/src/lib/utils/lead-filters";
import type { LeadTag, LeadTemperature } from "@/src/lib/types/lead";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface LeadListRow {
  id: string;
  lead_number: string;
  created_at: string;
  archived_at: string | null;
  stage_id: string;
  stage_name: string;
  stage_color: string;
  stage_type: string;
  stage_sort_order: number;
  temperature: LeadTemperature;
  source_name: string | null;
  source_detail: string | null;
  assigned_staff_id: string | null;
  staff_name: string | null;
  customer_id: string;
  customer_name: string;
  customer_number: string;
  customer_phone: string;
  car_id: string | null;
  vehicle_title: string | null;
  stock_id: string | null;
  brand_name: string | null;
  lost_reason_name: string | null;
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  closed_at: string | null;
  tags: LeadTag[];
}

export const LEAD_LIST_COLUMNS = [
  "id",
  "lead_number",
  "created_at",
  "archived_at",
  "stage_id",
  "stage_name",
  "stage_color",
  "stage_type",
  "stage_sort_order",
  "temperature",
  "source_name",
  "source_detail",
  "assigned_staff_id",
  "staff_name",
  "customer_id",
  "customer_name",
  "customer_number",
  "customer_phone",
  "car_id",
  "vehicle_title",
  "stock_id",
  "brand_name",
  "lost_reason_name",
  "next_follow_up_at",
  "last_activity_at",
  "closed_at",
  "tags",
].join(", ");

// Every sort column is a plain column on lead_list. Temperature stays a
// Postgres enum there, which sorts in declaration order (Hot, Warm, Cold).
export const LEAD_SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  "recently-updated": { column: "last_activity_at", ascending: false },
  "next-follow-up": { column: "next_follow_up_at", ascending: true },
  "hot-leads": { column: "temperature", ascending: true },
  "customer-name": { column: "customer_name", ascending: true },
};

export function getLeadSortConfig(sort: string) {
  return LEAD_SORT_MAP[sort] ?? LEAD_SORT_MAP.newest;
}

// Characters that have meaning inside a PostgREST .or() filter or an ilike
// pattern. Left in, a search for "Smith, John" breaks the query.
function sanitizeSearchTerm(raw?: string): string {
  return (raw ?? "")
    .replace(/[%,()\\*"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface LeadListQueryOptions {
  search?: string;
  filters?: LeadFilters;
  archived?: boolean;
  /** Ignore archived state entirely (used for "export these selected leads"). */
  includeArchived?: boolean;
  count?: boolean;
}

/**
 * The single definition of what search and filters mean for leads. The Table,
 * the Kanban board and the exports all build on this, so "what I'm looking at"
 * and "what I export" can never drift apart. It returns a query builder, so
 * callers add their own ordering, range or limit.
 */
export function buildLeadListQuery(supabase: SupabaseServerClient, options: LeadListQueryOptions = {}) {
  const { search, filters = {}, archived = false, includeArchived = false, count = false } = options;

  let query = supabase.from("lead_list").select(LEAD_LIST_COLUMNS, count ? { count: "exact" } : undefined);

  if (!includeArchived) {
    query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  }

  const term = sanitizeSearchTerm(search);
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      [
        `lead_number.ilike.${pattern}`,
        `customer_name.ilike.${pattern}`,
        `customer_number.ilike.${pattern}`,
        `customer_phone.ilike.${pattern}`,
        `vehicle_title.ilike.${pattern}`,
        `stock_id.ilike.${pattern}`,
        `brand_name.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (filters.stage) query = query.eq("stage_id", filters.stage);
  if (filters.assignedStaff) query = query.eq("assigned_staff_id", filters.assignedStaff);
  if (filters.source) query = query.eq("source_id", filters.source);
  if (filters.temperature) query = query.eq("temperature", filters.temperature);
  if (filters.vehicle) query = query.eq("car_id", filters.vehicle);
  if (filters.brand) query = query.eq("brand_id", filters.brand);
  if (filters.location) query = query.eq("location_id", filters.location);
  if (filters.lostReason) query = query.eq("lost_reason_id", filters.lostReason);
  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters.createdTo) query = query.lte("created_at", `${filters.createdTo}T23:59:59`);

  if (filters.followUpStatus === "overdue") {
    query = query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", new Date().toISOString());
  } else if (filters.followUpStatus === "upcoming") {
    query = query.not("next_follow_up_at", "is", null).gt("next_follow_up_at", new Date().toISOString());
  } else if (filters.followUpStatus === "none") {
    query = query.is("next_follow_up_at", null);
  }

  const tagIds = parseLeadTagIds(filters);
  if (tagIds.length > 0) {
    // "Has at least one of these tags": a single array-overlap check
    // instead of resolving lead ids first.
    query = query.overlaps("tag_ids", tagIds);
  }

  return query;
}
