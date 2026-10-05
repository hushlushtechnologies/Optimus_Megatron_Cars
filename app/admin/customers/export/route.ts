import { NextRequest, NextResponse } from "next/server";

import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import { getCustomerExportRows } from "@/src/lib/supabase/customer-export-queries";
import { parseCustomerFilters } from "@/src/lib/utils/customer-filters";

import { generateCustomerExcel } from "@/src/lib/utils/generate-customer-excel";
import { generateCustomerPdf } from "@/src/lib/utils/generate-customer-pdf";

/* =========================================================
   HELPERS
========================================================= */

/**
 * NextResponse expects a web-compatible BodyInit.
 *
 * Node Buffer is typed as Buffer<ArrayBufferLike>,
 * which newer TypeScript versions do not consider
 * directly compatible with BodyInit.
 *
 * Creating a fresh Uint8Array gives us an
 * ArrayBuffer-backed body that NextResponse accepts.
 */
function bufferToResponseBody(buffer: Buffer): Uint8Array<ArrayBuffer> {
  const body = new Uint8Array(buffer.byteLength);

  body.set(buffer);

  return body;
}

/* =========================================================
   GET
========================================================= */

export async function GET(request: NextRequest) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return NextResponse.json(
      {
        error: permission.error,
      },
      {
        status: 403,
      },
    );
  }

  const params = request.nextUrl.searchParams;

  const format = params.get("format");

  const scope = (params.get("scope") ?? "current") as "current" | "selected";

  /* =========================================================
     VALIDATE FORMAT
  ========================================================= */

  if (format !== "excel" && format !== "pdf") {
    return NextResponse.json(
      {
        error: "Invalid export format.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    /* =======================================================
       QUERY PARAMS
    ======================================================= */

    const ids = params.get("ids")?.split(",").filter(Boolean);

    const filters = parseCustomerFilters(Object.fromEntries(params.entries()));

    /* =======================================================
       FETCH EXPORT DATA
    ======================================================= */

    const rows = await getCustomerExportRows({
      scope,

      ids,

      search: params.get("q") ?? undefined,

      archived: params.get("archived") === "true",

      filters,
    });

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "There is nothing to export for the current selection.",
        },
        {
          status: 400,
        },
      );
    }

    /* =======================================================
       FILE NAME
    ======================================================= */

    const dateStamp = new Date().toISOString().slice(0, 10);

    /* =======================================================
       EXCEL EXPORT
    ======================================================= */

    if (format === "excel") {
      const buffer = await generateCustomerExcel(rows);

      const body = bufferToResponseBody(buffer);

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition": `attachment; filename="omc-customers-${dateStamp}.xlsx"`,

          "Content-Length": String(body.byteLength),
        },
      });
    }

    /* =======================================================
       PDF EXPORT
    ======================================================= */

    const buffer = generateCustomerPdf(rows);

    const body = bufferToResponseBody(buffer);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `attachment; filename="omc-customers-${dateStamp}.pdf"`,

        "Content-Length": String(body.byteLength),
      },
    });
  } catch (error) {
    console.error("Customer export error:", error);

    return NextResponse.json(
      {
        error: "Unable to generate the export. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}
