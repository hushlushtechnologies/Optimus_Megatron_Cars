import { createClient } from "@/src/lib/supabase/server";
import {
  NO_SALES_PERMISSIONS,
  SALES_PERMISSION_MESSAGES,
  toSalesPermissions,
  type SalesPermissionName,
  type SalesPermissions,
} from "@/src/lib/utils/sales-permissions";

export type SalesSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** One database call. If it fails the answer is "nothing": denying is the safe way to fail. */
export async function getMySalesPermissions(supabase: SalesSupabaseClient): Promise<SalesPermissions> {
  const { data, error } = await supabase.rpc("get_my_permissions");
  if (error) {
    console.error("getMySalesPermissions error:", error);
    return NO_SALES_PERMISSIONS;
  }
  return toSalesPermissions(Array.isArray(data) ? (data as string[]) : []);
}

export async function currentUserSalesPermissions(): Promise<SalesPermissions> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NO_SALES_PERMISSIONS;
  return getMySalesPermissions(supabase);
}

export async function requireSalesPermission(
  name: SalesPermissionName,
): Promise<{ allowed: boolean; error: string | null }> {
  const permissions = await currentUserSalesPermissions();
  if (permissions[name]) return { allowed: true, error: null };
  return { allowed: false, error: SALES_PERMISSION_MESSAGES[name] };
}

export type BeginSalesResult =
  | { ok: true; supabase: SalesSupabaseClient; userId: string; permissions: SalesPermissions }
  | { ok: false; error: string };

/**
 * Every changing sales action starts here: signed in and holding the permission for what it does.
 * The database checks the same permission again, so this is a friendly early refusal, not the only guard.
 */
export async function beginSalesAction(permission: SalesPermissionName): Promise<BeginSalesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to do this." };

  const permissions = await getMySalesPermissions(supabase);
  if (!permissions[permission]) return { ok: false, error: SALES_PERMISSION_MESSAGES[permission] };

  return { ok: true, supabase, userId: user.id, permissions };
}
