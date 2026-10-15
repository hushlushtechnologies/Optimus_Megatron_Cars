import { createClient } from "@/src/lib/supabase/server";
import type { LeadStage, LeadSummary, LeadTemperature } from "@/src/lib/types/lead";
import type { LeadFilters } from "@/src/lib/utils/lead-filters";
import { buildLeadListQuery, getLeadSortConfig, type LeadListRow } from "@/src/lib/supabase/lead-list-query";
import { KANBAN_CLOSED_LEAD_CAP, KANBAN_OPEN_LEAD_CAP } from "@/src/lib/utils/lead-limits";

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

const dubaiDay = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

export async function getLeadMetrics(): Promise<LeadMetrics> {
  const supabase = await createClient();

  const { data: stages } = await supabase.from("lead_stages").select("id, slug, stage_type");

  const newStageId = stages?.find((s) => s.slug === "new")?.id;
  const openStageIds = (stages ?? []).filter((s) => s.stage_type === "open").map((s) => s.id);
  const wonStageIds = (stages ?? []).filter((s) => s.stage_type === "won").map((s) => s.id);
  const lostStageIds = (stages ?? []).filter((s) => s.stage_type === "lost").map((s) => s.id);

  // Archived leads are excluded from every card, matching the table.
  function baseQuery() {
    return supabase.from("leads").select("*", { count: "exact", head: true }).is("archived_at", null);
  }
  const countWhere = (build: (q: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) =>
    build(baseQuery());

  const trendDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dubaiDay(d);
  });

  const [totalRes, newLeadsRes, followUpsDueRes, hotLeadsRes, wonRes, lostRes, trendRes] = await Promise.all([
    countWhere((q) => q),
    newStageId ? countWhere((q) => q.eq("stage_id", newStageId)) : Promise.resolve({ count: 0 }),
    openStageIds.length
      ? countWhere((q) =>
          q
            .in("stage_id", openStageIds)
            .lte("next_follow_up_at", new Date().toISOString())
            .not("next_follow_up_at", "is", null),
        )
      : Promise.resolve({ count: 0 }),
    openStageIds.length
      ? countWhere((q) => q.in("stage_id", openStageIds).eq("temperature", "Hot"))
      : Promise.resolve({ count: 0 }),
    wonStageIds.length ? countWhere((q) => q.in("stage_id", wonStageIds)) : Promise.resolve({ count: 0 }),
    lostStageIds.length ? countWhere((q) => q.in("stage_id", lostStageIds)) : Promise.resolve({ count: 0 }),
    // Pre-aggregated by Phase 21's view: at most 7 small rows instead of
    // pulling every recent lead just to count them in JavaScript.
    supabase.from("lead_analytics_creation_trend").select("day, leads_created").gte("day", trendDays[0]),
  ]);

  const perDay = new Map<string, number>(
    ((trendRes.data ?? []) as { day: string; leads_created: number }[]).map((r) => [
      r.day,
      Number(r.leads_created),
    ]),
  );
  const totalTrend = trendDays.map((day) => perDay.get(day) ?? 0);

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

export function toLeadSummary(row: LeadListRow, stage: LeadStage): LeadSummary {
  return {
    id: row.id,
    lead_number: row.lead_number,
    stage,
    temperature: row.temperature,
    source_name: row.source_name,
    source_detail: row.source_detail,
    customer: {
      id: row.customer_id,
      full_name: row.customer_name,
      customer_number: row.customer_number,
      phone: row.customer_phone,
    },
    vehicle: row.car_id
      ? {
          id: row.car_id,
          display_title: row.vehicle_title ?? "",
          brand_name: row.brand_name,
          stock_id: row.stock_id ?? "",
        }
      : null,
    assigned_staff_id: row.assigned_staff_id,
    assigned_staff_name: row.staff_name,
    tags: row.tags ?? [],
    next_follow_up_at: row.next_follow_up_at,
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
  };
}

// --- Kanban ---

