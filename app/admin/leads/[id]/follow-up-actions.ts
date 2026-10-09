"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/src/lib/supabase/server";

import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

import { getLeadFollowUps } from "@/src/lib/supabase/lead-follow-up-queries";

import type { FollowUpType, LeadFollowUp } from "@/src/lib/types/lead";

/* =========================================================
   GET FOLLOW-UPS
========================================================= */

export async function getLeadFollowUpsAction(leadId: string): Promise<LeadFollowUp[]> {
  return getLeadFollowUps(leadId);
}

/* =========================================================
   LOG ACTIVITY
========================================================= */

async function logFollowUpActivity(
  leadId: string,
  activityType: string,
  description: string,
  changedBy: string | null,
) {
  const supabase = await createClient();

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,

    activity_type: activityType,

    description,

    changed_by: changedBy,
  });

  if (error) {
    console.error("logFollowUpActivity error:", error);
  }
}

/* =========================================================
   DATE / TIME
========================================================= */

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time || "09:00"}`).toISOString();
}

/* =========================================================
   CREATE FOLLOW-UP
========================================================= */

export async function createFollowUp(
  leadId: string,
  type: FollowUpType,
  date: string,
  time: string,
  notes: string,
) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  if (!date) {
    return {
      error: "A follow-up date is required.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("lead_follow_ups").insert({
    lead_id: leadId,

    type,

    scheduled_at: combineDateTime(date, time),

    notes: notes.trim() || null,
  });

  if (error) {
    console.error("createFollowUp error:", error);

    return {
      error: "Unable to schedule this follow-up. Please try again.",
    };
  }

  await logFollowUpActivity(leadId, "follow_up_created", `Follow-up scheduled: ${type}`, user?.id ?? null);

  revalidatePath(`/admin/leads/${leadId}`);

  return {
    error: null,
  };
}

/* =========================================================
   EDIT FOLLOW-UP
========================================================= */

export async function editFollowUp(
  followUpId: string,
  leadId: string,
  type: FollowUpType,
  date: string,
  time: string,
  notes: string,
) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  if (!date) {
    return {
      error: "A follow-up date is required.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({
      type,

      scheduled_at: combineDateTime(date, time),

      notes: notes.trim() || null,

      updated_at: new Date().toISOString(),
    })
    .eq("id", followUpId);

  if (error) {
    console.error("editFollowUp error:", error);

    return {
      error: "Unable to update this follow-up. Please try again.",
    };
  }

  revalidatePath(`/admin/leads/${leadId}`);

  return {
    error: null,
  };
}

/* =========================================================
   COMPLETE FOLLOW-UP
========================================================= */

export async function completeFollowUp(followUpId: string, leadId: string) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: followUp, error: fetchError } = await supabase
    .from("lead_follow_ups")
    .select("type")
    .eq("id", followUpId)
    .maybeSingle();

  if (fetchError) {
    console.error("completeFollowUp fetch error:", fetchError);
  }

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({
      status: "Completed",

      updated_at: new Date().toISOString(),
    })
    .eq("id", followUpId);

  if (error) {
    console.error("completeFollowUp error:", error);

    return {
      error: "Unable to mark this follow-up complete. Please try again.",
    };
  }

  await logFollowUpActivity(
    leadId,
    "follow_up_completed",
    `Follow-up completed: ${followUp?.type ?? "Follow-up"}`,
    user?.id ?? null,
  );

  revalidatePath(`/admin/leads/${leadId}`);

  return {
    error: null,
  };
}

/* =========================================================
   CANCEL FOLLOW-UP
========================================================= */

export async function cancelFollowUp(followUpId: string, leadId: string) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: followUp, error: fetchError } = await supabase
    .from("lead_follow_ups")
    .select("type")
    .eq("id", followUpId)
    .maybeSingle();

  if (fetchError) {
    console.error("cancelFollowUp fetch error:", fetchError);
  }

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({
      status: "Cancelled",

      updated_at: new Date().toISOString(),
    })
    .eq("id", followUpId);

  if (error) {
    console.error("cancelFollowUp error:", error);

    return {
      error: "Unable to cancel this follow-up. Please try again.",
    };
  }

  await logFollowUpActivity(
    leadId,
    "follow_up_cancelled",
    `Follow-up cancelled: ${followUp?.type ?? "Follow-up"}`,
    user?.id ?? null,
  );

  revalidatePath(`/admin/leads/${leadId}`);

  return {
    error: null,
  };
}

/* =========================================================
   MARK FOLLOW-UP MISSED
========================================================= */

export async function markFollowUpMissed(followUpId: string, leadId: string) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: followUp, error: fetchError } = await supabase
    .from("lead_follow_ups")
    .select("type")
    .eq("id", followUpId)
    .maybeSingle();

  if (fetchError) {
    console.error("markFollowUpMissed fetch error:", fetchError);
  }

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({
      status: "Missed",

      updated_at: new Date().toISOString(),
    })
    .eq("id", followUpId);

  if (error) {
    console.error("markFollowUpMissed error:", error);

    return {
      error: "Unable to update this follow-up. Please try again.",
    };
  }

  await logFollowUpActivity(
    leadId,
    "follow_up_missed",
    `Follow-up marked missed: ${followUp?.type ?? "Follow-up"}`,
    user?.id ?? null,
  );

  revalidatePath(`/admin/leads/${leadId}`);

  return {
    error: null,
  };
}

/* =========================================================
   RESCHEDULE FOLLOW-UP
========================================================= */

export async function rescheduleFollowUp(
  followUpId: string,
  leadId: string,
  newDate: string,
  newTime: string,
) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  if (!newDate) return { error: "A new date is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: original } = await supabase
    .from("lead_follow_ups")
    .select("type, notes, status")
    .eq("id", followUpId)
    .single();

  if (!original) return { error: "This follow-up could not be found." };
  if (original.status !== "Scheduled") {
    return { error: "Only scheduled follow-ups can be rescheduled." };
  }

  // New row first, old row second: a Rescheduled follow-up is now final, so
  // if the second step fails we remove the new row instead of trying to
  // reopen the old one.
  const { data: replacement, error: insertError } = await supabase
    .from("lead_follow_ups")
    .insert({
      lead_id: leadId,
      type: original.type,
      scheduled_at: combineDateTime(newDate, newTime),
      notes: original.notes,
    })
    .select("id")
    .single();

  if (insertError || !replacement) {
    console.error("rescheduleFollowUp (create new) error:", insertError);
    return { error: "Unable to reschedule this follow-up. Please try again." };
  }

  const { error: updateError } = await supabase
    .from("lead_follow_ups")
    .update({ status: "Rescheduled", updated_at: new Date().toISOString() })
    .eq("id", followUpId);

  if (updateError) {
    console.error("rescheduleFollowUp (mark old) error:", updateError);
    await supabase.from("lead_follow_ups").delete().eq("id", replacement.id);
    return { error: "Unable to reschedule this follow-up. Please try again." };
  }

  await logFollowUpActivity(
    leadId,
    "follow_up_rescheduled",
    `Follow-up rescheduled: ${original.type} moved to ${new Date(combineDateTime(newDate, newTime)).toLocaleDateString()}`,
    user?.id ?? null,
  );

  revalidatePath(`/admin/leads/${leadId}`);
  return { error: null };
}
