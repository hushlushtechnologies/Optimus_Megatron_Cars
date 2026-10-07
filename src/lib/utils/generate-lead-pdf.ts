import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { readFileSync } from "fs";
import { join } from "path";
import type { LeadExportRow } from "@/src/lib/supabase/lead-export-queries";

const LOGO_PATH = join(process.cwd(), "public", "logo.png");

function loadLogoBase64(): string | null {
  try {
    const buffer = readFileSync(LOGO_PATH);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export function generateLeadPdf(rows: LeadExportRow[]): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
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
  doc.text("Lead Export", logo ? 30 : 14, 17);

  doc.setFontSize(8);
  doc.setTextColor(200, 205, 215);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${rows.length} lead${rows.length === 1 ? "" : "s"}`,
    pageWidth - 14,
    17,
    { align: "right" },
  );

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
    body: rows.map((r) => [
      r.lead_number,
      r.customer_name,
      r.customer_number,
      r.vehicle_title ?? "—",
      r.brand_name ?? "—",
      r.source_name ?? "—",
      r.stage_name,
      r.temperature,
      r.assigned_staff_name ?? "Unassigned",
      r.next_follow_up_at ? new Date(r.next_follow_up_at).toLocaleDateString() : "—",
      new Date(r.created_at).toLocaleDateString(),
      r.lost_reason_name ?? "—",
    ]),
    headStyles: { fillColor: [17, 31, 66], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },
    margin: { top: 30, left: 10, right: 10 },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, {
        align: "right",
      });
      doc.text("Optimus Megatron Cars · Confidential", 14, doc.internal.pageSize.getHeight() - 8);
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
