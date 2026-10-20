"use server";

import { z } from "zod";
import {
  NOT_FOUND_MESSAGE,
  STALE_MESSAGE,
  beginTestDriveAction,
  loadTestDriveForAction,
  refreshTestDrivePages,
  statusErrorFor,
  type SupabaseServerClient,
} from "@/src/lib/supabase/test-drive-action-helpers";
import { getTestDriveFeedback } from "@/src/lib/supabase/test-drive-feedback-queries";
import { completeTestDriveSchema, saveFeedbackSchema } from "@/src/lib/validation/test-drive-complete";
import { mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import { toDubaiIsoDate } from "@/src/lib/utils/test-drive-format";
import { dubaiLocalToDate } from "@/src/lib/utils/test-drive-slots";
import type {
  TestDriveActionResult,
  TestDriveCompletionData,
  TestDriveFeedbackLoad,
} from "@/src/lib/types/test-drive";

const idSchema = z.object({ id: z.string().uuid() });

const MAX_DRIVE_MINUTES = 8 * 60;
const CLOCK_SKEW_MS = 60_000;

async function loadUpdatedAt(supabase: SupabaseServerClient, id: string): Promise<string | null> {
  const { data, error } = await supabase.from("test_drives").select("updated_at").eq("id", id).maybeSingle();

  if (error) console.error("complete loadUpdatedAt error:", error);
  return (data as unknown as { updated_at: string } | null)?.updated_at ?? null;
}

// --- Load: what the Complete dialog shows when it opens ---

export async function getCompletionDataAction(input: unknown): Promise<TestDriveCompletionData | null> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return null;

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadTestDriveForAction(start.supabase, parsed.data.id);
  if (!drive) return null;

  const updatedAt = await loadUpdatedAt(start.supabase, drive.id);
  if (!updatedAt) return null;

  return {
    id: drive.id,
    testDriveNumber: drive.test_drive_number,
    status: drive.status,
    scheduledStart: drive.scheduled_start,
    durationMinutes: drive.duration_minutes,
    checkedInAt: drive.checked_in_at,
    updatedAt,
  };
}

// --- Complete ---

export async function completeTestDriveAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return { error: start.error };

  const parsed = completeTestDriveSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const v = parsed.data;
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, v.id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  const updatedAt = await loadUpdatedAt(supabase, drive.id);
  if (!updatedAt) return { error: NOT_FOUND_MESSAGE };
  // The dialog showed one version of the record. If anyone changed it since, don't overwrite them.
  if (updatedAt !== v.expectedUpdatedAt) return { error: STALE_MESSAGE };

  // The date always comes from the appointment itself, never from the browser.
  const date = toDubaiIsoDate(drive.scheduled_start);
  const startMs = dubaiLocalToDate(date, v.actualStartTime).getTime();
  const endMs = dubaiLocalToDate(date, v.actualEndTime).getTime();
  const now = Date.now();

  if (endMs <= startMs) return { error: "The drive must end after it starts." };
  if (endMs - startMs > MAX_DRIVE_MINUTES * 60_000)
    return { error: "A test drive can't last longer than 8 hours." };
  if (startMs > now + CLOCK_SKEW_MS || endMs > now + CLOCK_SKEW_MS) {
    return { error: "The drive's times can't be in the future." };
  }

  const f = v.feedback;

  // One database step: the drive, its feedback and the timeline entry are saved together or not at all.
  const { error } = await supabase.rpc("complete_test_drive", {
    p_id: drive.id,
    p_expected_updated_at: v.expectedUpdatedAt,
    p_actual_start: new Date(startMs).toISOString(),
    p_actual_end: new Date(endMs).toISOString(),
    p_interest: f.interest_level,
    p_staff_feedback: f.staff_feedback,
    p_customer_feedback: f.customer_feedback,
    p_next_step: f.next_step,
    p_follow_up: f.follow_up_required,
  });

  if (error) {
    console.error("completeTestDriveAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }

  refreshTestDrivePages(drive.id);
  return { error: null };
}

// --- Feedback: read, add or correct ---

export async function getTestDriveFeedbackAction(input: unknown): Promise<TestDriveFeedbackLoad | null> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return null;

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return null;

  return getTestDriveFeedback(parsed.data.id);
}

export async function saveTestDriveFeedbackAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("complete");
  if (!start.ok) return { error: start.error };

  const parsed = saveFeedbackSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const { id, feedback: f } = parsed.data;
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Completed"]);
  if (problem) return { error: problem };

  const { error } = await supabase.rpc("save_test_drive_feedback", {
    p_id: drive.id,
    p_interest: f.interest_level,
    p_staff_feedback: f.staff_feedback,
    p_customer_feedback: f.customer_feedback,
    p_next_step: f.next_step,
    p_follow_up: f.follow_up_required,
  });

  if (error) {
    console.error("saveTestDriveFeedbackAction error:", error);
    return { error: mapTestDriveDbError(error) };
  }

  refreshTestDrivePages(drive.id);
  return { error: null };
}
