import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import { join } from "path";

import { formatDate, formatDateTime } from "@/src/lib/utils/format-date";
import { formatTimeRange } from "@/src/lib/utils/test-drive-format";
import {
  exportHeaderLine,
  type TestDriveExportMeta,
  type TestDriveExportRow,
} from "@/src/lib/utils/test-drive-export";

const LOGO_PATH = join(process.cwd(), "public", "logo.png");

const COLUMNS = [
  { header: "Test Drive ID", key: "number", width: 16 },
  { header: "Customer", key: "customer", width: 22 },
  { header: "Customer ID", key: "customer_number", width: 16 },
  { header: "Phone", key: "phone", width: 16 },
  { header: "Vehicle", key: "vehicle", width: 28 },
  { header: "Stock ID", key: "stock_id", width: 14 },
  { header: "Brand", key: "brand", width: 14 },
  { header: "Model", key: "model", width: 16 },
  { header: "Showroom", key: "showroom", width: 16 },
  { header: "Date", key: "date", width: 14 },
  { header: "Time", key: "time", width: 16 },
  { header: "Status", key: "status", width: 13 },
  { header: "Checked In", key: "checked_in", width: 18 },
  { header: "Host", key: "host", width: 18 },
  { header: "Request Source", key: "source", width: 16 },
  { header: "Lead", key: "lead", width: 16 },
  { header: "Created", key: "created", width: 14 },
] as const;

export async function generateTestDriveExcel(
  rows: TestDriveExportRow[],
  meta: TestDriveExportMeta,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Optimus Megatron Cars";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Test Drives", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  try {
    const logoBase64 = readFileSync(LOGO_PATH).toString("base64");
    const logoId = workbook.addImage({ base64: `data:image/png;base64,${logoBase64}`, extension: "png" });
    sheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 48, height: 48 } });
  } catch (error: unknown) {
    // The export still works without the logo.
    console.warn("Test drive export logo could not be loaded:", error);
  }

  sheet.mergeCells("B1:J1");
  sheet.getCell("B1").value = "Optimus Megatron Cars — Test Drive Export";
  sheet.getCell("B1").font = { bold: true, size: 13, color: { argb: "FF111F42" } };

  sheet.mergeCells("B2:J2");
  sheet.getCell("B2").value = exportHeaderLine(rows.length, meta, formatDateTime(new Date()));
  sheet.getCell("B2").font = { size: 9, color: { argb: "FF6B7280" } };

  if (meta.truncated) {
    sheet.mergeCells("B3:J3");
    sheet.getCell("B3").value =
      "Not every matching test drive is in this file. Narrow the filters to export the rest.";
    sheet.getCell("B3").font = { size: 9, bold: true, color: { argb: "FFB45309" } };
  }

  sheet.columns = [{ header: "", key: "_spacer", width: 2 }, ...COLUMNS.map((c) => ({ ...c }))];

  const headerRow = sheet.getRow(4);
  headerRow.values = ["", ...COLUMNS.map((c) => c.header)];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111F42" } };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 22;

  for (const row of rows) {
    sheet.addRow({
      _spacer: "",
      number: row.test_drive_number,
      customer: row.customer_name,
      customer_number: row.customer_number,
      phone: row.customer_phone ?? "—",
      vehicle: row.vehicle_title,
      stock_id: row.stock_id,
      brand: row.brand_name ?? "—",
      model: row.model_name ?? "—",
      showroom: row.location_name,
      date: formatDate(row.scheduled_start),
      time: formatTimeRange(row.scheduled_start, row.scheduled_end),
      status: row.status,
      checked_in: row.checked_in_at ? formatDateTime(row.checked_in_at) : "—",
      host: row.staff_name ?? "Unassigned",
      source: row.request_source_name ?? "—",
      lead: row.lead_number ?? "—",
      created: formatDate(row.created_at),
    });
  }

  const lastDataRow = 4 + rows.length;
  for (let rowNumber = 5; rowNumber <= lastDataRow; rowNumber += 1) {
    const current = sheet.getRow(rowNumber);
    current.alignment = { vertical: "middle", wrapText: true };
    current.height = 20;
  }

  sheet.autoFilter = { from: "B4", to: `R${Math.max(4, lastDataRow)}` };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
