import { NextRequest, NextResponse } from "next/server";
import { getExportRows } from "@/src/lib/supabase/inventory-queries";
import { parseInventoryFilters } from "@/src/lib/utils/inventory-filters";
import { generateInventoryExcel } from "@/src/lib/utils/generate-inventory-excel";
import { generateInventoryPdf } from "@/src/lib/utils/generate-inventory-pdf";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const format = params.get("format");
  const scope = (params.get("scope") ?? "current") as "current" | "selected";

  if (format !== "excel" && format !== "pdf") {
    return NextResponse.json({ error: "Invalid export format." }, { status: 400 });
  }

  try {
    const ids = params.get("ids")?.split(",").filter(Boolean);
    const filters = parseInventoryFilters(Object.fromEntries(params.entries()));

    const rows = await getExportRows({
      scope,
      ids,
      search: params.get("q") ?? undefined,
      archived: params.get("archived") === "true",
      filters,
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "There is nothing to export for the current selection." },
        { status: 400 },
      );
    }

    const dateStamp = new Date().toISOString().slice(0, 10);

    if (format === "excel") {
      const buffer = await generateInventoryExcel(rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="omc-inventory-${dateStamp}.xlsx"`,
        },
      });
    }

    const buffer = generateInventoryPdf(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="omc-inventory-${dateStamp}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Inventory export error:", error);
    return NextResponse.json({ error: "Unable to generate the export. Please try again." }, { status: 500 });
  }
}
