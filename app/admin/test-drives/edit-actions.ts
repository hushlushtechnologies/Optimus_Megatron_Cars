"use server";

import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import {
  getMyTestDrivePermissions,
  isEligibleTestDriveHost,
  listTestDriveHosts,
} from "@/src/lib/supabase/test-drive-permissions";
import {
  NOT_FOUND_MESSAGE,
  STALE_MESSAGE,
  beginTestDriveAction,
  loadTestDriveForAction,
  refreshTestDrivePages,
  statusErrorFor,
  type SupabaseServerClient,
} from "@/src/lib/supabase/test-drive-action-helpers";
import { checkTestDriveSlot } from "@/src/lib/supabase/test-drive-availability";
import { checkExactBooking } from "@/src/lib/supabase/test-drive-booking-check";
import {
  notifyTestDriveRescheduled,
  notifyTestDriveStaffChanged,
} from "@/src/lib/notifications/test-drive-notifications";
import { editTestDriveSchema, rescheduleTestDriveSchema } from "@/src/lib/validation/test-drive-edit";
import { isSlotConflictError, mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import { dubaiLocalToDate } from "@/src/lib/utils/test-drive-slots";
import { TEST_DRIVE_PERMISSION_MESSAGES } from "@/src/lib/utils/test-drive-permissions";
import type { TestDriveEditData, TestDriveSaveResult } from "@/src/lib/types/test-drive";

interface EditableExtras {
  customer_notes: string | null;
  internal_notes: string | null;
  request_source_id: string | null;
  updated_at: string;
}

async function loadExtras(supabase: SupabaseServerClient, id: string): Promise<EditableExtras | null> {
  const { data, error } = await supabase
    .from("test_drives")
    .select("customer_notes, internal_notes, request_source_id, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("loadExtras error:", error);
  return (data as unknown as EditableExtras | null) ?? null;
}

const UNEXPECTED_MESSAGE = "We couldn't load this test drive. Please try again.";

// --- Load: what the dialogs show when they open ---

export async function getTestDriveEditDataAction(input: unknown): Promise<TestDriveEditData | null> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const permissions = await getMyTestDrivePermissions(supabase);
  if (!permissions.edit && !permissions.reschedule) return null;

  const drive = await loadTestDriveForAction(supabase, parsed.data.id);
  if (!drive) return null;

  const [extras, locationsResult, settingsResult, sourcesResult, hosts] = await Promise.all([
    loadExtras(supabase, drive.id),
    supabase.from("locations").select("id, name, is_active").order("sort_order"),
    supabase.from("test_drive_location_settings").select("location_id").eq("is_enabled", true),
    supabase.from("test_drive_request_sources").select("id, name, is_active").order("sort_order"),
    listTestDriveHosts(supabase),
  ]);

  if (!extras || !hosts || locationsResult.error || settingsResult.error || sourcesResult.error) {
    console.error(
      "getTestDriveEditDataAction error:",
      locationsResult.error ?? settingsResult.error ?? sourcesResult.error,
    );
    return null;
  }

  const enabled = new Set((settingsResult.data ?? []).map((s) => s.location_id as string));

  // The drive's own showroom and request source always stay selectable, even if they have since been switched off.
  const showrooms = ((locationsResult.data ?? []) as { id: string; name: string; is_active: boolean }[])
    .filter((l) => (l.is_active && enabled.has(l.id)) || l.id === drive.location_id)
    .map((l) => ({ id: l.id, name: l.name }));

  const requestSources = ((sourcesResult.data ?? []) as { id: string; name: string; is_active: boolean }[])
    .filter((s) => s.is_active || s.id === extras.request_source_id)
    .map((s) => ({ id: s.id, name: s.name }));

  let hostList = hosts;
  if (drive.assigned_staff_id && !hosts.some((h) => h.id === drive.assigned_staff_id)) {
    const { data: current } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", drive.assigned_staff_id)
      .maybeSingle();
    hostList = [
      ...hosts,
      { id: drive.assigned_staff_id, full_name: `${current?.full_name ?? "Unknown"} (no longer a host)` },
    ];
  }

  return {
    id: drive.id,
    testDriveNumber: drive.test_drive_number,
    status: drive.status,
    isCheckedIn: !!drive.checked_in_at,
    locationId: drive.location_id,
    scheduledStart: drive.scheduled_start,
    durationMinutes: drive.duration_minutes,
    staffId: drive.assigned_staff_id,
    customerNotes: extras.customer_notes,
    internalNotes: extras.internal_notes,
    requestSourceId: extras.request_source_id,
    updatedAt: extras.updated_at,
    showrooms,
    hosts: hostList,
    requestSources,
    can: { edit: permissions.edit, reschedule: permissions.reschedule, assign: permissions.assign },
  };
}

// --- Edit ---

export async function updateTestDriveAction(input: unknown): Promise<TestDriveSaveResult> {
  const start = await beginTestDriveAction("edit");
  if (!start.ok) return { error: start.error };

  const parsed = editTestDriveSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const v = parsed.data;
  const { supabase, userId } = start;

  const drive = await loadTestDriveForAction(supabase, v.id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Pending", "Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  const extras = await loadExtras(supabase, drive.id);
  if (!extras) return { error: UNEXPECTED_MESSAGE };
  // The dialog showed one version of the record. If anyone changed it since, don't overwrite them.
  if (extras.updated_at !== v.expectedUpdatedAt) return { error: STALE_MESSAGE };

  const isPending = drive.status === "Pending";
  if (v.schedule && !isPending) {
    return { error: "This appointment is confirmed. Use Reschedule to change its date, time or showroom." };
  }
  if (v.staffId !== undefined && !isPending) {
    return { error: "Use Reassign Staff to change the host of a confirmed appointment." };
  }

  const permissions = await getMyTestDrivePermissions(supabase);
  const update: Record<string, string | number | null> = {};

  const customerNotes = v.customerNotes.trim() || null;
  const internalNotes = v.internalNotes.trim() || null;
  if (customerNotes !== (extras.customer_notes ?? null)) update.customer_notes = customerNotes;
  if (internalNotes !== (extras.internal_notes ?? null)) update.internal_notes = internalNotes;
  if (v.requestSourceId !== (extras.request_source_id ?? null)) update.request_source_id = v.requestSourceId;

  let finalStaffId = drive.assigned_staff_id;
  let newHostId: string | null = null;

  if (v.staffId !== undefined && v.staffId !== drive.assigned_staff_id) {
    if (!permissions.assign) return { error: TEST_DRIVE_PERMISSION_MESSAGES.assign };
    if (v.staffId && !(await isEligibleTestDriveHost(supabase, v.staffId))) {
      return { error: "That person can't host test drives." };
    }
    update.assigned_staff_id = v.staffId;
    finalStaffId = v.staffId;
    newHostId = v.staffId;
  }

  let scheduleChanged = false;

  if (v.schedule) {
    const startIso = dubaiLocalToDate(v.schedule.date, v.schedule.time).toISOString();
    scheduleChanged =
      Date.parse(startIso) !== Date.parse(drive.scheduled_start) ||
      v.schedule.durationMinutes !== drive.duration_minutes ||
      v.schedule.locationId !== drive.location_id;

    if (scheduleChanged) {
      // Same rules as booking: an available slot at the chosen showroom, the vehicle and host free.
      const check = await checkTestDriveSlot({
        carId: drive.car_id,
        locationId: v.schedule.locationId,
        date: v.schedule.date,
        time: v.schedule.time,
        durationMinutes: v.schedule.durationMinutes,
        staffId: finalStaffId,
        excludeTestDriveId: drive.id,
      });

      if (check.status === "error") return { error: "We couldn't check availability. Please try again." };
      if (check.status === "blocked") return { error: check.message, refreshAvailability: true };

      update.scheduled_start = startIso;
      update.duration_minutes = v.schedule.durationMinutes;
      update.location_id = v.schedule.locationId;
      update.buffer_minutes = check.bufferMinutes;
    }
  }

  // A host change without a time change still has to be free at the current time.
  if (newHostId && !scheduleChanged) {
    const check = await checkExactBooking({
      carId: drive.car_id,
      locationId: drive.location_id,
      startIso: drive.scheduled_start,
      durationMinutes: drive.duration_minutes,
      bufferMinutes: drive.buffer_minutes,
      staffId: newHostId,
      excludeTestDriveId: drive.id,
      enforceNotice: false,
    });

    if (check.status === "error") return { error: "We couldn't check availability. Please try again." };
    const staffProblem =
      check.status === "blocked"
        ? check.problems.find((p) => p.kind === "staff_busy" || p.kind === "staff_away")
        : undefined;
    if (staffProblem) return { error: [staffProblem.message, staffProblem.detail].filter(Boolean).join(" ") };
  }

  if (Object.keys(update).length === 0) return { error: null, unchanged: true };

  const { data: updated, error } = await supabase
    .from("test_drives")
    .update(update)
    .eq("id", drive.id)
    .eq("status", drive.status)
    .eq("updated_at", v.expectedUpdatedAt)
    .select("id");

  if (error) {
    console.error("updateTestDriveAction error:", error);
    return { error: mapTestDriveDbError(error), refreshAvailability: isSlotConflictError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  if (newHostId) await notifyTestDriveStaffChanged(drive.id, newHostId, drive.assigned_staff_id, userId);

  refreshTestDrivePages(drive.id);
  return { error: null };
}

// --- Reschedule ---

export async function rescheduleTestDriveAction(input: unknown): Promise<TestDriveSaveResult> {
  const start = await beginTestDriveAction("reschedule");
  if (!start.ok) return { error: start.error };

  const parsed = rescheduleTestDriveSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const v = parsed.data;
  const { supabase, userId } = start;

  const drive = await loadTestDriveForAction(supabase, v.id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  if (drive.checked_in_at) {
    return { error: "This customer has already checked in, so the appointment can't be rescheduled." };
  }

  const extras = await loadExtras(supabase, drive.id);
  if (!extras) return { error: UNEXPECTED_MESSAGE };
  if (extras.updated_at !== v.expectedUpdatedAt) return { error: STALE_MESSAGE };

  const startIso = dubaiLocalToDate(v.date, v.time).toISOString();
  const scheduleChanged =
    Date.parse(startIso) !== Date.parse(drive.scheduled_start) ||
    v.durationMinutes !== drive.duration_minutes ||
    v.locationId !== drive.location_id;

  if (!scheduleChanged)
    return { error: "Choose a different date, time, duration or showroom to reschedule." };

  const hostChanged = v.staffId !== drive.assigned_staff_id;
  if (hostChanged) {
    const permissions = await getMyTestDrivePermissions(supabase);
    if (!permissions.assign) return { error: TEST_DRIVE_PERMISSION_MESSAGES.assign };
    if (!(await isEligibleTestDriveHost(supabase, v.staffId)))
      return { error: "That person can't host test drives." };
  }

  // The new time must be genuinely free for the vehicle and the host. The drive's own booking doesn't count against it.
  const check = await checkTestDriveSlot({
    carId: drive.car_id,
    locationId: v.locationId,
    date: v.date,
    time: v.time,
    durationMinutes: v.durationMinutes,
    staffId: v.staffId,
    excludeTestDriveId: drive.id,
  });

  if (check.status === "error") return { error: "We couldn't check availability. Please try again." };
  if (check.status === "blocked") return { error: check.message, refreshAvailability: true };

  const update: Record<string, string | number | null> = {
    scheduled_start: startIso,
    duration_minutes: v.durationMinutes,
    location_id: v.locationId,
    buffer_minutes: check.bufferMinutes,
    status: "Rescheduled",
    reschedule_reason: v.reason,
  };
  if (hostChanged) update.assigned_staff_id = v.staffId;

  // The database records the old and new time, the reason and who did it. Only applies if nothing changed meanwhile.
  const { data: updated, error } = await supabase
    .from("test_drives")
    .update(update)
    .eq("id", drive.id)
    .eq("status", drive.status)
    .eq("updated_at", v.expectedUpdatedAt)
    .select("id");

  if (error) {
    console.error("rescheduleTestDriveAction error:", error);
    return { error: mapTestDriveDbError(error), refreshAvailability: isSlotConflictError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  await notifyTestDriveRescheduled(drive.id, {
    oldStartIso: drive.scheduled_start,
    oldDurationMinutes: drive.duration_minutes,
    previousHostId: drive.assigned_staff_id,
    newHostId: v.staffId,
    reason: v.reason,
    actorId: userId,
  });

  refreshTestDrivePages(drive.id);
  return { error: null };
}
