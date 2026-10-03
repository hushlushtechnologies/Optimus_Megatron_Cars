import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import { join } from "path";
import type { ExportRow } from "@/src/lib/supabase/inventory-queries";

const LOGO_PATH = join(process.cwd(), "public", "logo.png");

export async function generateInventoryExcel(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Optimus Megatron Cars";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Inventory", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  // Logo + title band (rows 1–2), data starts at row 3
  // Logo + title band (rows 1–2), data starts at row 3
  try {
    const logoBase64 = readFileSync(LOGO_PATH).toString("base64");

    const logoId = workbook.addImage({
      base64: `data:image/png;base64,${logoBase64}`,
      extension: "png",
    });

    sheet.addImage(logoId, {
      tl: {
        col: 0,
        row: 0,
      },
      ext: {
        width: 48,
        height: 48,
      },
    });
  } catch {
    // No logo file yet — sheet still generates correctly without it.
  }

  sheet.mergeCells("B1:D1");
  sheet.getCell("B1").value = "Optimus Megatron Cars — Inventory Export";
  sheet.getCell("B1").font = {
    bold: true,
    size: 13,
    color: { argb: "FF111F42" },
  };

  sheet.mergeCells("B2:D2");
  sheet.getCell("B2").value =
    `Generated ${new Date().toLocaleString()} · ${rows.length} vehicle${rows.length === 1 ? "" : "s"}`;
  sheet.getCell("B2").font = { size: 9, color: { argb: "FF6B7280" } };

  sheet.getRow(3).values = [];

  sheet.columns = [
    { header: "", key: "_spacer", width: 2 },
    { header: "Stock ID", key: "stock_id", width: 14 },
    { header: "Vehicle", key: "display_title", width: 32 },
    { header: "Brand", key: "brand", width: 16 },
    { header: "Model", key: "model", width: 16 },
    { header: "Variant", key: "variant", width: 18 },
    { header: "Year", key: "year", width: 8 },
    { header: "Price (AED)", key: "price", width: 14 },
    { header: "Mileage (km)", key: "mileage", width: 14 },
    { header: "Location", key: "location", width: 14 },
    { header: "Collection", key: "collection", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Fuel", key: "fuel", width: 12 },
    { header: "Transmission", key: "transmission", width: 14 },
    { header: "Created", key: "created", width: 14 },
  ];

  const headerRow = sheet.getRow(4);
  headerRow.values = [
    "",
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
    "Status",
    "Fuel",
    "Transmission",
    "Created",
  ];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111F42" },
  };
  headerRow.eachCell((cell) => {
    cell.alignment = { vertical: "middle" };
  });

  rows.forEach((row) => {
    sheet.addRow({
      _spacer: "",
      stock_id: row.stock_id,
      display_title: row.display_title,
      brand: row.brand ?? "",
      model: row.model ?? "",
      variant: row.variant ?? "",
      year: row.manufacturing_year,
      price: row.regular_price ?? "",
      mileage: row.mileage_km ?? "",
      location: row.location ?? "",
      collection: row.collection ?? "",
      status: row.status ?? "",
      fuel: row.fuel ?? "",
      transmission: row.transmission ?? "",
      created: new Date(row.created_at).toLocaleDateString(),
    });
  });

  sheet.getColumn("price").numFmt = "#,##0";
  sheet.getColumn("mileage").numFmt = "#,##0";
  sheet.autoFilter = { from: "B4", to: `O${4 + rows.length}` };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
