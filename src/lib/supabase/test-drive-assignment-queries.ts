import { createClient } from "@/src/lib/supabase/server";
import type { TestDriveAssignmentHistoryItem } from "@/src/lib/types/test-drive";

interface RawHistoryRow {
  id: string;
  previous_staff_id: string | null;
  new_staff_id: string | null;
  changed_by: string | null;
  changed_at: string;
}

/**
 * Every host change for one test drive, newest first, with names resolved.
 * Returns null (not an empty list) when the lookup fails, so a screen can say
 * so instead of looking like nothing ever changed. Phase 10's detail page
 * reuses this for the "Assigned by ... N ago" line.
 */
export async function getTestDriveAssignmentHistory(
  testDriveId: string,
): Promise<TestDriveAssignmentHistoryItem[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("test_drive_staff_assignment_history")
    .select("id, previous_staff_id, new_staff_id, changed_by, changed_at")
    .eq("test_drive_id", testDriveId)
    .order("changed_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getTestDriveAssignmentHistory error:", error);
    return null;
  }

  const rows = (data ?? []) as unknown as RawHistoryRow[];
  if (rows.length === 0) return [];

  const ids = new Set<string>();
  rows.forEach((r) => {
    [r.previous_staff_id, r.new_staff_id, r.changed_by].forEach((id) => {
      if (id) ids.add(id);
    });
  });

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(ids));

  if (profilesError) console.error("getTestDriveAssignmentHistory names error:", profilesError);

  const nameOf = (id: string | null) =>
    id ? (profiles?.find((p) => p.id === id)?.full_name ?? "Unknown") : null;

  return rows.map((r) => ({
    id: r.id,
    previous_staff_name: nameOf(r.previous_staff_id),
    new_staff_name: nameOf(r.new_staff_id),
    changed_by_name: nameOf(r.changed_by) ?? "System",
    changed_at: r.changed_at,
  }));
}
