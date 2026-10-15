import { createClient } from "@/src/lib/supabase/server";
import type { LeadFilters } from "@/src/lib/utils/lead-filters";
import { buildLeadListQuery, type LeadListRow } from "@/src/lib/supabase/lead-list-query";

export interface LeadExportRow {
  lead_number: string;
  customer_name: string;
  customer_number: string;
  vehicle_title: string | null;
  brand_name: string | null;
  source_name: string | null;
  stage_name: string;
  temperature: string;
  assigned_staff_name: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  last_activity_at: string | null;
  lost_reason_name: string | null;
}

const EXPORT_ROW_LIMIT = 2000;

interface GetLeadExportRowsParams {
  scope: "current" | "selected";
  ids?: string[];
  search?: string;
  archived?: boolean;
  filters?: LeadFilters;
}

export async function getLeadExportRows({
  scope,
  ids,
  search,
  archived = false,
  filters = {},
}: GetLeadExportRowsParams): Promise<LeadExportRow[]> {
  const supabase = await createClient();

  // "Current" uses exactly the same filter definition as the Table and
  // Kanban; "selected" ignores filters and archive state, because a
  // hand-picked selection is a more precise signal of intent.
  let query;
  if (scope === "selected") {
    if (!ids || ids.length === 0) return [];
    query = buildLeadListQuery(supabase, { includeArchived: true }).in("id", ids);
  } else {
    query = buildLeadListQuery(supabase, { search, filters, archived });
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(EXPORT_ROW_LIMIT);

  if (error) {
    console.error("getLeadExportRows error:", error);
    return [];
  }

  return ((data ?? []) as unknown as LeadListRow[]).map((r) => ({
    lead_number: r.lead_number,
    customer_name: r.customer_name,
    customer_number: r.customer_number,
    vehicle_title: r.vehicle_title,
    brand_name: r.brand_name,
    source_name: r.source_name,
    stage_name: r.stage_name,
    temperature: r.temperature,
    assigned_staff_name: r.staff_name,
    next_follow_up_at: r.next_follow_up_at,
    created_at: r.created_at,
    last_activity_at: r.last_activity_at,
    lost_reason_name: r.lost_reason_name,
  }));
}
