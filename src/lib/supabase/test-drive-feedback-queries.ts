import { createClient } from "@/src/lib/supabase/server";
import type { TestDriveFeedbackLoad, TestDriveInterest } from "@/src/lib/types/test-drive";

interface RawFeedback {
  interest_level: TestDriveInterest | null;
  staff_feedback: string | null;
  customer_feedback: string | null;
  next_step: string | null;
  follow_up_required: boolean;
  recorded_by: string | null;
  recorded_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

/**
 * The feedback for one test drive, with names resolved. A failure is reported
 * as an error (never as "no feedback"), so a screen can say it couldn't load
 * instead of claiming nothing was recorded.
 */
export async function getTestDriveFeedback(testDriveId: string): Promise<TestDriveFeedbackLoad> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("test_drive_feedback")
    .select(
      "interest_level, staff_feedback, customer_feedback, next_step, follow_up_required, recorded_by, recorded_at, updated_by, updated_at",
    )
    .eq("test_drive_id", testDriveId)
    .maybeSingle();

  if (error) {
    console.error("getTestDriveFeedback error:", error);
    return { status: "error" };
  }
  if (!data) return { status: "ok", feedback: null };

  const row = data as unknown as RawFeedback;
  const userIds = [row.recorded_by, row.updated_by].filter((id): id is string => !!id);

  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profilesError) console.error("getTestDriveFeedback names error:", profilesError);
    (profiles ?? []).forEach((p) => names.set(p.id, p.full_name ?? "Unknown"));
  }

  const nameOf = (id: string | null) => (id ? (names.get(id) ?? "Unknown") : null);

  return {
    status: "ok",
    feedback: {
      interest_level: row.interest_level,
      staff_feedback: row.staff_feedback,
      customer_feedback: row.customer_feedback,
      next_step: row.next_step,
      follow_up_required: row.follow_up_required,
      recorded_by_name: nameOf(row.recorded_by),
      recorded_at: row.recorded_at,
      updated_by_name: nameOf(row.updated_by),
      updated_at: row.updated_at,
    },
  };
}