export interface LeadKanbanData {
  stages: LeadStage[];
  leadsByStage: Record<string, LeadSummary[]>;
  /** True number of matching leads per stage. Closed columns load only the latest few. */
  stageTotals: Record<string, number>;
  /** More open leads matched than the board's cap, so some aren't shown. */
  openTruncated: boolean;
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
  const stagesById = new Map(stages.map((s) => [s.id, s]));
  const openStageIds = stages.filter((s) => s.stage_type === "open").map((s) => s.id);
  const closedStages = stages.filter((s) => s.stage_type !== "open");

  const leadsByStage: Record<string, LeadSummary[]> = {};
  const stageTotals: Record<string, number> = {};
  stages.forEach((s) => {
    leadsByStage[s.id] = [];
    stageTotals[s.id] = 0;
  });

  const sortConfig = getLeadSortConfig(sort);

  const openQuery = openStageIds.length
    ? buildLeadListQuery(supabase, { search, filters, count: true })
        .in("stage_id", openStageIds)
        .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(KANBAN_OPEN_LEAD_CAP)
    : null;

  // Closed columns always show the most recently closed deals first,
  // whatever sort is selected, because that's what the cap keeps.
  const closedQueries = closedStages.map((stage) =>
    buildLeadListQuery(supabase, { search, filters, count: true })
      .eq("stage_id", stage.id)
      .order("closed_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .limit(KANBAN_CLOSED_LEAD_CAP),
  );

  const [openResult, ...closedResults] = await Promise.all([
    openQuery ?? Promise.resolve({ data: [] as LeadListRow[], error: null, count: 0 }),
    ...closedQueries,
  ]);

  if (openResult.error) console.error("getLeadsForKanban (open) error:", openResult.error);

  const openRows = (openResult.data ?? []) as unknown as LeadListRow[];
  openRows.forEach((row) => {
    const stage = stagesById.get(row.stage_id);
    if (stage) leadsByStage[stage.id].push(toLeadSummary(row, stage));
  });
  openStageIds.forEach((id) => {
    stageTotals[id] = leadsByStage[id].length;
  });

  closedResults.forEach((result, index) => {
    const stage = closedStages[index];
    if (result.error) console.error("getLeadsForKanban (closed) error:", result.error);
    const rows = (result.data ?? []) as unknown as LeadListRow[];
    rows.forEach((row) => leadsByStage[stage.id].push(toLeadSummary(row, stage)));
    stageTotals[stage.id] = result.count ?? rows.length;
  });

  return {
    stages,
    leadsByStage,
    stageTotals,
    openTruncated: (openResult.count ?? 0) > openRows.length,
  };
}

// --- Table ---

export interface LeadRow {
  id: string;
  lead_number: string;
  customer_name: string;
  customer_number: string;
  vehicle_title: string | null;
  brand_name: string | null;
  source_name: string | null;
  stage: { name: string; color_hex: string; stage_type: string };
  temperature: LeadTemperature;
  assigned_staff_name: string | null;
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  archived_at: string | null;
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

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortConfig = getLeadSortConfig(sort);

  // The extra created_at/id keys make the order fully deterministic. Without
  // them, rows that tie on the chosen sort (almost every lead on "Hot Leads
  // First") can repeat or vanish between pages.
  const { data, error, count } = await buildLeadListQuery(supabase, {
    search,
    filters,
    archived,
    count: true,
  })
    .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("getLeadRows error:", error);
    return { rows: [] as LeadRow[], totalCount: 0 };
  }

  const rows: LeadRow[] = ((data ?? []) as unknown as LeadListRow[]).map((r) => ({
    id: r.id,
    lead_number: r.lead_number,
    customer_name: r.customer_name,
    customer_number: r.customer_number,
    vehicle_title: r.vehicle_title,
    brand_name: r.brand_name,
    source_name: r.source_name,
    stage: { name: r.stage_name, color_hex: r.stage_color, stage_type: r.stage_type },
    temperature: r.temperature,
    assigned_staff_name: r.staff_name,
    next_follow_up_at: r.next_follow_up_at,
    last_activity_at: r.last_activity_at,
    created_at: r.created_at,
    archived_at: r.archived_at,
  }));

  return { rows, totalCount: count ?? 0 };
}
