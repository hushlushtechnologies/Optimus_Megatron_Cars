"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  Kanban,
  LayoutGrid,
  Plus,
  Table as TableIcon,
  Timer,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { MetricCard } from "@/src/components/shared/metric-card";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tooltip } from "@/src/components/ui/tooltip";
import { SalesToolbar } from "@/src/components/sales/sales-toolbar";
import { SalesTable } from "@/src/components/sales/sales-table";
import { SalesBoard } from "@/src/components/sales/sales-board";
import type { SalesFilterLookups } from "@/src/lib/supabase/sales-filter-lookups";
import type { SalesBoardColumn, SalesListRow, SalesSummary, SalesView } from "@/src/lib/types/sales-list";
import type { SalesDealStatus } from "@/src/lib/types/sales";
import type { SalesPermissions } from "@/src/lib/utils/sales-permissions";
import { parseSalesListParams } from "@/src/lib/utils/sales-list-params";
import {
  SALES_FILTER_PARAM_KEYS,
  countActiveSalesFilters,
  writeSalesFiltersToParams,
} from "@/src/lib/utils/sales-list-filters";

interface SalesPageClientProps {
  /** null when the summary query failed. */
  summary: SalesSummary | null;
  view: SalesView;
  tableData: { rows: SalesListRow[]; totalCount: number } | null;
  boardData: SalesBoardColumn[] | null;
  loadFailed: boolean;
  page: number;
  pageSize: number;
  filterLookups: SalesFilterLookups;
  filterLookupsFailed: boolean;
  permissions: SalesPermissions;
}

const VIEWS: { key: SalesView; label: string; hint: string; Icon: typeof TableIcon }[] = [
  { key: "table", label: "Table view", hint: "Sortable list with customisable columns", Icon: TableIcon },
  { key: "grid", label: "Grid view", hint: "Deal cards, easier to scan", Icon: LayoutGrid },
  { key: "board", label: "Board view", hint: "Open deals by stage", Icon: Kanban },
];

function LoadFailed({ what }: { what: string }) {
  return (
    <div role="alert" className="surface-card flex items-start gap-3 p-5">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
      <div>
        <p className="text-body-sm text-text-primary font-medium">The {what} couldn&apos;t be loaded.</p>
        <p className="text-body-sm text-text-muted mt-0.5">
          Nothing has been lost. Refresh the page to try again, and let someone know if it keeps happening.
        </p>
      </div>
    </div>
  );
}

const ZERO_SUMMARY: SalesSummary = {
  openCount: 0,
  reservedCount: 0,
  confirmedCount: 0,
  completedMonthCount: 0,
  completedMonthValue: 0,
  outstandingBalance: 0,
  pipelineValue: 0,
  expiringHolds: 0,
};

export function SalesPageClient({
  summary,
  view,
  tableData,
  boardData,
  loadFailed,
  page,
  pageSize,
  filterLookups,
  filterLookupsFailed,
  permissions,
}: SalesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const s = summary ?? ZERO_SUMMARY;

  const query = useMemo(
    () => parseSalesListParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const hasActiveQuery = query.search !== "" || countActiveSalesFilters(query.filters) > 0;

  const go = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const setView = (next: SalesView) =>
    go((params) => {
      if (next === "table") params.delete("view");
      else params.set("view", next);
      params.set("page", "1");
    });

  const clearSearchAndFilters = () =>
    go((params) => {
      params.delete("q");
      SALES_FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
      params.set("page", "1");
    });

  const viewAllInTable = (status: SalesDealStatus) =>
    go((params) => {
      params.delete("view");
      writeSalesFiltersToParams(params, { ...query.filters, status: [status] });
      params.set("page", "1");
    });

  const resultCount =
    view === "board" ? (boardData?.reduce((sum, c) => sum + c.total, 0) ?? 0) : (tableData?.totalCount ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h3">Sales</h1>
          <p className="text-body-sm text-text-muted">
            Track every deal from first offer to delivery across Optimus showrooms.
          </p>
        </div>
        {permissions.create && (
          <Link href="/admin/sales/new">
            <Button variant="gradient" size="sm" leftIcon={<Plus className="size-4" />}>
              New Deal
            </Button>
          </Link>
        )}
      </div>

      {!summary && (
        <div
          role="alert"
          className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          The summary numbers couldn&apos;t be loaded, so the cards below show zeros for now. Refresh the page
          to try again.
        </div>
      )}

      <section aria-label="Sales summary" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Open deals"
          value={s.openCount}
          icon={<FileText />}
          caption="Draft and negotiation"
        />
        <MetricCard label="Reserved" value={s.reservedCount} icon={<Clock />} caption="Vehicle on hold" />
        <MetricCard
          label="Confirmed"
          value={s.confirmedCount}
          icon={<CheckCircle2 />}
          caption="Awaiting delivery"
        />
        <MetricCard
          label="Completed"
          value={s.completedMonthCount}
          icon={<BadgeCheck />}
          caption="Delivered this month"
        />
        <MetricCard
          label="Outstanding"
          value={s.outstandingBalance}
          prefix="AED "
          icon={<Wallet />}
          caption="Verified balance due"
        />
        <MetricCard
          label="Expiring soon"
          value={s.expiringHolds}
          icon={<Timer />}
          caption="Holds ending in 24 hours"
        />
      </section>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SalesToolbar
              resultCount={resultCount}
              lookups={filterLookups}
              lookupsFailed={filterLookupsFailed}
            />
          </div>
          <div
            role="group"
            aria-label="Switch view"
            className="border-border flex shrink-0 items-center rounded-md border p-0.5"
          >
            {VIEWS.map(({ key, label, hint, Icon }) => (
              <Tooltip key={key} content={hint}>
                <IconButton
                  aria-label={label}
                  aria-pressed={view === key}
                  variant={view === key ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setView(key)}
                  className="size-11 sm:size-9"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </IconButton>
              </Tooltip>
            ))}
          </div>
        </div>

        <div
          className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}
          aria-busy={isPending}
        >
          {loadFailed ? (
            <LoadFailed what={view === "board" ? "pipeline" : "deals"} />
          ) : view === "board" ? (
            boardData ? (
              <SalesBoard columns={boardData} onViewAll={viewAllInTable} />
            ) : (
              <Skeleton className="h-72 w-full" />
            )
          ) : tableData ? (
            <SalesTable
              rows={tableData.rows}
              totalCount={tableData.totalCount}
              page={page}
              pageSize={pageSize}
              variant={view === "grid" ? "grid" : "table"}
              onPageChange={(p) => go((params) => params.set("page", String(p)))}
              onPageSizeChange={(size) =>
                go((params) => {
                  params.set("pageSize", String(size));
                  params.set("page", "1");
                })
              }
              hasActiveQuery={hasActiveQuery}
              onClearQuery={clearSearchAndFilters}
              canCreate={permissions.create}
            />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
