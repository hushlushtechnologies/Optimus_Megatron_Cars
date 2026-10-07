import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import { join } from "path";

import type { LeadExportRow } from "@/src/lib/supabase/lead-export-queries";

/* =========================================================
   CONFIG
========================================================= */

const LOGO_PATH = join(process.cwd(), "public", "logo.png");

/* =========================================================
   GENERATE LEAD EXCEL
========================================================= */

export async function generateLeadExcel(rows: LeadExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Optimus Megatron Cars";

  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Leads", {
    views: [
      {
        state: "frozen",

        ySplit: 4,
      },
    ],
  });

  /* =========================================================
     LOGO
  ========================================================= */

  try {
    /*
     * Do not pass Node's Buffer directly to ExcelJS.
     *
     * Recent Node typings can expose Buffer<ArrayBuffer>
     * while ExcelJS expects its older Buffer type.
     *
     * Using base64 avoids that typing conflict entirely.
     */

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
  } catch (error: unknown) {
    /*
     * The export can still be generated if the logo
     * does not exist or cannot be read.
     */

    console.warn("Lead export logo could not be loaded:", error);
  }

  /* =========================================================
     TITLE
  ========================================================= */

  sheet.mergeCells("B1:D1");

  sheet.getCell("B1").value = "Optimus Megatron Cars — Lead Export";

  sheet.getCell("B1").font = {
    bold: true,

    size: 13,

    color: {
      argb: "FF111F42",
    },
  };

  /* =========================================================
     EXPORT INFO
  ========================================================= */

  sheet.mergeCells("B2:D2");

  sheet.getCell("B2").value =
    `Generated ${new Date().toLocaleString()} · ${rows.length} lead${rows.length === 1 ? "" : "s"}`;

  sheet.getCell("B2").font = {
    size: 9,

    color: {
      argb: "FF6B7280",
    },
  };

  /* =========================================================
     COLUMNS
  ========================================================= */

  sheet.columns = [
    {
      header: "",
      key: "_spacer",
      width: 2,
    },

    {
      header: "Lead ID",
      key: "lead_number",
      width: 16,
    },

    {
      header: "Customer",
      key: "customer_name",
      width: 22,
    },

    {
      header: "Customer ID",
      key: "customer_number",
      width: 16,
    },

    {
      header: "Vehicle",
      key: "vehicle_title",
      width: 26,
    },

    {
      header: "Brand",
      key: "brand_name",
      width: 14,
    },

    {
      header: "Source",
      key: "source_name",
      width: 16,
    },

    {
      header: "Stage",
      key: "stage_name",
      width: 14,
    },

    {
      header: "Temperature",

      key: "temperature",

      width: 12,
    },

    {
      header: "Assigned Staff",

      key: "assigned_staff_name",

      width: 18,
    },

    {
      header: "Next Follow-Up",

      key: "follow_up",

      width: 18,
    },

    {
      header: "Created Date",

      key: "created",

      width: 14,
    },

    {
      header: "Last Activity",

      key: "last_activity",

      width: 18,
    },

    {
      header: "Lost Reason",

      key: "lost_reason",

      width: 16,
    },
  ];

  /* =========================================================
     HEADER ROW
  ========================================================= */

  const headerRow = sheet.getRow(4);

  headerRow.values = [
    "",
    "Lead ID",
    "Customer",
    "Customer ID",
    "Vehicle",
    "Brand",
    "Source",
    "Stage",
    "Temperature",
    "Assigned Staff",
    "Next Follow-Up",
    "Created Date",
    "Last Activity",
    "Lost Reason",
  ];

  headerRow.font = {
    bold: true,

    color: {
      argb: "FFFFFFFF",
    },
  };

  headerRow.fill = {
    type: "pattern",

    pattern: "solid",

    fgColor: {
      argb: "FF111F42",
    },
  };

  headerRow.alignment = {
    vertical: "middle",
  };

  headerRow.height = 22;

  /* =========================================================
     DATA ROWS
  ========================================================= */

  for (const row of rows) {
    sheet.addRow({
      _spacer: "",

      lead_number: row.lead_number,

      customer_name: row.customer_name,

      customer_number: row.customer_number,

      vehicle_title: row.vehicle_title ?? "—",

      brand_name: row.brand_name ?? "—",

      source_name: row.source_name ?? "—",

      stage_name: row.stage_name,

      temperature: row.temperature,

      assigned_staff_name: row.assigned_staff_name ?? "Unassigned",

      follow_up: row.next_follow_up_at ? new Date(row.next_follow_up_at).toLocaleString() : "—",

      created: new Date(row.created_at).toLocaleDateString(),

      last_activity: row.last_activity_at ? new Date(row.last_activity_at).toLocaleString() : "—",

      lost_reason: row.lost_reason_name ?? "—",
    });
  }

  /* =========================================================
     DATA STYLING
  ========================================================= */

  const firstDataRow = 5;

  const lastDataRow = 4 + rows.length;

  if (rows.length > 0) {
    for (let rowNumber = firstDataRow; rowNumber <= lastDataRow; rowNumber += 1) {
      const currentRow = sheet.getRow(rowNumber);

      currentRow.alignment = {
        vertical: "middle",

        wrapText: true,
      };

      currentRow.height = 20;
    }
  }

  /* =========================================================
     FILTER
  ========================================================= */

  sheet.autoFilter = {
    from: "B4",

    to: `N${Math.max(4, lastDataRow)}`,
  };

  /* =========================================================
     OUTPUT
  ========================================================= */

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(arrayBuffer);
}
