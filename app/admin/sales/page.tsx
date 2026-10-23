import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { currentUserSalesPermissions } from "@/src/lib/supabase/sales-permissions";
import { getSalesBoard, getSalesRows, getSalesSummary } from "@/src/lib/supabase/sales-list-queries";
import {
  EMPTY_SALES_FILTER_LOOKUPS_RESULT,
  getSalesFilterLookups,
} from "@/src/lib/supabase/sales-filter-lookups";
import { buildSalesListSearchParams, parseSalesListParams } from "@/src/lib/utils/sales-list-params";
import { SalesPageClient } from "@/src/components/sales/sales-page-client";

interface SalesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const permissions = await currentUserSalesPermissions();

  if (!permissions.view) {
    return (
      <div role="alert" className="surface-card flex max-w-2xl items-start gap-3 p-5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
        <div>
          <p className="text-body-sm text-text-primary font-medium">
            You don&apos;t have permission to view deals.
          </p>
          <p className="text-body-sm text-text-muted mt-1">Ask an administrator if you need access.</p>
          <Link
            href="/admin"
            className="text-body-sm text-primary-text hover:text-primary-hover mt-3 inline-block"
          >
            Back to the dashboard
          </Link>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const list = parseSalesListParams(params);
  const { page, pageSize, sort, view, search, filters } = list;

  const [summary, tableResult, boardResult, lookupsResult] = await Promise.all([
    getSalesSummary(),
    view === "board" ? Promise.resolve(null) : getSalesRows({ page, pageSize, sort, search, filters }),
    view === "board" ? getSalesBoard(search, filters) : Promise.resolve(null),
    view === "board" && false
      ? Promise.resolve(EMPTY_SALES_FILTER_LOOKUPS_RESULT)
      : getSalesFilterLookups(filters.customer, filters.vehicle),
  ]);

  // Past the last page (for example after the list shrank): jump to the real last one, keeping everything.
  if (tableResult && tableResult.totalCount > 0 && page > Math.ceil(tableResult.totalCount / pageSize)) {
    const lastPage = Math.ceil(tableResult.totalCount / pageSize);
    redirect(`/admin/sales?${buildSalesListSearchParams({ ...list, page: lastPage }).toString()}`);
  }

  return (
    <SalesPageClient
      summary={summary}
      view={view}
      tableData={tableResult}
      boardData={boardResult}
      loadFailed={view === "board" ? boardResult === null : tableResult === null}
      page={page}
      pageSize={pageSize}
      filterLookups={lookupsResult.lookups}
      filterLookupsFailed={lookupsResult.failed}
      permissions={permissions}
    />
  );
}
