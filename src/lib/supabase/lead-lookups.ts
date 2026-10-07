import { createClient } from "@/src/lib/supabase/server";

export interface AddLeadLookups {
  stages: { id: string; name: string; color_hex: string; stage_type: string }[];
  sources: { id: string; name: string; requires_detail: boolean }[];
  tags: { id: string; name: string; color_hex: string }[];
  staff: { id: string; full_name: string }[];
}

export async function getAddLeadLookups(): Promise<AddLeadLookups> {
  const supabase = await createClient();

  const [stages, sources, tags, staff] = await Promise.all([
    supabase
      .from("lead_stages")
      .select("id, name, color_hex, stage_type")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("customer_sources").select("id, name, requires_detail").order("sort_order"),
    supabase.from("lead_tags").select("id, name, color_hex").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return {
    stages: stages.data ?? [],
    sources: sources.data ?? [],
    tags: tags.data ?? [],
    staff: staff.data ?? [],
  };
}

export interface StaffOption {
  id: string;
  full_name: string;
}

export async function getStaffOptions(): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
  return data ?? [];
}

export async function getLeadTagOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_tags")
    .select("id, name, slug, color_hex")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getLeadLostReasons() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_lost_reasons")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export interface LeadFutureAction {
  id: string;
  key: string;
  label: string;
  description: string;
  icon_name: string;
}

export async function getLeadFutureActions(): Promise<LeadFutureAction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_future_actions")
    .select("id, key, label, description, icon_name")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}
