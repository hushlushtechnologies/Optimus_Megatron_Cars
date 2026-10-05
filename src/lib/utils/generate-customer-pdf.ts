import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CustomerExportRow } from "@/src/lib/supabase/customer-export-queries";

export function generateCustomerPdf(rows: CustomerExportRow[]): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text("Optimus Megatron Cars — Customer Export", 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${rows.length} customer${rows.length === 1 ? "" : "s"}`,
    14,
    21,
  );

  autoTable(doc, {
    startY: 27,
    head: [["Customer ID", "Name", "Email", "Phone", "Status", "Joined", "Active Deals", "Purchased"]],
    body: rows.map((r) => [
      r.customer_number,
      r.full_name,
      r.email,
      r.phone,
      r.lifecycle_status,
      new Date(r.created_at).toLocaleDateString(),
      String(r.activeDealsCount),
      String(r.purchasedCount),
    ]),
    headStyles: { fillColor: [17, 31, 66] },
    styles: { fontSize: 9 },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
