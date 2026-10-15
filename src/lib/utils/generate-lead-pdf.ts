import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { readFileSync } from "fs";
import { join } from "path";

import { formatDate, formatDateTime } from "@/src/lib/utils/format-date";

import type { LeadExportRow } from "@/src/lib/supabase/lead-export-queries";

// =========================================================
// CONFIG
// =========================================================

const LOGO_PATH = join(process.cwd(), "public", "logo.png");

// =========================================================
// LOGO HELPER
// =========================================================

function loadLogoBase64(): string | null {
  try {
    const buffer = readFileSync(LOGO_PATH);

    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

// =========================================================
// GENERATE LEAD PDF
// =========================================================

export function generateLeadPdf(rows: LeadExportRow[]): Buffer {
  const doc = new jsPDF({
    orientation: "landscape",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = loadLogoBase64();

  // =======================================================
  // HEADER BACKGROUND
  // =======================================================

  doc.setFillColor(17, 31, 66);
  doc.rect(0, 0, pageWidth, 24, "F");

  // =======================================================
  // LOGO
  // =======================================================

  if (logo) {
    doc.addImage(logo, "PNG", 10, 4, 16, 16);
  }

  // =======================================================
  // COMPANY NAME
  // =======================================================

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");

  doc.text("Optimus Megatron Cars", logo ? 30 : 14, 11);

  // =======================================================
  // EXPORT TITLE
  // =======================================================

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text("Lead Export", logo ? 30 : 14, 17);

  // =======================================================
  // GENERATED DATE — DUBAI TIMEZONE
  // =======================================================

  doc.setFontSize(8);
  doc.setTextColor(200, 205, 215);

  doc.text(
    `Generated ${formatDateTime(new Date())} · ${rows.length} lead${rows.length === 1 ? "" : "s"}`,
    pageWidth - 14,
    17,
    {
      align: "right",
    },
  );

  // =======================================================
  // TABLE
  // =======================================================

  autoTable(doc, {
    startY: 30,

    head: [
      [
        "Lead ID",
        "Customer",
        "Customer ID",
        "Vehicle",
        "Brand",
        "Source",
        "Stage",
        "Temp",
        "Assigned Staff",
        "Next Follow-Up",
        "Created",
        "Lost Reason",
      ],
    ],

    body: rows.map((row) => [
      row.lead_number,

      row.customer_name,

      row.customer_number,

      row.vehicle_title ?? "—",

      row.brand_name ?? "—",

      row.source_name ?? "—",

      row.stage_name,

      row.temperature,

      row.assigned_staff_name ?? "Unassigned",

      // Dubai date only
      row.next_follow_up_at ? formatDate(row.next_follow_up_at) : "—",

      // Dubai date only
      formatDate(row.created_at),

      row.lost_reason_name ?? "—",
    ]),

    // =====================================================
    // TABLE HEADER STYLING
    // =====================================================

    headStyles: {
      fillColor: [17, 31, 66],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },

    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: "linebreak",
    },

    margin: {
      top: 30,
      left: 10,
      right: 10,
    },

    // =====================================================
    // PAGE FOOTER
    // =====================================================

    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();

      const currentPage = doc.getCurrentPageInfo().pageNumber;

      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);

      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 14, pageHeight - 8, {
        align: "right",
      });

      doc.text("Optimus Megatron Cars · Confidential", 14, pageHeight - 8);
    },
  });

  // =======================================================
  // OUTPUT
  // =======================================================

  return Buffer.from(doc.output("arraybuffer"));
}
