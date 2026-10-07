import { createClient } from "@/src/lib/supabase/client";

export type CommunicationType = "WhatsApp" | "Email" | "Phone Call" | "Internal Note";

export interface LeadCommunication {
  id: string;
  type: CommunicationType;
  subject: string | null;
  summary: string;
  staff_id: string | null;
  related_car_id: string | null;
  created_at: string;
}

export interface EnrichedLeadCommunication extends LeadCommunication {
  staffName: string;
  relatedVehicleTitle: string | null;
}

export async function getLeadCommunications(leadId: string): Promise<EnrichedLeadCommunication[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("customer_communications")
    .select("id, type, subject, summary, staff_id, related_car_id, created_at")
    .eq("related_lead_id", leadId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as LeadCommunication[];
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
