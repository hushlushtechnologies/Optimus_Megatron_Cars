import { createAdminClient } from "@/src/lib/supabase/admin";
import { createNotification } from "@/src/lib/notifications/create-notification";

interface LeadContext {
  leadNumber: string;
  customerName: string;
  assignedStaffId: string | null;
}

async function getLeadContext(leadId: string): Promise<LeadContext | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("leads")
    .select("lead_number, assigned_staff_id, customer:customer_profiles(full_name)")
    .eq("id", leadId)
    .maybeSingle();

  if (!data) return null;

  const customer = data.customer as unknown as { full_name: string } | null;
  return {
    leadNumber: data.lead_number,
    customerName: customer?.full_name ?? "Unknown customer",
    assignedStaffId: data.assigned_staff_id,
  };
}

async function getActorName(actorId: string | null): Promise<string> {
  if (!actorId) return "Someone";
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("full_name").eq("id", actorId).maybeSingle();
  return data?.full_name ?? "Someone";
}

export async function notifyLeadAssigned(
  leadId: string,
  newStaffId: string,
  previousStaffId: string | null,
  actorId: string | null,
): Promise<void> {
  try {
    const [ctx, actorName] = await Promise.all([getLeadContext(leadId), getActorName(actorId)]);
    if (!ctx) return;

    const label = `${ctx.leadNumber} (${ctx.customerName})`;
    const isReassignment = !!previousStaffId;

    await createNotification({
      recipientId: newStaffId,
      type: isReassignment ? "lead_reassigned" : "lead_assigned",
      title: isReassignment ? "Lead reassigned to you" : "New lead assigned to you",
      description: `${label} was ${isReassignment ? "reassigned" : "assigned"} to you by ${actorName}.`,
      entityType: "lead",
      entityId: leadId,
      actorId,
    });

    if (previousStaffId && previousStaffId !== newStaffId) {
      await createNotification({
        recipientId: previousStaffId,
        type: "lead_reassigned",
        title: "Lead reassigned away from you",
        description: `${label} was reassigned to another team member by ${actorName}.`,
        entityType: "lead",
        entityId: leadId,
        actorId,
      });
    }
  } catch (error) {
    console.error("notifyLeadAssigned error:", error);
  }
}

export async function notifyLeadStageChanged(
  leadId: string,
  oldStageName: string,
  newStageName: string,
  actorId: string | null,
): Promise<void> {
  try {
    const [ctx, actorName] = await Promise.all([getLeadContext(leadId), getActorName(actorId)]);
    if (!ctx?.assignedStaffId) return;

    await createNotification({
      recipientId: ctx.assignedStaffId,
      type: "lead_stage_changed",
      title: "Lead stage changed",
      description: `${ctx.leadNumber} (${ctx.customerName}) moved from ${oldStageName} to ${newStageName} by ${actorName}.`,
      entityType: "lead",
      entityId: leadId,
      actorId,
    });
  } catch (error) {
    console.error("notifyLeadStageChanged error:", error);
  }
}

export async function notifyLeadClosed(
  leadId: string,
  outcome: "won" | "lost",
  detail: string | null,
  actorId: string | null,
): Promise<void> {
  try {
    const [ctx, actorName] = await Promise.all([getLeadContext(leadId), getActorName(actorId)]);
    if (!ctx?.assignedStaffId) return;

    const label = `${ctx.leadNumber} (${ctx.customerName})`;

    await createNotification({
      recipientId: ctx.assignedStaffId,
      type: outcome === "won" ? "lead_won" : "lead_lost",
      title: outcome === "won" ? "Lead won" : "Lead lost",
      description:
        outcome === "won"
          ? `${label} was marked Won by ${actorName}.`
          : `${label} was marked Lost by ${actorName}${detail ? ` (${detail})` : ""}.`,
      entityType: "lead",
      entityId: leadId,
      actorId,
    });
  } catch (error) {
    console.error("notifyLeadClosed error:", error);
  }
}
