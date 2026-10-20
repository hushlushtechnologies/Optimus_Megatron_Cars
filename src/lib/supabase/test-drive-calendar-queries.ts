import { createClient } from "@/src/lib/supabase/server";
import { LIST_COLUMNS } from "@/src/lib/supabase/test-drive-queries";
import {
  CALENDAR_ROW_CAP,
  UNASSIGNED_STAFF_FILTER,
  getCalendarRange,
  getRangeBounds,
  type TestDriveCalendarParams,
} from "@/src/lib/utils/test-drive-calendar";
import type { TestDriveCalendarFilterOptions, TestDriveListRow } from "@/src/lib/types/test-drive";

/** Returns null (not an empty list) when the query fails, so the page can say so. */
export async function getTestDriveCalendarRows(
  params: TestDriveCalendarParams,
): Promise<{ rows: TestDriveListRow[]; truncated: boolean } | null> {
  const supabase = await createClient();

  const { from, to } = getRangeBounds(getCalendarRange(params.view, params.date));

  let query = supabase
    .from("test_drive_list")
    .select(LIST_COLUMNS)
    .is("archived_at", null)
    .gte("scheduled_start", from)
    .lt("scheduled_start", to);

  // Rejected and Cancelled appointments no longer occupy any time, so they're hidden unless asked for.
  if (!params.showClosed) query = query.not("status", "in", "(Rejected,Cancelled)");
  if (params.showroom) query = query.eq("location_id", params.showroom);

  if (params.staff === UNASSIGNED_STAFF_FILTER) query = query.is("assigned_staff_id", null);
  else if (params.staff) query = query.eq("assigned_staff_id", params.staff);

  // One extra row tells us whether more exist than the cap allows.
  const { data, error } = await query
    .order("scheduled_start", { ascending: true })
    .order("id", { ascending: true })
    .limit(CALENDAR_ROW_CAP + 1);

  if (error) {
    console.error("getTestDriveCalendarRows error:", error);
    return null;
  }

  const rows = (data ?? []) as unknown as TestDriveListRow[];
  return { rows: rows.slice(0, CALENDAR_ROW_CAP), truncated: rows.length > CALENDAR_ROW_CAP };
}

/** Never fails the page: if the lists can't load, the filters are simply empty. */
export async function getTestDriveCalendarFilterOptions(): Promise<TestDriveCalendarFilterOptions> {
  const supabase = await createClient();

  const [locations, staff] = await Promise.all([
    supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  if (locations.error) console.error("calendar showroom options error:", locations.error);
  if (staff.error) console.error("calendar staff options error:", staff.error);

  return {
    showrooms: locations.data ?? [],
    staff: (staff.data ?? []).map((p) => ({ id: p.id, full_name: p.full_name ?? "Unknown" })),
  };
}
