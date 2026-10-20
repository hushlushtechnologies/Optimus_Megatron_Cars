"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import {
  NOT_FOUND_MESSAGE,
  STALE_MESSAGE,
  beginTestDriveAction,
  loadTestDriveForAction,
  refreshTestDrivePages,
  statusErrorFor,
  type SupabaseServerClient,
} from "@/src/lib/supabase/test-drive-action-helpers";
import { getOpenLeadsForCustomer } from "@/src/lib/supabase/test-drive-form-queries";
import { getMyTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import { createFollowUpFromTestDriveSchema } from "@/src/lib/validation/test-drive-follow-up";
import { mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import { formatDay, formatTime } from "@/src/lib/utils/test-drive-format";
import { dubaiLocalToDate } from "@/src/lib/utils/test-drive-slots";
import type {
  TestDriveFollowUpFormData,
  TestDriveInterest,
  TestDriveStatus,
} from "@/src/lib/types/test-drive";

const idSchema = z.object({ id: z.string().uuid() });

const NEEDS_LEAD_RIGHTS =
  "Creating a follow-up needs permission to manage leads. Ask an administrator if you need access.";

interface LeadRow {
  id: string;
  lead_number: string;
  customer_id: string;
  archived_at: string | null;
  stage: { name: string; stage_type: string } | null;
}

async function loadLead(supabase: SupabaseServerClient, leadId: string): Promise<LeadRow | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, lead_number, customer_id, archived_at, stage:lead_stages(name, stage_type)")
    .eq("id", leadId)
    .maybeSingle();

  if (error) console.error("follow-up loadLead error:", error);
  return (data as unknown as LeadRow | null) ?? null;
}

interface DriveContext {
  test_drive_number: string;
  status: TestDriveStatus;
  customer_id: string;
  customer_name: string;
  car_id: string;
  vehicle_title: string;
  lead_id: string | null;
}

async function loadDriveContext(supabase: SupabaseServerClient, id: string): Promise<DriveContext | null> {
  const { data, error } = await supabase
    .from("test_drive_list")
    .select("test_drive_number, status, customer_id, customer_name, car_id, vehicle_title, lead_id")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("follow-up loadDriveContext error:", error);
  return (data as unknown as DriveContext | null) ?? null;
}

// --- Load: what the dialog shows when it opens ---

export async function getFollowUpFormDataAction(input: unknown): Promise<TestDriveFollowUpFormData | null> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return null;

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return null;
  const { supabase } = start;

  const [context, drive] = await Promise.all([
    loadDriveContext(supabase, parsed.data.id),
    loadTestDriveForAction(supabase, parsed.data.id),
  ]);
  if (!context || !drive) return null;

  const [lead, openLeads, existingResult, feedbackResult, manage, permissions] = await Promise.all([
    context.lead_id ? loadLead(supabase, context.lead_id) : Promise.resolve(null),
    context.lead_id ? Promise.resolve(null) : getOpenLeadsForCustomer(context.customer_id),
    supabase
      .from("lead_follow_ups")
      .select("status, type, scheduled_at")
      .eq("test_drive_id", drive.id)
      .neq("status", "Cancelled")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("test_drive_feedback")
      .select("interest_level, next_step")
      .eq("test_drive_id", drive.id)
      .maybeSingle(),
    assertCanManageCustomers(),
    getMyTestDrivePermissions(supabase),
  ]);

  if (existingResult.error || feedbackResult.error) {
    console.error("getFollowUpFormDataAction error:", existingResult.error ?? feedbackResult.error);
    return null;
  }

  const existingRow = (
    (existingResult.data ?? []) as unknown as { status: string; type: string; scheduled_at: string }[]
  )[0];
  const feedback = feedbackResult.data as unknown as {
    interest_level: TestDriveInterest | null;
    next_step: string | null;
  } | null;
  const leads = openLeads?.results ?? [];
  const same = leads.find((l) => l.car_id === context.car_id);

  return {
    testDriveNumber: context.test_drive_number,
    status: context.status,
    archived: !!drive.archived_at,
    customerName: context.customer_name,
    vehicleTitle: context.vehicle_title,
    lead: lead
      ? {
          id: lead.id,
          leadNumber: lead.lead_number,
          stageName: lead.stage?.name ?? "Unknown",
          isOpen: lead.stage?.stage_type === "open" && !lead.archived_at,
        }
      : null,
    openLeads: leads,
    openLeadsFailed: !!openLeads?.failed,
    sameVehicleLead: same ? { id: same.id, leadNumber: same.lead_number } : null,
    existing: existingRow
      ? { status: existingRow.status, type: existingRow.type, scheduledAt: existingRow.scheduled_at }
      : null,
    canManageLeads: manage.allowed,
    canLinkLead: permissions.create || permissions.edit,
    interest: feedback?.interest_level ?? null,
    nextStep: feedback?.next_step ?? null,
  };
}

