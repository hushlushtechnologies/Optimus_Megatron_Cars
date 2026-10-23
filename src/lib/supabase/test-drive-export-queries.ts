import { createClient } from "@/src/lib/supabase/server";
import { SORT_MAP, buildTestDriveListQuery } from "@/src/lib/supabase/test-drive-queries";
import type { TestDriveSort } from "@/src/lib/types/test-drive";
import type { TestDriveListFilters } from "@/src/lib/utils/test-drive-list-filters";
import { EXPORT_PAGE_SIZE, type TestDriveExportRow } from "@/src/lib/utils/test-drive-export";

export const EXPORT_COLUMNS = [
  "test_drive_number",
  "status",
  "scheduled_start",
  "scheduled_end",
  "duration_minutes",
  "customer_name",
  "customer_number",
  "customer_phone",
  "vehicle_title",
  "stock_id",
  "brand_name",
  "model_name",
  "location_name",
  "staff_name",
  "request_source_name",
  "lead_number",
  "checked_in_at",
  "created_at",
] as const;

const COLUMN_LIST = EXPORT_COLUMNS.join(", ");

interface GetExportRowsParams {
  scope: "current" | "selected";
  ids?: string[];
  search?: string;
  filters?: TestDriveListFilters;
  sort: TestDriveSort;
  limit: number;
  archived?: boolean;
}

export interface TestDriveExportResult {
  rows: TestDriveExportRow[];
  /** How many rows matched before the cap. */
  total: number;
  truncated: boolean;
}

/** Returns null (not an empty list) when a query fails, so the route can say so. */
export async function getTestDriveExportRows({
  scope,
  ids,
  search,
  filters,
  sort,
  limit,
  archived = false,
}: GetExportRowsParams): Promise<TestDriveExportResult | null> {
  if (scope === "selected" && (!ids || ids.length === 0)) return { rows: [], total: 0, truncated: false };

  const supabase = await createClient();
  const sortConfig = SORT_MAP[sort];
  const rows: TestDriveExportRow[] = [];
  let total = 0;

  for (let from = 0; from < limit; from += EXPORT_PAGE_SIZE) {
    const to = Math.min(from + EXPORT_PAGE_SIZE, limit) - 1;

    const base =
      scope === "selected"
        ? buildTestDriveListQuery(supabase, { columns: COLUMN_LIST, count: true, archived })
        : buildTestDriveListQuery(supabase, { columns: COLUMN_LIST, search, filters, count: true, archived });
    const query = scope === "selected" && ids ? base.in("id", ids) : base;

    // Same deterministic order as the table, so pages of the export never repeat or skip a row.
    const { data, error, count } = await query
      .order(sortConfig.column, { ascending: sortConfig.ascending })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("getTestDriveExportRows error:", error);
      return null;
    }

    total = count ?? total;
    const batch = (data ?? []) as unknown as TestDriveExportRow[];
    rows.push(...batch);

    if (batch.length < to - from + 1) break;
    // Asking for rows past the end can raise an error, so stop once everything is in.
    if (total > 0 && rows.length >= total) break;
  }

  const matched = Math.max(total, rows.length);
  return { rows, total: matched, truncated: matched > rows.length };
}
