import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

function loadLogoBase64(): string | null {
  try {
    return `data:image/png;base64,${readFileSync(LOGO_PATH).toString("base64")}`;
  } catch {
    return null;
  }
}

export function generateTestDrivePdf(rows: TestDriveExportRow[], meta: TestDriveExportMeta): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logo = loadLogoBase64();

  doc.setFillColor(17, 31, 66);
  doc.rect(0, 0, pageWidth, 24, "F");

  if (logo) doc.addImage(logo, "PNG", 10, 4, 16, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Optimus Megatron Cars", logo ? 30 : 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Test Drive Export", logo ? 30 : 14, 17);

  doc.setFontSize(8);
  doc.setTextColor(200, 205, 215);
  doc.text(exportHeaderLine(rows.length, meta, formatDateTime(new Date())), pageWidth - 14, 17, {
    align: "right",
  });

  let startY = 30;
  if (meta.truncated) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text("Not every matching test drive is in this file. Narrow the filters to export the rest.", 10, 30);
    doc.setFont("helvetica", "normal");
    startY = 34;
  }

  autoTable(doc, {
    startY,
    head: [
      [
        "Test Drive ID",
        "Customer",
        "Phone",
        "Vehicle",
        "Showroom",
        "Date",
        "Time",
        "Status",
        "Host",
        "Source",
        "Lead",
        "Arrived",
      ],
    ],
    body: rows.map((row) => [
      row.test_drive_number,
      `${row.customer_name}\n${row.customer_number}`,
      row.customer_phone ?? "—",
      `${row.vehicle_title}\n${row.stock_id}`,
      row.location_name,
      formatDate(row.scheduled_start),
      formatTimeRange(row.scheduled_start, row.scheduled_end),
      row.status,
      row.staff_name ?? "Unassigned",
      row.request_source_name ?? "—",
      row.lead_number ?? "—",
      row.checked_in_at ? "Yes" : "—",
    ]),
    headStyles: { fillColor: [17, 31, 66], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    margin: { top: 14, bottom: 14, left: 10, right: 10 },
  });

  // Footers are drawn after the table, once the real page count is known.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Optimus Megatron Cars · Confidential", 14, pageHeight - 8);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
