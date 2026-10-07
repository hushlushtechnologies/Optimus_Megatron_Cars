import { createClient } from "@/src/lib/supabase/client";

export interface EnrichedLeadActivityEntry {
  id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changedByName: string;
  relatedCar: { id: string; display_title: string } | null;
}

export async function getLeadActivity(leadId: string): Promise<EnrichedLeadActivityEntry[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("changed_at", { ascending: false });

  const entries = data ?? [];
  if (entries.length === 0) return [];

  const userIds = new Set<string>();
  const carIds = new Set<string>();
  entries.forEach((e) => {
    if (e.changed_by) userIds.add(e.changed_by);
    if (e.related_car_id) carIds.add(e.related_car_id);
  });

  const [{ data: profiles }, { data: cars }] = await Promise.all([
    userIds.size
      ? supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds))
      : Promise.resolve({ data: [] }),
    carIds.size
      ? supabase.from("cars").select("id, display_title").in("id", Array.from(carIds))
      : Promise.resolve({ data: [] }),
  ]);

  const nameOf = (id: string | null) =>
    id ? (profiles?.find((p) => p.id === id)?.full_name ?? "Unknown") : "System";
  const carOf = (id: string | null) => (id ? (cars?.find((c) => c.id === id) ?? null) : null);

  return entries.map((e) => ({
    id: e.id,
    activity_type: e.activity_type,
    description: e.description,
    old_value: e.old_value,
    new_value: e.new_value,
    changed_at: e.changed_at,
    changedByName: nameOf(e.changed_by),
    relatedCar: carOf(e.related_car_id),
  }));
}
