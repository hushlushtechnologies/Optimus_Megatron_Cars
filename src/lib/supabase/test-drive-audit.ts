import type { SupabaseServerClient } from "@/src/lib/supabase/test-drive-action-helpers";

export type TestDriveAuditKind = "export" | "bulk_cancel" | "bulk_assign" | "bulk_archive" | "bulk_restore";

interface AuditInput {
  /** Kept so callers don't change. The database records the signed-in person itself. */
  userId: string;
  kind: TestDriveAuditKind;
  rowCount: number;
  /** Counts, drive numbers and settings only. Never put search text or personal details here. */
  detail: Record<string, unknown>;
}

/**
 * Writes one audit row through the database function, which checks that the signed-in
 * person holds the permission for this kind of action. A failure is logged but never
 * blocks the action that was just done. Returns whether the row was saved.
 */
export async function recordTestDriveAudit(
  supabase: SupabaseServerClient,
  input: AuditInput,
): Promise<boolean> {
  const { error } = await supabase.rpc("record_test_drive_audit", {
    p_kind: input.kind,
    p_row_count: input.rowCount,
    p_detail: input.detail,
  });

  if (error) {
    console.error("recordTestDriveAudit error:", error);
    return false;
  }
  return true;
}
