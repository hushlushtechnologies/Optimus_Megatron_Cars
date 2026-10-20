import { STALE_MESSAGE, type SupabaseServerClient } from "@/src/lib/supabase/test-drive-action-helpers";
import { DEFAULT_CHECK_IN_OPENS_MINUTES } from "@/src/lib/utils/test-drive-check-in";
import { mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import type { TestDriveStatus } from "@/src/lib/types/test-drive";

/**
 * How a check-in came about. Only "staff" exists today. A future QR check-in
 * will validate a signed token on the server, then call performTestDriveCheckIn
 * with source "qr", so every check-in goes through this one function and the
 * same rules. See docs/test-drive-check-in.md.
 */
export type CheckInSource = "staff";

export async function loadCheckInOpensMinutes(
  supabase: SupabaseServerClient,
  locationId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("test_drive_location_settings")
    .select("check_in_opens_minutes_before")
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) console.error("loadCheckInOpensMinutes error:", error);

  const value = (data as { check_in_opens_minutes_before: number } | null)?.check_in_opens_minutes_before;
  return typeof value === "number" ? value : DEFAULT_CHECK_IN_OPENS_MINUTES;
}

interface CheckInParams {
  testDriveId: string;
  status: TestDriveStatus;
  /** The version the screen showed. If anyone changed the record since, the check-in is refused. */
  expectedUpdatedAt: string;
  source: CheckInSource;
}

/**
 * Records the arrival. The database stamps the real time and the real person
 * (the app can't supply either) and checks the window and the permission
 * again. Nothing is written unless the record is exactly as the screen saw it
 * and nobody has checked in already.
 */
export async function performTestDriveCheckIn(
  supabase: SupabaseServerClient,
  params: CheckInParams,
): Promise<{ error: string | null }> {
  const { data: updated, error } = await supabase
    .from("test_drives")
    .update({ checked_in_at: new Date().toISOString() })
    .eq("id", params.testDriveId)
    .eq("status", params.status)
    .eq("updated_at", params.expectedUpdatedAt)
    .is("checked_in_at", null)
    .select("id");

  if (error) {
    console.error("performTestDriveCheckIn error:", error);
    return { error: mapTestDriveDbError(error) };
  }
  if (!updated || updated.length === 0) return { error: STALE_MESSAGE };

  return { error: null };
}
