import { createClient } from "@/src/lib/supabase/server";
import { LIST_COLUMNS } from "@/src/lib/supabase/test-drive-queries";
import { getTestDriveAssignmentHistory } from "@/src/lib/supabase/test-drive-assignment-queries";
import type {
  TestDriveDetail,
  TestDriveDetailResult,
  TestDriveListRow,
  TestDriveScheduleChangeItem,
  TestDriveStatus,
  TestDriveStatusChangeItem,
  TestDriveTimelineEntry,
} from "@/src/lib/types/test-drive";

interface BaseExtras {
  buffer_minutes: number;
  customer_notes: string | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  reschedule_reason: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  checked_in_by: string | null;
  created_by: string | null;
  archived_at: string | null;
}

interface ActivityRow {
  id: string;
  activity_type: string;
  description: string;
  changed_by: string | null;
  changed_at: string;
}

interface ScheduleRow {
  id: string;
  old_start: string;
  new_start: string;
  old_duration_minutes: number;
  new_duration_minutes: number;
  old_location_id: string | null;
  new_location_id: string | null;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

interface StatusRow {
  id: string;
  old_status: TestDriveStatus | null;
  new_status: TestDriveStatus;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

/**
 * Everything the detail page shows, in a few parallel queries. A failure to
 * load the main record is an "error" (never a fake "not found"). A failure to
 * load one of the history lists only blanks that list, so the rest of the
 * page still works and the gap is visible instead of looking like "no history".
 * The caller must pass a real UUID.
 */
export async function getTestDriveDetail(id: string): Promise<TestDriveDetailResult> {
  const supabase = await createClient();

  const [viewResult, baseResult] = await Promise.all([
    supabase.from("test_drive_list").select(`${LIST_COLUMNS}, customer_phone`).eq("id", id).maybeSingle(),
    supabase
      .from("test_drives")
      .select(
        "buffer_minutes, customer_notes, internal_notes, rejection_reason, cancellation_reason, reschedule_reason, actual_start_at, actual_end_at, checked_in_by, created_by, archived_at",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (viewResult.error || baseResult.error) {
    console.error("getTestDriveDetail error:", viewResult.error ?? baseResult.error);
    return { status: "error" };
  }
  if (!viewResult.data || !baseResult.data) return { status: "not_found" };

  const row = viewResult.data as unknown as TestDriveListRow & { customer_phone: string };
  const base = baseResult.data as unknown as BaseExtras;

  const [activitiesResult, scheduleResult, statusResult, assignmentHistory] = await Promise.all([
    supabase
      .from("test_drive_activities")
      .select("id, activity_type, description, changed_by, changed_at")
      .eq("test_drive_id", id)
      .order("changed_at", { ascending: false })
      .limit(200),
    supabase
      .from("test_drive_schedule_history")
      .select(
        "id, old_start, new_start, old_duration_minutes, new_duration_minutes, old_location_id, new_location_id, reason, changed_by, changed_at",
      )
      .eq("test_drive_id", id)
      .order("changed_at", { ascending: false })
      .limit(100),
    supabase
      .from("test_drive_status_history")
      .select("id, old_status, new_status, reason, changed_by, changed_at")
      .eq("test_drive_id", id)
      .order("changed_at", { ascending: false })
      .limit(100),
    getTestDriveAssignmentHistory(id),
  ]);

  if (activitiesResult.error) console.error("getTestDriveDetail activities error:", activitiesResult.error);
  if (scheduleResult.error) console.error("getTestDriveDetail schedule error:", scheduleResult.error);
  if (statusResult.error) console.error("getTestDriveDetail status error:", statusResult.error);

  const activities = activitiesResult.error
    ? null
    : ((activitiesResult.data ?? []) as unknown as ActivityRow[]);
  const schedules = scheduleResult.error ? null : ((scheduleResult.data ?? []) as unknown as ScheduleRow[]);
  const statuses = statusResult.error ? null : ((statusResult.data ?? []) as unknown as StatusRow[]);

  // Names for every person and showroom mentioned, in one round.
  const userIds = new Set<string>();
  const locationIds = new Set<string>();
  const addUser = (value: string | null | undefined) => {
    if (value) userIds.add(value);
  };

  addUser(base.checked_in_by);
  addUser(base.created_by);
  activities?.forEach((a) => addUser(a.changed_by));
  schedules?.forEach((s) => {
    addUser(s.changed_by);
    if (s.old_location_id) locationIds.add(s.old_location_id);
    if (s.new_location_id) locationIds.add(s.new_location_id);
  });
  statuses?.forEach((s) => addUser(s.changed_by));

  const { data: profiles, error: profilesError } = userIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds))
    : { data: [] as { id: string; full_name: string | null }[], error: null };

  const { data: locations, error: locationsError } = locationIds.size
    ? await supabase.from("locations").select("id, name").in("id", Array.from(locationIds))
    : { data: [] as { id: string; name: string }[], error: null };

  if (profilesError) console.error("getTestDriveDetail names error:", profilesError);
  if (locationsError) console.error("getTestDriveDetail locations error:", locationsError);

  const personName = (userId: string | null | undefined): string =>
    userId ? (profiles?.find((p) => p.id === userId)?.full_name ?? "Unknown") : "System";
  const locationName = (locationId: string | null): string | null =>
    locationId ? (locations?.find((l) => l.id === locationId)?.name ?? "Unknown") : null;

  const detail: TestDriveDetail = {
    ...row,
    customer_phone: row.customer_phone ?? "",
    buffer_minutes: base.buffer_minutes,
    customer_notes: base.customer_notes,
    internal_notes: base.internal_notes,
    rejection_reason: base.rejection_reason,
    cancellation_reason: base.cancellation_reason,
    reschedule_reason: base.reschedule_reason,
    actual_start_at: base.actual_start_at,
    actual_end_at: base.actual_end_at,
    archived_at: base.archived_at,
    created_by_name: base.created_by ? personName(base.created_by) : null,
    checked_in_by_name: base.checked_in_by ? personName(base.checked_in_by) : null,
  };

  const timeline: TestDriveTimelineEntry[] | null = activities
    ? activities.map((a) => ({
        id: a.id,
        activity_type: a.activity_type,
        description: a.description,
        changedByName: personName(a.changed_by),
        changed_at: a.changed_at,
      }))
    : null;

  const scheduleChanges: TestDriveScheduleChangeItem[] | null = schedules
    ? schedules.map((s) => ({
        id: s.id,
        old_start: s.old_start,
        new_start: s.new_start,
        old_duration_minutes: s.old_duration_minutes,
        new_duration_minutes: s.new_duration_minutes,
        old_location_name: locationName(s.old_location_id),
        new_location_name: locationName(s.new_location_id),
        reason: s.reason,
        changed_by_name: personName(s.changed_by),
        changed_at: s.changed_at,
      }))
    : null;

  const statusChanges: TestDriveStatusChangeItem[] | null = statuses
    ? statuses.map((s) => ({
        id: s.id,
        old_status: s.old_status,
        new_status: s.new_status,
        reason: s.reason,
        changed_by_name: personName(s.changed_by),
        changed_at: s.changed_at,
      }))
    : null;

  // The most recent host change is the one that put the current host in place.
  const latestAssignment = row.assigned_staff_id && assignmentHistory ? assignmentHistory[0] : undefined;
  const assignedBy = latestAssignment
    ? {
        name: latestAssignment.changed_by_name === "System" ? null : latestAssignment.changed_by_name,
        at: latestAssignment.changed_at,
      }
    : null;

  return { status: "ok", data: { detail, timeline, scheduleChanges, statusChanges, assignedBy } };
}
