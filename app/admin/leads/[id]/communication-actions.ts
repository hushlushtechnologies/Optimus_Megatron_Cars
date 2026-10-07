"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import type { CommunicationType } from "@/src/lib/supabase/lead-communications-queries";

export async function logLeadCommunication(
  leadId: string,
  customerId: string,
  type: CommunicationType,
  subject: string,
  summary: string,
  relatedCarId: string | null,
) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  if (!summary.trim()) return { error: "Summary is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("customer_communications").insert({
    customer_id: customerId,
    related_lead_id: leadId,
    type,
    subject: subject.trim() || null,
    summary: summary.trim(),
    related_car_id: relatedCarId,
    staff_id: user?.id,
  });

  if (error) {
    console.error("logLeadCommunication error:", error);
    return { error: "Unable to log this communication. Please try again." };
  }

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "communication_logged",
    description: `${type} logged${subject.trim() ? `: ${subject.trim()}` : ""}`,
    related_car_id: relatedCarId,
    changed_by: user?.id ?? null,
  });

  revalidatePath(`/admin/leads/${leadId}`);
  return { error: null };
}
