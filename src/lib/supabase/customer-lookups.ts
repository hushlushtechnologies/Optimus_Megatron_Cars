import { createClient } from "@/src/lib/supabase/server";

export interface CustomerTag {
  id: string;
  name: string;
  color_hex: string;
}

export interface StaffOption {
  id: string;
  full_name: string;
}

export interface CustomerFilterLookups {
  sources: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  tags: CustomerTag[];
  staff: StaffOption[];
}

export async function getCustomerFilterLookups(): Promise<CustomerFilterLookups> {
  const supabase = await createClient();

  const [sources, locations, tags, staff] = await Promise.all([
    supabase.from("customer_sources").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("customer_tags").select("id, name, color_hex").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return {
    sources: sources.data ?? [],
    locations: locations.data ?? [],
    tags: (tags.data ?? []) as CustomerTag[],
    staff: (staff.data ?? []) as StaffOption[],
  };
}
