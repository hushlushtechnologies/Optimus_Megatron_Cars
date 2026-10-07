"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import type { LeadTemperature } from "@/src/lib/types/lead";

export async function moveLeadStage(leadId: string, newStageId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();

  const { data: current } = await supabase.from("leads").select("stage_id").eq("id", leadId).single();

  if (!current) return { error: "This lead could not be found." };

  if (current.stage_id === newStageId) {
    return { error: null };
  }

  const { data: stageNames } = await supabase
    .from("lead_stages")
    .select("id, name")
    .in("id", [current.stage_id, newStageId]);

  const oldStageName = stageNames?.find((s) => s.id === current.stage_id)?.name ?? "Unknown";
  const newStageName = stageNames?.find((s) => s.id === newStageId)?.name ?? "Unknown";

  const { error } = await supabase.from("leads").update({ stage_id: newStageId }).eq("id", leadId);

  if (error) {
    console.error("moveLeadStage error:", error);
    return { error: "Unable to move this lead. Your changes were not saved." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "stage_changed",
    description: `Stage changed from ${oldStageName} to ${newStageName}`,
    old_value: oldStageName,
    new_value: newStageName,
    changed_by: user?.id ?? null,
  });

  revalidatePath("/admin/leads");
  return { error: null };
}

async function notifyLeadStaffAssignment(
  _leadId: string,
  _newStaffId: string,
  _assignedByUserId: string | null,
): Promise<void> {
  // Intentionally empty until Phase 20.
}

export async function assignLeadStaff(leadId: string, newStaffId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("leads")
    .select("assigned_staff_id")
    .eq("id", leadId)
    .single();

  if (!current) return { error: "This lead could not be found." };

  if (current.assigned_staff_id === newStaffId) {
    return { error: null };
  }

  const idsToResolve = [current.assigned_staff_id, newStaffId].filter(Boolean) as string[];
  const { data: staffProfiles } = idsToResolve.length
    ? await supabase.from("profiles").select("id, full_name").in("id", idsToResolve)
    : { data: [] };

  const previousName = current.assigned_staff_id
    ? (staffProfiles?.find((p) => p.id === current.assigned_staff_id)?.full_name ?? "Unknown")
    : null;
  const newName = staffProfiles?.find((p) => p.id === newStaffId)?.full_name ?? "Unknown";

  const { error } = await supabase.from("leads").update({ assigned_staff_id: newStaffId }).eq("id", leadId);

  if (error) {
    console.error("assignLeadStaff error:", error);
    return { error: "Unable to assign staff. Your changes were not saved." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isReassignment = !!current.assigned_staff_id;

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: isReassignment ? "staff_reassigned" : "staff_assigned",
    description: isReassignment
      ? `Staff reassigned from ${previousName} to ${newName}`
      : `Staff assigned: ${newName}`,
    old_value: previousName,
    new_value: newName,
    changed_by: user?.id ?? null,
  });

  await notifyLeadStaffAssignment(leadId, newStaffId, user?.id ?? null);

  revalidatePath("/admin/leads");
  return { error: null };
}

export async function changeLeadTemperature(leadId: string, newTemperature: LeadTemperature) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();

  const { data: current } = await supabase.from("leads").select("temperature").eq("id", leadId).single();
  if (!current) return { error: "This lead could not be found." };

  if (current.temperature === newTemperature) {
    return { error: null };
  }

  const { error } = await supabase.from("leads").update({ temperature: newTemperature }).eq("id", leadId);

  if (error) {
    console.error("changeLeadTemperature error:", error);
    return { error: "Unable to update temperature. Your changes were not saved." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "temperature_changed",
    description: `Temperature changed from ${current.temperature} to ${newTemperature}`,
    old_value: current.temperature,
    new_value: newTemperature,
    changed_by: user?.id ?? null,
  });

  revalidatePath("/admin/leads");
  return { error: null };
}

async function getLeadWithStageType(leadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("stage_id, stage:lead_stages(stage_type)")
    .eq("id", leadId)
    .single();
  return data as { stage_id: string; stage: { stage_type: string } | null } | null;
}

export async function markLeadWon(leadId: string, notes: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();

  const current = await getLeadWithStageType(leadId);
  if (!current) return { error: "This lead could not be found." };
  if (current.stage?.stage_type !== "open") {
    return { error: "This lead is already closed and can't be marked Won again." };
  }

  const { data: wonStage } = await supabase
    .from("lead_stages")
    .select("id")
    .eq("stage_type", "won")
    .order("sort_order")
    .limit(1)
    .single();

  if (!wonStage) return { error: "No Won stage is configured. Please check pipeline settings." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("leads")
    .update({
      stage_id: wonStage.id,
      won_at: new Date().toISOString(),
      won_by: user?.id ?? null,
      won_notes: notes.trim() || null,
    })
    .eq("id", leadId);

  if (error) {
    console.error("markLeadWon error:", error);
    return { error: "Unable to mark this lead as Won. Please try again." };
  }

  // leads_log_stage_change (Phase 1's trigger) has already recorded the
  // stage move to lead_stage_history — this activity entry is deliberately
  // its own event, not a duplicate "stage_changed" description, since
  // winning a deal is a materially different moment than an ordinary move.
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "won",
    description: "Lead marked as Won",
    new_value: notes.trim() || null,
    changed_by: user?.id ?? null,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { error: null };
}

export async function markLeadLost(leadId: string, lostReasonId: string, notes: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  if (!lostReasonId) return { error: "Select a lost reason." };

  const supabase = await createClient();

  const current = await getLeadWithStageType(leadId);
  if (!current) return { error: "This lead could not be found." };
  if (current.stage?.stage_type !== "open") {
    return { error: "This lead is already closed and can't be marked Lost again." };
  }

  const { data: lostStage } = await supabase
    .from("lead_stages")
    .select("id")
    .eq("stage_type", "lost")
    .order("sort_order")
    .limit(1)
    .single();

  if (!lostStage) return { error: "No Lost stage is configured. Please check pipeline settings." };

  const { data: reason } = await supabase
    .from("lead_lost_reasons")
    .select("name")
    .eq("id", lostReasonId)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("leads")
    .update({
      stage_id: lostStage.id,
      lost_at: new Date().toISOString(),
      lost_by: user?.id ?? null,
      lost_reason_id: lostReasonId,
      lost_notes: notes.trim() || null,
    })
    .eq("id", leadId);

  if (error) {
    console.error("markLeadLost error:", error);
    return { error: "Unable to mark this lead as Lost. Please try again." };
  }

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "lost",
    description: `Lead marked as Lost: ${reason?.name ?? "Unknown reason"}`,
    new_value: reason?.name ?? null,
    changed_by: user?.id ?? null,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { error: null };
}
