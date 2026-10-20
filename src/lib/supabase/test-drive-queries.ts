import { createClient } from "@/src/lib/supabase/server";
import type { TestDriveListRow, TestDriveSort } from "@/src/lib/types/test-drive";

export const LIST_COLUMNS = [
  "id",
  "test_drive_number",
  "status",
  "scheduled_start",
  "scheduled_end",
  "duration_minutes",
  "created_at",
  "updated_at",
  "checked_in_at",
  "customer_id",
  "customer_name",
  "customer_number",
  "customer_photo_url",
  "car_id",
  "vehicle_title",
  "stock_id",
  "brand_name",
  "model_name",
  "location_id",
  "location_name",
  "assigned_staff_id",
  "staff_name",
  "lead_id",
  "lead_number",
  "request_source_name",
].join(", ");

const SORT_MAP: Record<TestDriveSort, { column: string; ascending: boolean }> = {
  upcoming: { column: "upcoming_sort_key", ascending: true },
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  "recently-updated": { column: "updated_at", ascending: false },
  "date-asc": { column: "scheduled_start", ascending: true },
  "date-desc": { column: "scheduled_start", ascending: false },
};

interface GetTestDriveRowsParams {
  page: number;
  pageSize: number;
  sort: TestDriveSort;
}

/** Returns null (not an empty list) when the query fails, so the page can say so. */
export async function getTestDriveRows({
  page,
  pageSize,
  sort,
}: GetTestDriveRowsParams): Promise<{ rows: TestDriveListRow[]; totalCount: number } | null> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortConfig = SORT_MAP[sort];

  // The extra created_at and id keys make the order fully deterministic.
  // Without them, rows that tie on the chosen sort could repeat or vanish
  // between pages.
  const { data, error, count } = await supabase
    .from("test_drive_list")
    .select(LIST_COLUMNS, { count: "exact" })
    .is("archived_at", null)
    .order(sortConfig.column, { ascending: sortConfig.ascending })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("getTestDriveRows error:", error);
    return null;
  }

  return { rows: (data ?? []) as unknown as TestDriveListRow[], totalCount: count ?? 0 };
}
