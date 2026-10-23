import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { requireTestDrivePermission } from "@/src/lib/supabase/test-drive-permissions";
import { getTestDriveExportRows } from "@/src/lib/supabase/test-drive-export-queries";
import { recordTestDriveAudit } from "@/src/lib/supabase/test-drive-audit";
import { parseTestDriveListParams } from "@/src/lib/utils/test-drive-list-params";
import { countActiveTestDriveFilters } from "@/src/lib/utils/test-drive-list-filters";
import { generateTestDriveExcel } from "@/src/lib/utils/generate-test-drive-excel";
import { generateTestDrivePdf } from "@/src/lib/utils/generate-test-drive-pdf";
import { getDubaiToday } from "@/src/lib/utils/test-drive-format";
import { EXPORT_ROW_LIMITS, MAX_EXPORT_SELECTED } from "@/src/lib/utils/test-drive-export";

// exceljs and jspdf need Node, and the answer depends on who is asking.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const maxDuration = 60;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const permission = await requireTestDrivePermission("export");
  if (!permission.allowed) {
    return fail(permission.error ?? "You don't have permission to export test drives.", 403);
  }

  const params = request.nextUrl.searchParams;
  const format = params.get("format");
  if (format !== "excel" && format !== "pdf") return fail("Invalid export format.", 400);

  const scope = params.get("scope") === "selected" ? "selected" : "current";

  let ids: string[] | undefined;
  if (scope === "selected") {
    const parsedIds = z
      .array(z.string().uuid())
      .min(1, "Select at least one test drive to export.")
      .max(MAX_EXPORT_SELECTED, `Select at most ${MAX_EXPORT_SELECTED} test drives to export at once.`)
      .safeParse((params.get("ids") ?? "").split(",").filter(Boolean));

    if (!parsedIds.success) {
      return fail(parsedIds.error.issues[0]?.message ?? "The selection isn't valid.", 400);
    }
    ids = [...new Set(parsedIds.data)];
  }

  try {
    const list = parseTestDriveListParams(Object.fromEntries(params.entries()));
    const filterCount = countActiveTestDriveFilters(list.filters);
    const hasQuery = list.search !== "" || filterCount > 0;

    const result = await getTestDriveExportRows({
      scope,
      ids,
      search: list.search,
      filters: list.filters,
      sort: list.sort,
      archived: list.archived,
      limit: EXPORT_ROW_LIMITS[format],
    });

    if (!result) return fail("Unable to read the test drives. Please try again.", 500);
    if (result.rows.length === 0) return fail("There is nothing to export for the current selection.", 400);

    const meta = {
      scopeLabel:
        scope === "selected"
          ? `${result.rows.length} selected${list.archived ? " (archived)" : ""}`
          : hasQuery
            ? `Filtered list${list.archived ? " (archived)" : ""}`
            : list.archived
              ? "All archived test drives"
              : "All active test drives",
      total: result.total,
      truncated: result.truncated,
    };

    // Who exported what. Counts and settings only: never the search text, which can hold a phone number.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await recordTestDriveAudit(supabase, {
        userId: user.id,
        kind: "export",
        rowCount: result.rows.length,
        detail: {
          format,
          scope,
          archived: list.archived,
          matched: result.total,
          truncated: result.truncated,
          search_used: list.search !== "",
          filters: filterCount > 0 ? list.filters : null,
          selected_ids: scope === "selected" ? ids?.length : null,
        },
      });
    }

    const dateStamp = getDubaiToday();
    const headers: Record<string, string> = {
      "Cache-Control": "no-store",
      "X-Export-Count": String(result.rows.length),
      "X-Export-Total": String(result.total),
      "X-Export-Truncated": String(result.truncated),
    };

    if (format === "excel") {
      const buffer = await generateTestDriveExcel(result.rows, meta);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          ...headers,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="omc-test-drives-${dateStamp}.xlsx"`,
        },
      });
    }

    const buffer = generateTestDrivePdf(result.rows, meta);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="omc-test-drives-${dateStamp}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Test drive export error:", error);
    return fail("Unable to generate the export. Please try again.", 500);
  }
}