// --- Create the follow-up ---

export async function createFollowUpFromTestDriveAction(
  input: unknown,
): Promise<{ error: string | null; warning?: string }> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return { error: start.error };

  const parsed = createFollowUpFromTestDriveSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const v = parsed.data;
  const { supabase, userId } = start;

  // Follow-ups live on leads, and leads have their own access rules.
  const manage = await assertCanManageCustomers();
  if (!manage.allowed) return { error: NEEDS_LEAD_RIGHTS };

  const drive = await loadTestDriveForAction(supabase, v.id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Completed"]);
  if (problem) return { error: `A follow-up can only be created from a completed test drive. ${problem}` };

  const context = await loadDriveContext(supabase, drive.id);
  if (!context) return { error: NOT_FOUND_MESSAGE };

  // Friendly early refusal. The database's unique index is the real guard against doing it twice.
  const { data: existing, error: existingError } = await supabase
    .from("lead_follow_ups")
    .select("id")
    .eq("test_drive_id", drive.id)
    .neq("status", "Cancelled")
    .limit(1);

  if (existingError) {
    console.error("createFollowUpFromTestDrive existing check error:", existingError);
    return { error: "We couldn't check for an existing follow-up. Please try again." };
  }
  if (existing && existing.length > 0)
    return { error: "A follow-up was already created from this test drive." };

  const scheduledMs = dubaiLocalToDate(v.date, v.time).getTime();
  if (scheduledMs <= Date.now()) return { error: "Choose a date and time in the future." };
  const scheduledIso = new Date(scheduledMs).toISOString();

  // --- Which lead does it go on? ---
  let leadId: string;
  let leadNumber: string;

  if (v.lead.mode === "keep") {
    if (!context.lead_id) return { error: "This test drive has no lead yet. Choose a lead first." };

    const lead = await loadLead(supabase, context.lead_id);
    if (!lead) return { error: "The linked lead could not be found." };
    if (lead.archived_at || lead.stage?.stage_type !== "open") {
      return { error: `Lead ${lead.lead_number} is closed, so a follow-up can't be added to it.` };
    }
    leadId = lead.id;
    leadNumber = lead.lead_number;
  } else {
    if (context.lead_id)
      return { error: "This test drive was just linked to a lead. Close this and reopen it." };

    const permissions = await getMyTestDrivePermissions(supabase);
    if (!permissions.create && !permissions.edit) {
      return { error: "Linking a lead to a test drive needs permission to edit test drives." };
    }

    if (v.lead.mode === "existing") {
      const lead = await loadLead(supabase, v.lead.leadId);
      if (!lead || lead.archived_at) return { error: "That lead could not be found." };
      if (lead.customer_id !== context.customer_id)
        return { error: "That lead belongs to a different customer." };
      if (lead.stage?.stage_type !== "open")
        return { error: `Lead ${lead.lead_number} is closed. Choose an open lead.` };

      leadId = lead.id;
      leadNumber = lead.lead_number;
    } else {
      // Creating a lead must never duplicate one that already exists for this vehicle.
      const { data: sameVehicle, error: sameError } = await supabase
        .from("leads")
        .select("lead_number, stage:lead_stages(stage_type)")
        .eq("customer_id", context.customer_id)
        .eq("car_id", context.car_id)
        .is("archived_at", null);

      if (sameError) {
        console.error("createFollowUpFromTestDrive duplicate check error:", sameError);
        return { error: "We couldn't check for an existing lead. Please try again." };
      }

      const open = (
        (sameVehicle ?? []) as unknown as { lead_number: string; stage: { stage_type: string } | null }[]
      ).find((l) => l.stage?.stage_type === "open");
      if (open)
        return {
          error: `This customer already has an open lead for this vehicle (${open.lead_number}). Link that one instead.`,
        };

      const { data: stage } = await supabase.from("lead_stages").select("id").eq("slug", "new").maybeSingle();
      const { data: fallback } = stage
        ? { data: null }
        : await supabase
            .from("lead_stages")
            .select("id")
            .eq("stage_type", "open")
            .order("sort_order")
            .limit(1)
            .maybeSingle();
      const stageId = stage?.id ?? fallback?.id;
      if (!stageId) return { error: "No starting pipeline stage is configured, so a lead can't be created." };

      const { data: created, error: leadError } = await supabase
        .from("leads")
        .insert({
          customer_id: context.customer_id,
          car_id: context.car_id,
          stage_id: stageId,
          temperature: "Warm",
        })
        .select("id, lead_number")
        .single();

      if (leadError || !created) {
        console.error("createFollowUpFromTestDrive lead error:", leadError);
        return { error: "The lead could not be created. Nothing was changed." };
      }
      leadId = created.id;
      leadNumber = created.lead_number;
    }

    // Link the lead to the test drive. Only applies while it still has no lead.
    const { data: linked, error: linkError } = await supabase
      .from("test_drives")
      .update({ lead_id: leadId })
      .eq("id", drive.id)
      .is("lead_id", null)
      .select("id");

    if (linkError) {
      console.error("createFollowUpFromTestDrive link error:", linkError);
      return { error: mapTestDriveDbError(linkError) };
    }
    if (!linked || linked.length === 0) return { error: STALE_MESSAGE };
  }

  // --- The follow-up itself ---
  const { error: insertError } = await supabase.from("lead_follow_ups").insert({
    lead_id: leadId,
    type: v.type,
    scheduled_at: scheduledIso,
    notes: v.notes.trim() || null,
    test_drive_id: drive.id,
    created_by: userId,
  });

  if (insertError) {
    console.error("createFollowUpFromTestDrive insert error:", insertError);
    if (insertError.code === "23505")
      return { error: "A follow-up was already created from this test drive." };
    return { error: "The follow-up could not be created. Please try again." };
  }

  // The follow-up is saved. The two timeline entries are a record of it, so a problem here becomes a warning.
  const when = `${formatDay(scheduledIso)} ${formatTime(scheduledIso)}`;

  const [leadActivity, driveActivity] = await Promise.all([
    supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "follow_up_created",
      description: `Follow-up scheduled: ${v.type}, ${when} (from test drive ${context.test_drive_number})`,
      related_car_id: context.car_id,
      changed_by: userId,
    }),
    supabase.from("test_drive_activities").insert({
      test_drive_id: drive.id,
      activity_type: "follow_up_created",
      description: `Follow-up scheduled on lead ${leadNumber}: ${v.type}, ${when}`,
      changed_by: userId,
    }),
  ]);

  if (leadActivity.error)
    console.error("createFollowUpFromTestDrive lead activity error:", leadActivity.error);
  if (driveActivity.error)
    console.error("createFollowUpFromTestDrive drive activity error:", driveActivity.error);

  refreshTestDrivePages(drive.id);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);

  return {
    error: null,
    warning:
      leadActivity.error || driveActivity.error
        ? "The follow-up was scheduled, but one of its timeline entries couldn't be recorded."
        : undefined,
  };
}
