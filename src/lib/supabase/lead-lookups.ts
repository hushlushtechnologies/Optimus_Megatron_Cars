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

export interface LeadFilterLookups {
  stages: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
  sources: { id: string; name: string }[];
  temperatures: { value: string; label: string }[];
  tags: { id: string; name: string; color_hex: string }[];
  brands: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  lostReasons: { id: string; name: string }[];
}

export async function getLeadFilterLookups(): Promise<LeadFilterLookups> {
  const supabase = await createClient();

  const [stages, staff, sources, tags, brands, locations, lostReasons] = await Promise.all([
    supabase.from("lead_stages").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("customer_sources").select("id, name").order("sort_order"),
    supabase.from("lead_tags").select("id, name, color_hex").eq("is_active", true).order("sort_order"),
    supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("lead_lost_reasons").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  return {
    stages: stages.data ?? [],
    staff: staff.data ?? [],
    sources: sources.data ?? [],
    temperatures: [
      { value: "Hot", label: "Hot" },
      { value: "Warm", label: "Warm" },
      { value: "Cold", label: "Cold" },
    ],
    tags: tags.data ?? [],
    brands: brands.data ?? [],
    locations: locations.data ?? [],
    lostReasons: lostReasons.data ?? [],
  };
}
