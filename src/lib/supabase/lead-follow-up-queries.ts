import { createClient } from "@/src/lib/supabase/server";
import type { LeadFollowUp } from "@/src/lib/types/lead";

export async function getLeadFollowUps(leadId: string): Promise<LeadFollowUp[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_follow_ups")
    .select("*")
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: false });

  return (data ?? []) as LeadFollowUp[];
}
