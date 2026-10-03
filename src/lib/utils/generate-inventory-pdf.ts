import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { readFileSync } from "fs";
import { join } from "path";
import type { ExportRow } from "@/src/lib/supabase/inventory-queries";

// Looks for a logo at public/logo.png. If it isn't there yet, the PDF still
// generates correctly — just without the logo band — rather than crashing
// the export. Confirm the real path/filename and I'll update this constant.
const LOGO_PATH = join(process.cwd(), "public", "logo.png");

function loadLogoBase64(): string | null {
  try {
    const buffer = readFileSync(LOGO_PATH);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export function generateInventoryPdf(rows: ExportRow[]): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = loadLogoBase64();

  // Header band
  doc.setFillColor(17, 31, 66);
  doc.rect(0, 0, pageWidth, 24, "F");

  if (logo) {
    doc.addImage(logo, "PNG", 10, 4, 16, 16);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Optimus Megatron Cars", logo ? 30 : 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Inventory Export", logo ? 30 : 14, 17);

  doc.setFontSize(8);
  doc.setTextColor(200, 205, 215);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${rows.length} vehicle${rows.length === 1 ? "" : "s"}`,
    pageWidth - 14,
    17,
    { align: "right" },
  );

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Stock ID",
        "Vehicle",
        "Brand",
        "Model",
        "Variant",
        "Year",
        "Price (AED)",
        "Mileage (km)",
        "Location",
        "Collection",
        "Fuel",
        "Transmission",
        "Status",
      ],
    ],
    body: rows.map((r) => [
      r.stock_id,
      r.display_title,
      r.brand ?? "—",
      r.model ?? "—",
      r.variant ?? "—",
      String(r.manufacturing_year),
      r.regular_price !== null ? r.regular_price.toLocaleString() : "—",
      r.mileage_km !== null ? r.mileage_km.toLocaleString() : "—",
      r.location ?? "—",
      r.collection ?? "—",
      r.fuel ?? "—",
      r.transmission ?? "—",
      r.status ?? "—",
    ]),
    headStyles: {
      fillColor: [17, 31, 66],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 20 }, // Stock ID
      1: { cellWidth: 34 }, // Vehicle
    },
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
