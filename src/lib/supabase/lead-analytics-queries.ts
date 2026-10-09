import { createClient } from "@/src/lib/supabase/server";

export interface LeadStageCount {
  stage_id: string;
  stage_name: string;
  stage_type: string;
  sort_order: number;
  lead_count: number;
}

// Source, staff, brand and vehicle views all share this shape on purpose,
// so a future generic chart component can render any of them.
export interface LeadDimensionBreakdown {
  dimension_id: string | null;
  label: string;
  total: number;
  open_count: number;
  won_count: number;
  lost_count: number;
  win_rate: number | null;
}

export interface LeadVehicleBreakdown extends LeadDimensionBreakdown {
  brand_name: string | null;
}

export interface LeadLostReasonCount {
  dimension_id: string | null;
  label: string;
  total: number;
}

export interface LeadOutcomes {
  total_leads: number;
  open_leads: number;
  won_leads: number;
  lost_leads: number;
  win_rate: number | null;
  avg_days_to_win: number | null;
}

export interface LeadFollowUpCompletion {
  staff_id: string | null;
  staff_name: string;
  total_follow_ups: number;
  completed: number;
  missed: number;
  cancelled: number;
  rescheduled: number;
  scheduled: number;
  overdue_open: number;
  completion_rate: number | null;
}

export interface LeadCreationTrendPoint {
  day: string;
  leads_created: number;
}

export interface LeadStageFunnelRow {
  stage_id: string;
  stage_name: string;
  stage_type: string;
  sort_order: number;
  leads_entered: number;
  pct_of_all_leads: number | null;
  avg_hours_in_stage: number | null;
}

export interface LeadStageTransition {
  from_stage_id: string | null;
  from_stage_name: string | null;
  to_stage_id: string | null;
  to_stage_name: string | null;
  transitions: number;
}

async function readView<T>(
  view: string,
  orderBy?: { column: string; ascending: boolean },
  limit?: number,
): Promise<T[]> {
  const supabase = await createClient();
  let query = supabase.from(view).select("*");
  if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error(`readView(${view}) error:`, error);
    return [];
  }
  return (data ?? []) as unknown as T[];
}

export const getLeadsByStage = () =>
  readView<LeadStageCount>("lead_analytics_by_stage", { column: "sort_order", ascending: true });

export const getLeadsBySource = () =>
  readView<LeadDimensionBreakdown>("lead_analytics_by_source", { column: "total", ascending: false });

export const getLeadsByStaff = () =>
  readView<LeadDimensionBreakdown>("lead_analytics_by_staff", { column: "total", ascending: false });

export const getLeadsByBrand = () =>
  readView<LeadDimensionBreakdown>("lead_analytics_by_brand", { column: "total", ascending: false });

export const getLeadsByVehicle = (limit = 20) =>
  readView<LeadVehicleBreakdown>("lead_analytics_by_vehicle", { column: "total", ascending: false }, limit);

export const getLostReasonBreakdown = () =>
  readView<LeadLostReasonCount>("lead_analytics_lost_reasons", { column: "total", ascending: false });

export const getFollowUpCompletionByStaff = () =>
  readView<LeadFollowUpCompletion>("lead_analytics_follow_up_by_staff", {
    column: "total_follow_ups",
    ascending: false,
  });

export const getStageFunnel = () =>
  readView<LeadStageFunnelRow>("lead_analytics_stage_funnel", { column: "sort_order", ascending: true });

export const getStageTransitions = () =>
  readView<LeadStageTransition>("lead_analytics_stage_transitions", {
    column: "transitions",
    ascending: false,
  });

export async function getLeadOutcomes(): Promise<LeadOutcomes | null> {
  const rows = await readView<LeadOutcomes>("lead_analytics_outcomes");
  return rows[0] ?? null;
}

// Only days that have at least one lead are returned. Filling the gaps with
// zeros is a charting concern for whichever UI consumes this later.
export async function getLeadCreationTrend(days = 30): Promise<LeadCreationTrendPoint[]> {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from("lead_analytics_creation_trend")
    .select("*")
    .gte("day", cutoff.toISOString().slice(0, 10))
    .order("day", { ascending: true });

  if (error) {
    console.error("getLeadCreationTrend error:", error);
    return [];
  }
  return (data ?? []) as unknown as LeadCreationTrendPoint[];
}

export interface LeadAnalyticsSnapshot {
  outcomes: LeadOutcomes | null;
  byStage: LeadStageCount[];
  bySource: LeadDimensionBreakdown[];
  byStaff: LeadDimensionBreakdown[];
  byBrand: LeadDimensionBreakdown[];
  byVehicle: LeadVehicleBreakdown[];
  lostReasons: LeadLostReasonCount[];
  followUps: LeadFollowUpCompletion[];
  creationTrend: LeadCreationTrendPoint[];
  stageFunnel: LeadStageFunnelRow[];
  stageTransitions: LeadStageTransition[];
}

export async function getLeadAnalyticsSnapshot(): Promise<LeadAnalyticsSnapshot> {
  const [
    outcomes,
    byStage,
    bySource,
    byStaff,
    byBrand,
    byVehicle,
    lostReasons,
    followUps,
    creationTrend,
    stageFunnel,
    stageTransitions,
  ] = await Promise.all([
    getLeadOutcomes(),
    getLeadsByStage(),
    getLeadsBySource(),
    getLeadsByStaff(),
    getLeadsByBrand(),
    getLeadsByVehicle(),
    getLostReasonBreakdown(),
    getFollowUpCompletionByStaff(),
    getLeadCreationTrend(),
    getStageFunnel(),
    getStageTransitions(),
  ]);

  return {
    outcomes,
    byStage,
    bySource,
    byStaff,
    byBrand,
    byVehicle,
    lostReasons,
    followUps,
    creationTrend,
    stageFunnel,
    stageTransitions,
  };
}
