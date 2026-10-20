"use server";

import { z } from "zod";
import { getVehicleById } from "@/src/lib/supabase/test-drive-form-queries";
import { checkExactBooking } from "@/src/lib/supabase/test-drive-booking-check";
import { getStaffAvailabilityForSlot } from "@/src/lib/supabase/test-drive-availability";
import { isEligibleTestDriveHost, listTestDriveHosts } from "@/src/lib/supabase/test-drive-permissions";
import {
  NOT_FOUND_MESSAGE,
  STALE_MESSAGE,
  beginTestDriveAction,
  loadTestDriveForAction,
  refreshTestDrivePages,
  statusErrorFor,
} from "@/src/lib/supabase/test-drive-action-helpers";
import { mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import { formatTime, toDubaiIsoDate } from "@/src/lib/utils/test-drive-format";
import type { ApprovalPreview, TestDriveActionResult } from "@/src/lib/types/test-drive";

const idSchema = z.object({ id: z.string().uuid() });

const approveSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid("Choose a staff member to host this test drive."),
});

const reasonSchema = z.object({
  id: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(3, "Please give a reason (at least 3 characters).")
    .max(500, "Keep the reason under 500 characters."),
});

const previewSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid().nullable(),
});

// --- Preview: what the Approve dialog shows before anything changes ---

export async function getApprovalPreviewAction(input: unknown): Promise<ApprovalPreview | null> {
  const start = await beginTestDriveAction("approve");
  if (!start.ok) return null;

  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadTestDriveForAction(start.supabase, parsed.data.id);
  if (!drive) return null;

  const [staff, check, staffAvailability] = await Promise.all([
    listTestDriveHosts(start.supabase),
    checkExactBooking({
      carId: drive.car_id,
      locationId: drive.location_id,
      startIso: drive.scheduled_start,
      durationMinutes: drive.duration_minutes,
      bufferMinutes: drive.buffer_minutes,
      staffId: parsed.data.staffId,
      excludeTestDriveId: drive.id,
      enforceNotice: false,
    }),
    getStaffAvailabilityForSlot({
      locationId: drive.location_id,
      date: toDubaiIsoDate(drive.scheduled_start),
      time: formatTime(drive.scheduled_start),
      durationMinutes: drive.duration_minutes,
      excludeTestDriveId: drive.id,
    }),
  ]);

  if (!staff || check.status === "error") return null;

  return {
    status: drive.status,
    staff,
    staffAvailability,
    problems: check.status === "blocked" ? check.problems : [],
  };
}
// --- Approve ---

export async function approveTestDriveAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("approve");
  if (!start.ok) return { error: start.error };

  const parsed = approveSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const { id, staffId } = parsed.data;
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Pending"]);
  if (problem) return { error: problem };

  if (!(await isEligibleTestDriveHost(supabase, staffId)))
    return { error: "That person can't host test drives." };

  const vehicle = await getVehicleById(drive.car_id);
  if (!vehicle)
    return { error: "This vehicle is archived or no longer exists, so the request can't be approved." };
  if (vehicle.is_sold) return { error: "This vehicle has been sold and can't be booked for a test drive." };

  // Availability is checked again at the moment of approval: things change
  // between a request arriving and someone acting on it.
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
  if (check.status === "blocked") return { error: check.problems[0].message };

  // Only applies if it's still Pending. If another person acted first, nothing changes.
  const { data: updated, error } = await supabase
    .from("test_drives")
    .update({ status: "Approved", assigned_staff_id: staffId })
    .eq("id", drive.id)
    .eq("status", "Pending")
    .select("id");

  if (error) {
    console.error("approveTestDriveAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  refreshTestDrivePages(drive.id);
  return { error: null };
}

// --- Reject ---

export async function rejectTestDriveAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("approve");
  if (!start.ok) return { error: start.error };

  const parsed = reasonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please give a reason." };
  const { id, reason } = parsed.data;
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Pending"]);
  if (problem) return { error: problem };

  const { data: updated, error } = await supabase
    .from("test_drives")
    .update({ status: "Rejected", rejection_reason: reason })
    .eq("id", drive.id)
    .eq("status", "Pending")
    .select("id");

  if (error) {
    console.error("rejectTestDriveAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  refreshTestDrivePages(drive.id);
  return { error: null };
}

// --- Cancel ---

export async function cancelTestDriveAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("cancel");
  if (!start.ok) return { error: start.error };

  const parsed = reasonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please give a reason." };
  const { id, reason } = parsed.data;
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Pending", "Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  // Only applies if the status is still what the screen showed.
  const { data: updated, error } = await supabase
    .from("test_drives")
    .update({ status: "Cancelled", cancellation_reason: reason })
    .eq("id", drive.id)
    .eq("status", drive.status)
    .select("id");

  if (error) {
    console.error("cancelTestDriveAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  refreshTestDrivePages(drive.id);
  return { error: null };
}

// --- Mark no show ---

export async function markNoShowAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return { error: start.error };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { error: NOT_FOUND_MESSAGE };
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, parsed.data.id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  if (drive.checked_in_at) {
    return { error: "This customer has already checked in, so it can't be marked as a no show." };
  }
  if (Date.parse(drive.scheduled_start) > Date.now()) {
    return {
      error: "This appointment hasn't started yet. You can mark a no show once its start time has passed.",
    };
  }

  const { data: updated, error } = await supabase
    .from("test_drives")
    .update({ status: "No Show" })
    .eq("id", drive.id)
    .eq("status", drive.status)
    .select("id");

  if (error) {
    console.error("markNoShowAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  refreshTestDrivePages(drive.id);
  return { error: null };
}
