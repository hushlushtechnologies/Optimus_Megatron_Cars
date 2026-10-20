"use server";

import { z } from "zod";
import { checkExactBooking } from "@/src/lib/supabase/test-drive-booking-check";
import { getStaffAvailabilityForSlot } from "@/src/lib/supabase/test-drive-availability";
import { getTestDriveAssignmentHistory } from "@/src/lib/supabase/test-drive-assignment-queries";
import { isEligibleTestDriveHost, listTestDriveHosts } from "@/src/lib/supabase/test-drive-permissions";
import {
  NOT_FOUND_MESSAGE,
  STALE_MESSAGE,
  beginTestDriveAction,
  beginTestDriveRead,
  loadTestDriveForAction,
  refreshTestDrivePages,
  statusErrorFor,
} from "@/src/lib/supabase/test-drive-action-helpers";
import { notifyTestDriveStaffChanged } from "@/src/lib/notifications/test-drive-notifications";
import { mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import { formatTime, toDubaiIsoDate } from "@/src/lib/utils/test-drive-format";
import type {
  AssignmentPreview,
  BookingProblem,
  TestDriveActionResult,
  TestDriveAssignmentHistoryItem,
} from "@/src/lib/types/test-drive";

const previewSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid().nullable(),
});

const assignSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid("Choose a staff member."),
  /** The host the screen showed. If it has changed since, someone else got there first. */
  expectedStaffId: z.string().uuid().nullable(),
});

const historySchema = z.object({ id: z.string().uuid() });

/** Assigning a host only cares about the host. The time, hours and vehicle were settled when it was booked. */
const isStaffProblem = (problem: BookingProblem) =>
  problem.kind === "staff_busy" || problem.kind === "staff_away";

const problemText = (problem: BookingProblem) => [problem.message, problem.detail].filter(Boolean).join(" ");

// --- Preview: what the Assign dialog shows before anything changes ---

export async function getAssignmentPreviewAction(input: unknown): Promise<AssignmentPreview | null> {
  const start = await beginTestDriveAction("assign");
  if (!start.ok) return null;

  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadTestDriveForAction(start.supabase, parsed.data.id);
  if (!drive) return null;

  const [staff, check, staffAvailability] = await Promise.all([
    listTestDriveHosts(start.supabase),
    parsed.data.staffId
      ? checkExactBooking({
          carId: drive.car_id,
          locationId: drive.location_id,
          startIso: drive.scheduled_start,
          durationMinutes: drive.duration_minutes,
          bufferMinutes: drive.buffer_minutes,
          staffId: parsed.data.staffId,
          excludeTestDriveId: drive.id,
          enforceNotice: false,
        })
      : Promise.resolve(null),
    getStaffAvailabilityForSlot({
      locationId: drive.location_id,
      date: toDubaiIsoDate(drive.scheduled_start),
      time: formatTime(drive.scheduled_start),
      durationMinutes: drive.duration_minutes,
      excludeTestDriveId: drive.id,
    }),
  ]);

  if (!staff || check?.status === "error") return null;

  return {
    status: drive.status,
    currentStaffId: drive.assigned_staff_id,
    staff,
    staffAvailability,
    problems: check?.status === "blocked" ? check.problems.filter(isStaffProblem) : [],
  };
}

// --- Assign / reassign ---

export async function assignTestDriveStaffAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("assign");
  if (!start.ok) return { error: start.error };

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a staff member." };
  const { id, staffId, expectedStaffId } = parsed.data;
  const { supabase, userId } = start;

  const drive = await loadTestDriveForAction(supabase, id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Pending", "Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  // The dialog showed a particular host. If that's no longer who hosts it, don't overwrite someone else's change.
  if (drive.assigned_staff_id !== expectedStaffId) return { error: STALE_MESSAGE };

  if (staffId === drive.assigned_staff_id)
    return { error: "That person is already hosting this test drive." };

  if (!(await isEligibleTestDriveHost(supabase, staffId)))
    return { error: "That person can't host test drives." };

  // The new host must be free at this exact time. The test drive itself isn't counted as a clash.
  const check = await checkExactBooking({
    carId: drive.car_id,
    locationId: drive.location_id,
    startIso: drive.scheduled_start,
    durationMinutes: drive.duration_minutes,
    bufferMinutes: drive.buffer_minutes,
    staffId,
    excludeTestDriveId: drive.id,
    enforceNotice: false,
  });

  if (check.status === "error") return { error: "We couldn't check availability. Please try again." };

  const staffProblem = check.status === "blocked" ? check.problems.find(isStaffProblem) : undefined;
  if (staffProblem) return { error: problemText(staffProblem) };

  // Only applies if status and host are still exactly what we just read.
  let update = supabase
    .from("test_drives")
    .update({ assigned_staff_id: staffId })
    .eq("id", drive.id)
    .eq("status", drive.status);

  update = drive.assigned_staff_id
    ? update.eq("assigned_staff_id", drive.assigned_staff_id)
    : update.is("assigned_staff_id", null);

  const { data: updated, error } = await update.select("id");

  if (error) {
    console.error("assignTestDriveStaffAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  // The database has already recorded this in the assignment history and the timeline.
  await notifyTestDriveStaffChanged(drive.id, staffId, drive.assigned_staff_id, userId);

  refreshTestDrivePages(drive.id);
  return { error: null };
}

// --- History (read-only) ---

export async function getAssignmentHistoryAction(
  input: unknown,
): Promise<TestDriveAssignmentHistoryItem[] | null> {
  const start = await beginTestDriveRead();
  if (!start.ok) return null;

  const parsed = historySchema.safeParse(input);
  if (!parsed.success) return null;

  return getTestDriveAssignmentHistory(parsed.data.id);
}
