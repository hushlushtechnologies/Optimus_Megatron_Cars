import { createClient } from "@/src/lib/supabase/server";
import type {
  TestDriveFollowUpLoad,
  TestDriveInterest,
  TestDrivePanelItem,
  TestDrivePanelLoad,
  TestDriveStatus,
} from "@/src/lib/types/test-drive";

interface PanelRow {
  id: string;
  test_drive_number: string;
  status: TestDriveStatus;
  scheduled_start: string;
  scheduled_end: string;
  car_id: string;
  vehicle_title: string;
  brand_name: string | null;
  location_name: string;
  staff_name: string | null;
  lead_id: string | null;
  lead_number: string | null;
  checked_in_at: string | null;
}

/**
 * The test drives for one lead, or one customer, newest first, with each
 * one's result and follow-up. Any failure is reported as an error (never as an
 * empty list), so a page can say it couldn't load instead of claiming there
 * are no test drives.
 */
export async function getTestDrivesForPanel(filter: {
  leadId?: string;
  customerId?: string;
}): Promise<TestDrivePanelLoad> {
  if (!filter.leadId && !filter.customerId) return { status: "ok", items: [] };

  const supabase = await createClient();

  let query = supabase
    .from("test_drive_list")
    .select(
      "id, test_drive_number, status, scheduled_start, scheduled_end, car_id, vehicle_title, brand_name, location_name, staff_name, lead_id, lead_number, checked_in_at",
    )
    .is("archived_at", null);

  query = filter.leadId
    ? query.eq("lead_id", filter.leadId)
    : query.eq("customer_id", filter.customerId as string);

  const { data, error } = await query.order("scheduled_start", { ascending: false }).limit(100);

  if (error) {
    console.error("getTestDrivesForPanel error:", error);
    return { status: "error" };
  }

  const rows = (data ?? []) as unknown as PanelRow[];
  if (rows.length === 0) return { status: "ok", items: [] };

  const ids = rows.map((r) => r.id);

  const [feedbackResult, reasonsResult, followUpsResult] = await Promise.all([
    supabase
      .from("test_drive_feedback")
      .select("test_drive_id, interest_level, follow_up_required")
      .in("test_drive_id", ids),
    supabase.from("test_drives").select("id, rejection_reason, cancellation_reason").in("id", ids),
    supabase
      .from("lead_follow_ups")
      .select("test_drive_id, status, type, scheduled_at, lead_id")
      .in("test_drive_id", ids)
      .neq("status", "Cancelled")
      .order("created_at", { ascending: false }),
  ]);

  if (feedbackResult.error || reasonsResult.error || followUpsResult.error) {
    console.error(
      "getTestDrivesForPanel details error:",
      feedbackResult.error ?? reasonsResult.error ?? followUpsResult.error,
    );
    return { status: "error" };
  }

  const feedback = new Map(
    (
      (feedbackResult.data ?? []) as unknown as {
        test_drive_id: string;
        interest_level: TestDriveInterest | null;
        follow_up_required: boolean;
      }[]
    ).map((f) => [f.test_drive_id, f]),
  );

  const reasons = new Map(
    (
      (reasonsResult.data ?? []) as unknown as {
        id: string;
        rejection_reason: string | null;
        cancellation_reason: string | null;
      }[]
    ).map((r) => [r.id, r]),
  );

  // Newest first, so the first one seen for a drive is its current follow-up.
  const followUps = new Map<string, TestDrivePanelItem["follow_up"]>();
  (
    (followUpsResult.data ?? []) as unknown as {
      test_drive_id: string;
      status: string;
      type: string;
      scheduled_at: string;
      lead_id: string;
    }[]
  ).forEach((f) => {
    if (!followUps.has(f.test_drive_id)) {
      followUps.set(f.test_drive_id, {
        status: f.status,
        type: f.type,
        scheduled_at: f.scheduled_at,
        lead_id: f.lead_id,
      });
    }
  });

  const items: TestDrivePanelItem[] = rows.map((r) => {
    const fb = feedback.get(r.id);
    const reason = reasons.get(r.id);

    return {
      ...r,
      interest_level: fb?.interest_level ?? null,
      follow_up_required: fb?.follow_up_required ?? false,
      has_feedback: !!fb,
      reason:
        r.status === "Rejected"
          ? (reason?.rejection_reason ?? null)
          : r.status === "Cancelled"
            ? (reason?.cancellation_reason ?? null)
            : null,
      follow_up: followUps.get(r.id) ?? null,
    };
  });

  return { status: "ok", items };
}

/** The follow-ups created from one test drive, newest first. A failure is an error, not an empty list. */
export async function getFollowUpsForTestDrive(testDriveId: string): Promise<TestDriveFollowUpLoad> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_follow_ups")
    .select("id, status, type, scheduled_at, lead_id")
    .eq("test_drive_id", testDriveId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getFollowUpsForTestDrive error:", error);
    return { status: "error" };
  }

  return {
    status: "ok",
    items: (
      (data ?? []) as unknown as {
        id: string;
        status: string;
        type: string;
        scheduled_at: string;
        lead_id: string;
      }[]
    ).map((f) => ({
      id: f.id,
      status: f.status,
      type: f.type,
      scheduled_at: f.scheduled_at,
      lead_id: f.lead_id,
    })),
  };
}
