import ExcelJS from "exceljs";
import type { CustomerExportRow } from "@/src/lib/supabase/customer-export-queries";

export async function generateCustomerExcel(rows: CustomerExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Optimus Megatron Cars";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Customers");
  sheet.columns = [
    { header: "Customer ID", key: "customer_number", width: 16 },
    { header: "Name", key: "full_name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Source", key: "source", width: 16 },
    { header: "Location", key: "location", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Joined", key: "joined", width: 14 },
    { header: "Active Deals", key: "active_deals", width: 14 },
    { header: "Purchased Cars", key: "purchased", width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111F42" } };

  rows.forEach((row) => {
    sheet.addRow({
      customer_number: row.customer_number,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      source: row.source ?? "",
      location: row.location ?? "",
      status: row.lifecycle_status,
      joined: new Date(row.created_at).toLocaleDateString(),
      active_deals: row.activeDealsCount,
      purchased: row.purchasedCount,
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
