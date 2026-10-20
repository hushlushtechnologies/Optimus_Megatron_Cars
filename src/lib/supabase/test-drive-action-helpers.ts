import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { getMyTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import {
  TEST_DRIVE_PERMISSION_MESSAGES,
  type TestDrivePermissionName,
} from "@/src/lib/utils/test-drive-permissions";
import type { TestDriveStatus } from "@/src/lib/types/test-drive";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const NOT_FOUND_MESSAGE = "That test drive could not be found.";
export const STALE_MESSAGE =
  "This test drive was just updated by someone else. Refresh the page to see its current status.";

export interface TestDriveActionRow {
  id: string;
  test_drive_number: string;
  status: TestDriveStatus;
  car_id: string;
  location_id: string;
  assigned_staff_id: string | null;
  scheduled_start: string;
  duration_minutes: number;
  buffer_minutes: number;
  checked_in_at: string | null;
  archived_at: string | null;
}

export async function loadTestDriveForAction(
  supabase: SupabaseServerClient,
  id: string,
): Promise<TestDriveActionRow | null> {
  const { data, error } = await supabase
    .from("test_drives")
    .select(
      "id, test_drive_number, status, car_id, location_id, assigned_staff_id, scheduled_start, duration_minutes, buffer_minutes, checked_in_at, archived_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("loadTestDriveForAction error:", error);
  return (data as unknown as TestDriveActionRow | null) ?? null;
}

/** An error message when the test drive can't take this action right now, or null when it can. */
export function statusErrorFor(drive: TestDriveActionRow, allowed: TestDriveStatus[]): string | null {
  if (drive.archived_at) return "This test drive is archived and can't be changed.";
  if (!allowed.includes(drive.status)) {
    return `This test drive is now ${drive.status.toLowerCase()}, so that action no longer applies. Refresh the page to see the latest.`;
  }
  return null;
}

export type BeginResult =
  { ok: true; supabase: SupabaseServerClient; userId: string } | { ok: false; error: string };

/**
 * Every changing action starts here: signed in, and holding the permission
 * for what it does. The database checks the same permission again, so this
 * is a friendly early refusal, not the only guard.
 */
export async function beginTestDriveAction(permission: TestDrivePermissionName): Promise<BeginResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to do this." };

  const permissions = await getMyTestDrivePermissions(supabase);
  if (!permissions[permission]) return { ok: false, error: TEST_DRIVE_PERMISSION_MESSAGES[permission] };

  return { ok: true, supabase, userId: user.id };
}

/** Read-only actions only need the person to be signed-in staff. The database's own access rules still apply. */
export async function beginTestDriveRead(): Promise<BeginResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to do this." };

  const { data: isStaff, error } = await supabase.rpc("is_staff", { uid: user.id });
  if (error || !isStaff) return { ok: false, error: "You don't have permission to view this." };

  return { ok: true, supabase, userId: user.id };
}

export function refreshTestDrivePages(id: string) {
  revalidatePath("/admin/test-drives");
  revalidatePath(`/admin/test-drives/${id}`);
}
