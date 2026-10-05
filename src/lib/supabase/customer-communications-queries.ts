import { createClient } from "@/src/lib/supabase/server";
import type { CustomerCommunication } from "@/src/lib/types/customer";

export interface EnrichedCommunication extends CustomerCommunication {
  staffName: string;
  relatedVehicleTitle: string | null;
}

export async function getCustomerCommunications(customerId: string): Promise<EnrichedCommunication[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_communications")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const staffIds = new Set<string>();
  const carIds = new Set<string>();
  rows.forEach((r) => {
    if (r.staff_id) staffIds.add(r.staff_id);
    if (r.related_car_id) carIds.add(r.related_car_id);
  });

  const [{ data: profiles }, { data: cars }] = await Promise.all([
    staffIds.size
      ? supabase.from("profiles").select("id, full_name").in("id", Array.from(staffIds))
      : Promise.resolve({ data: [] }),
    carIds.size
      ? supabase.from("cars").select("id, display_title").in("id", Array.from(carIds))
      : Promise.resolve({ data: [] }),
  ]);

  return rows.map((r) => ({
    ...r,
    staffName: profiles?.find((p) => p.id === r.staff_id)?.full_name ?? "Unknown",
    relatedVehicleTitle: cars?.find((c) => c.id === r.related_car_id)?.display_title ?? null,
  }));
}
