import { NextRequest, NextResponse } from "next/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import { getLeadExportRows } from "@/src/lib/supabase/lead-export-queries";
import { parseLeadFilters } from "@/src/lib/utils/lead-filters";
import { generateLeadExcel } from "@/src/lib/utils/generate-lead-excel";
import { generateLeadPdf } from "@/src/lib/utils/generate-lead-pdf";

export async function GET(request: NextRequest) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.error }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const format = params.get("format");
  const scope = (params.get("scope") ?? "current") as "current" | "selected";

  if (format !== "excel" && format !== "pdf") {
    return NextResponse.json({ error: "Invalid export format." }, { status: 400 });
  }

  try {
    const ids = params.get("ids")?.split(",").filter(Boolean);
    const filters = parseLeadFilters(Object.fromEntries(params.entries()));

    const rows = await getLeadExportRows({
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
      const buffer = await generateLeadExcel(rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="omc-leads-${dateStamp}.xlsx"`,
        },
      });
    }

    const buffer = generateLeadPdf(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="omc-leads-${dateStamp}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Lead export error:", error);
    return NextResponse.json({ error: "Unable to generate the export. Please try again." }, { status: 500 });
  }
}
