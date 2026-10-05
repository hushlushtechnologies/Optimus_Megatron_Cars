"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/src/lib/supabase/server";

import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

/* =========================================================
   TYPES
========================================================= */

export type CommunicationType = "WhatsApp" | "Email" | "Phone Call" | "Internal Note";

/* =========================================================
   LOG COMMUNICATION
========================================================= */

export async function logCommunication(
  customerId: string,
  type: CommunicationType,
  subject: string,
  summary: string,
  relatedCarId: string | null,
) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  if (!summary.trim()) {
    return {
      error: "Summary is required.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("customer_communications").insert({
    customer_id: customerId,

    type,

    subject: subject.trim() || null,

    summary: summary.trim(),

    related_car_id: relatedCarId,

    staff_id: user?.id,
  });

  if (error) {
    console.error("logCommunication error:", error);

    return {
      error: "Unable to log this communication. Please try again.",
    };
  }

  await supabase.from("customer_activity").insert({
    customer_id: customerId,

    activity_type: "communication_logged",

    description: `${type} logged${subject.trim() ? `: ${subject.trim()}` : ""}`,

    related_car_id: relatedCarId,
  });

  revalidatePath(`/admin/customers/${customerId}`);

  return {
    error: null,
  };
}
