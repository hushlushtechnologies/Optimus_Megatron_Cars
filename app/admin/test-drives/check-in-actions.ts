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
import { LIST_COLUMNS } from "@/src/lib/supabase/test-drive-queries";
import { loadCheckInOpensMinutes, performTestDriveCheckIn } from "@/src/lib/supabase/test-drive-check-in";
import { describeCheckInWindow, getCheckInWindow } from "@/src/lib/utils/test-drive-check-in";
import { formatTime } from "@/src/lib/utils/test-drive-format";
import type {
  TestDriveActionResult,
  TestDriveArrival,
  TestDriveCheckInData,
} from "@/src/lib/types/test-drive";

const idSchema = z.object({ id: z.string().uuid() });

const checkInSchema = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().min(1),
  // The staff member's confirmation that this person is who the booking says. A staff attestation, not an automated check.
  verified: z.literal(true, { message: "Please confirm you've verified the customer." }),
});

interface CheckInBase {
  updated_at: string;
  checked_in_by: string | null;
  archived_at: string | null;
}

async function loadBase(supabase: SupabaseServerClient, id: string): Promise<CheckInBase | null> {
  const { data, error } = await supabase
    .from("test_drives")
    .select("updated_at, checked_in_by, archived_at")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("check-in loadBase error:", error);
  return (data as unknown as CheckInBase | null) ?? null;
}

async function nameOf(supabase: SupabaseServerClient, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name ?? "Unknown";
}

// --- Load: what the dialog shows when it opens ---

export async function getCheckInDataAction(input: unknown): Promise<TestDriveCheckInData | null> {
  const start = await beginTestDriveAction("checkIn");
  if (!start.ok) return null;

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return null;
  const { supabase } = start;

  const [viewResult, base] = await Promise.all([
    supabase
      .from("test_drive_list")
      .select(`${LIST_COLUMNS}, customer_phone`)
      .eq("id", parsed.data.id)
      .maybeSingle(),
    loadBase(supabase, parsed.data.id),
  ]);

  if (viewResult.error) console.error("getCheckInDataAction error:", viewResult.error);
  if (!viewResult.data || !base) return null;

  const row = viewResult.data as unknown as TestDriveArrival;
  const [opensBeforeMinutes, checkedInByName] = await Promise.all([
    loadCheckInOpensMinutes(supabase, row.location_id),
    nameOf(supabase, base.checked_in_by),
  ]);

  return {
    id: row.id,
    testDriveNumber: row.test_drive_number,
    status: row.status,
    archived: !!base.archived_at,
    checkedInAt: row.checked_in_at,
    checkedInByName,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    locationName: row.location_name,
    vehicleTitle: row.vehicle_title,
    hostName: row.staff_name,
    customer: { name: row.customer_name, number: row.customer_number, phone: row.customer_phone ?? "" },
    window: getCheckInWindow({
      nowMs: Date.now(),
      startIso: row.scheduled_start,
      endIso: row.scheduled_end,
      opensBeforeMinutes,
    }),
    opensBeforeMinutes,
    updatedAt: base.updated_at,
  };
}

// --- Check in ---

export async function checkInTestDriveAction(input: unknown): Promise<TestDriveActionResult> {
  const start = await beginTestDriveAction("checkIn");
  if (!start.ok) return { error: start.error };

  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check the details and try again." };
  const v = parsed.data;
  const { supabase } = start;

  const drive = await loadTestDriveForAction(supabase, v.id);
  if (!drive) return { error: NOT_FOUND_MESSAGE };

  const problem = statusErrorFor(drive, ["Approved", "Rescheduled"]);
  if (problem) return { error: problem };

  const base = await loadBase(supabase, drive.id);
  if (!base) return { error: NOT_FOUND_MESSAGE };

  if (drive.checked_in_at) {
    const by = await nameOf(supabase, base.checked_in_by);
    return {
      error: `This customer already checked in at ${formatTime(drive.checked_in_at)}${by ? ` (by ${by})` : ""}.`,
    };
  }

  // The dialog showed one version of the record. If it was rescheduled since, the window may have moved.
  if (base.updated_at !== v.expectedUpdatedAt) return { error: STALE_MESSAGE };

  const endIso = new Date(Date.parse(drive.scheduled_start) + drive.duration_minutes * 60_000).toISOString();
  const window = getCheckInWindow({
    nowMs: Date.now(),
    startIso: drive.scheduled_start,
    endIso,
    opensBeforeMinutes: await loadCheckInOpensMinutes(supabase, drive.location_id),
  });

  const verdict = describeCheckInWindow(window);
  if (!verdict.ok) return { error: verdict.text };

  const result = await performTestDriveCheckIn(supabase, {
    testDriveId: drive.id,
    status: drive.status,
    expectedUpdatedAt: v.expectedUpdatedAt,
    source: "staff",
  });
  if (result.error) return result;

  refreshTestDrivePages(drive.id);
  return { error: null };
}
