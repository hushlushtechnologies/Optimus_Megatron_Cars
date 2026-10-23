import type { TestDriveStatus } from "@/src/lib/types/test-drive";

export type ExportFormat = "excel" | "pdf";
export type ExportScope = "current" | "selected";

/** Most rows one file can hold. A PDF gets slow and huge long before a spreadsheet does. */
export const EXPORT_ROW_LIMITS: Record<ExportFormat, number> = { excel: 5000, pdf: 1000 };

/** Ticked rows come from one page, and a page is at most 100. */
export const MAX_EXPORT_SELECTED = 100;

/** Supabase returns at most this many rows per request, so bigger exports are fetched in pieces. */
export const EXPORT_PAGE_SIZE = 1000;

export interface TestDriveExportRow {
  test_drive_number: string;
  status: TestDriveStatus;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  customer_name: string;
  customer_number: string;
  customer_phone: string | null;
  vehicle_title: string;
  stock_id: string;
  brand_name: string | null;
  model_name: string | null;
  location_name: string;
  staff_name: string | null;
  request_source_name: string | null;
  lead_number: string | null;
  checked_in_at: string | null;
  created_at: string;
}

export interface TestDriveExportMeta {
  /** For example "Filtered list" or "12 selected". Printed in the file header. */
  scopeLabel: string;
  /** How many rows matched before any cap. */
  total: number;
  truncated: boolean;
}

export function exportHeaderLine(rowCount: number, meta: TestDriveExportMeta, generated: string): string {
  const noun = rowCount === 1 ? "test drive" : "test drives";
  const cut = meta.truncated
    ? ` · first ${rowCount.toLocaleString("en")} of ${meta.total.toLocaleString("en")}`
    : "";
  return `Generated ${generated} · ${rowCount.toLocaleString("en")} ${noun} · ${meta.scopeLabel}${cut}`;
}
