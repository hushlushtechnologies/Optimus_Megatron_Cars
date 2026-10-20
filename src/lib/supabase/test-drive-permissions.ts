import { createClient } from "@/src/lib/supabase/server";
import {
  NO_TEST_DRIVE_PERMISSIONS,
  TEST_DRIVE_PERMISSION_KEYS,
  TEST_DRIVE_PERMISSION_MESSAGES,
  toTestDrivePermissions,
  type TestDrivePermissionName,
  type TestDrivePermissions,
} from "@/src/lib/utils/test-drive-permissions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface TestDriveHost {
  id: string;
  full_name: string;
}

/**
 * Everything the signed-in person may do, from one database call.
 * If the lookup fails the answer is "nothing": denying is the safe way to fail.
 */
export async function getMyTestDrivePermissions(
  supabase: SupabaseServerClient,
): Promise<TestDrivePermissions> {
  const { data, error } = await supabase.rpc("get_my_permissions");

  if (error) {
    console.error("getMyTestDrivePermissions error:", error);
    return NO_TEST_DRIVE_PERMISSIONS;
  }

  return toTestDrivePermissions(Array.isArray(data) ? (data as string[]) : []);
}

export async function currentUserTestDrivePermissions(): Promise<TestDrivePermissions> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NO_TEST_DRIVE_PERMISSIONS;
  return getMyTestDrivePermissions(supabase);
}

/** For actions that don't go through beginTestDriveAction, such as the booking form's lookups. */
export async function requireTestDrivePermission(
  name: TestDrivePermissionName,
): Promise<{ allowed: boolean; error: string | null }> {
  const permissions = await currentUserTestDrivePermissions();

  if (permissions[name]) return { allowed: true, error: null };
  return { allowed: false, error: TEST_DRIVE_PERMISSION_MESSAGES[name] };
}

/** Whether this person's role lets them be assigned as a host. */
export async function isEligibleTestDriveHost(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_permission", {
    uid: userId,
    perm: TEST_DRIVE_PERMISSION_KEYS.host,
  });

  if (error) {
    console.error("isEligibleTestDriveHost error:", error);
    return false;
  }
  return data === true;
}

/**
 * Everyone who may be assigned as a host. Returns null (not an empty list)
 * when the lookup fails, so a screen can say so instead of looking like
 * nobody is available.
 */
export async function listTestDriveHosts(supabase: SupabaseServerClient): Promise<TestDriveHost[] | null> {
  const { data, error } = await supabase.rpc("list_test_drive_hosts");

  if (error) {
    console.error("listTestDriveHosts error:", error);
    return null;
  }

  return ((data ?? []) as { id: string; full_name: string | null }[]).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? "Unknown",
  }));
}
