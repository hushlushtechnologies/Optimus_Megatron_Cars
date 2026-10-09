"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import { addLeadTag, removeLeadTag } from "@/app/admin/leads/[id]/tags-actions";
import { createFollowUp } from "@/app/admin/leads/[id]/follow-up-actions";
import { assertCanDeleteLeads } from "@/src/lib/supabase/lead-permissions";
import {
  notifyLeadAssigned,
  notifyLeadStageChanged,
  notifyLeadClosed,
} from "@/src/lib/notifications/lead-notifications";
import type { FollowUpType, LeadTemperature } from "@/src/lib/types/lead";

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

  await notifyLeadStageChanged(leadId, oldStageName, newStageName, user?.id ?? null);

  revalidatePath("/admin/leads");
  return { error: null };
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

  await notifyLeadAssigned(leadId, newStaffId, current.assigned_staff_id, user?.id ?? null);

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

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "won",
    description: "Lead marked as Won",
    new_value: notes.trim() || null,
    changed_by: user?.id ?? null,
  });

  await notifyLeadClosed(leadId, "won", null, user?.id ?? null);

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

  await notifyLeadClosed(leadId, "lost", reason?.name ?? null, user?.id ?? null);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  return { error: null };
}

// --- Bulk actions (Phase 18) ---

interface BulkResult {
  error: string | null;
  summary?: string;
}

async function runPerLead<T>(
  leadIds: string[],
  action: (leadId: string) => Promise<{ error: string | null } & T>,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const leadId of leadIds) {
    const result = await action(leadId);
    if (result.error) failed++;
    else succeeded++;
  }
  return { succeeded, failed };
}

function summarize(succeeded: number, failed: number, verb: string): string {
  if (failed === 0) return `${verb} ${succeeded} lead${succeeded === 1 ? "" : "s"}`;
  return `${verb} ${succeeded} of ${succeeded + failed} — ${failed} failed`;
}

export async function bulkAssignStaff(leadIds: string[], staffId: string): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const { succeeded, failed } = await runPerLead(leadIds, (id) => assignLeadStaff(id, staffId));
  revalidatePath("/admin/leads");
  return {
    error: succeeded === 0 ? "Unable to assign staff to any selected lead." : null,
    summary: summarize(succeeded, failed, "Assigned staff on"),
  };
}

export async function bulkChangeStage(leadIds: string[], stageId: string): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const { succeeded, failed } = await runPerLead(leadIds, (id) => moveLeadStage(id, stageId));
  revalidatePath("/admin/leads");
  return {
    error: succeeded === 0 ? "Unable to move any selected lead." : null,
    summary: summarize(succeeded, failed, "Moved"),
  };
}

export async function bulkAddTag(leadIds: string[], tagId: string): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const { succeeded, failed } = await runPerLead(leadIds, (id) => addLeadTag(id, tagId));
  revalidatePath("/admin/leads");
  return {
    error: succeeded === 0 ? "Unable to add the tag to any selected lead." : null,
    summary: summarize(succeeded, failed, "Tagged"),
  };
}

export async function bulkRemoveTag(leadIds: string[], tagId: string): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const { succeeded, failed } = await runPerLead(leadIds, (id) => removeLeadTag(id, tagId));
  revalidatePath("/admin/leads");
  return {
    error: succeeded === 0 ? "Unable to remove the tag from any selected lead." : null,
    summary: summarize(succeeded, failed, "Untagged"),
  };
}

export async function bulkChangeTemperature(
  leadIds: string[],
  temperature: LeadTemperature,
): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const { succeeded, failed } = await runPerLead(leadIds, (id) => changeLeadTemperature(id, temperature));
  revalidatePath("/admin/leads");
  return {
    error: succeeded === 0 ? "Unable to update temperature on any selected lead." : null,
    summary: summarize(succeeded, failed, "Updated temperature on"),
  };
}

export async function bulkScheduleFollowUp(
  leadIds: string[],
  type: FollowUpType,
  date: string,
  time: string,
): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };
  if (!date) return { error: "A date is required." };

  const { succeeded, failed } = await runPerLead(leadIds, (id) => createFollowUp(id, type, date, time, ""));
  revalidatePath("/admin/leads");
  return {
    error: succeeded === 0 ? "Unable to schedule a follow-up for any selected lead." : null,
    summary: summarize(succeeded, failed, "Scheduled a follow-up for"),
  };
}

export async function bulkArchiveLeads(leadIds: string[]): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString() })
    .in("id", leadIds);
  if (error) {
    console.error("bulkArchiveLeads error:", error);
    return { error: "Unable to archive the selected leads. Please try again." };
  }

  await supabase.from("lead_activities").insert(
    leadIds.map((lead_id) => ({
      lead_id,
      activity_type: "archived",
      description: "Lead archived",
      changed_by: user?.id ?? null,
    })),
  );

  revalidatePath("/admin/leads");
  return { error: null };
}

export async function bulkRestoreLeads(leadIds: string[]): Promise<BulkResult> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("leads").update({ archived_at: null }).in("id", leadIds);
  if (error) {
    console.error("bulkRestoreLeads error:", error);
    return { error: "Unable to restore the selected leads. Please try again." };
  }

  await supabase.from("lead_activities").insert(
    leadIds.map((lead_id) => ({
      lead_id,
      activity_type: "restored",
      description: "Lead restored",
      changed_by: user?.id ?? null,
    })),
  );

  revalidatePath("/admin/leads");
  return { error: null };
}

export async function deleteLeads(leadIds: string[]): Promise<BulkResult> {
  const permission = await assertCanDeleteLeads();
  if (!permission.allowed) return { error: permission.error };
  if (leadIds.length === 0) return { error: "No leads selected." };

  const supabase = await createClient();
  const { error, count } = await supabase.from("leads").delete({ count: "exact" }).in("id", leadIds);

  if (error) {
    console.error("deleteLeads error:", error);
    return { error: "Unable to delete the selected lead(s). Please try again." };
  }

  // RLS hides rows you aren't allowed to delete rather than raising an error,
  // so a zero count means nothing was actually removed.
  if (!count) {
    return { error: "No leads were deleted. You may not have permission to delete these." };
  }

  revalidatePath("/admin/leads");
  return { error: null };
}
