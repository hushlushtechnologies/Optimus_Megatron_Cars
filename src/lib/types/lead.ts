export type LeadTemperature = "Hot" | "Warm" | "Cold";
export type StageType = "open" | "won" | "lost";
export type FollowUpType =
  "Phone Call" | "WhatsApp" | "Email" | "Showroom Visit" | "Test Drive" | "General Follow-Up";
export type FollowUpStatus = "Scheduled" | "Completed" | "Missed" | "Rescheduled" | "Cancelled";

export interface LeadStage {
  id: string;
  name: string;
  slug: string;
  stage_type: StageType;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
}

export interface Lead {
  id: string;
  lead_number: string;
  customer_id: string;
  car_id: string | null;
  stage_id: string;
  temperature: LeadTemperature;
  source_id: string | null;
  source_detail: string | null;
  assigned_staff_id: string | null;
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  won_at: string | null;
  won_by: string | null;
  won_notes: string | null;
  lost_at: string | null;
  lost_by: string | null;
  lost_reason_id: string | null;
  lost_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduled_at: string;
  notes: string | null;
  reminder_minutes_before: number | null;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note_text: string;
  is_internal: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface LeadActivityEntry {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  related_car_id: string | null;
  changed_by: string | null;
  changed_at: string;
}

// --- Display/enriched types, added Phase 2 for the reusable components below.
// These describe what a rendered Lead card/header actually needs — the real
// Supabase queries that produce data in this shape arrive in Phase 3 (Kanban/
// Table) and Phase 8 (Detail page); nothing here talks to the database.

export interface LeadTag {
  id: string;
  name: string;
  slug: string;
  color_hex: string;
}

export interface LeadLostReason {
  id: string;
  name: string;
  slug: string;
}

export interface LeadSummaryCustomer {
  id: string;
  full_name: string;
  customer_number: string;
  phone: string;
}

export interface LeadSummaryVehicle {
  id: string;
  display_title: string;
  brand_name: string | null;
  stock_id: string;
}

export interface LeadSummary {
  id: string;
  lead_number: string;
  stage: LeadStage;
  temperature: LeadTemperature;
  source_name: string | null;
  source_detail: string | null;
  customer: LeadSummaryCustomer;
  vehicle: LeadSummaryVehicle | null;
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  tags: LeadTag[];
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  created_at: string;
}
