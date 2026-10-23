"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import {
  Ban,
  BadgeCheck,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  LogIn,
  Table as TableIcon,
  TriangleAlert,
} from "lucide-react";
import { MetricCard } from "@/src/components/shared/metric-card";
import { IconButton } from "@/src/components/ui/icon-button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tooltip } from "@/src/components/ui/tooltip";
import { TestDriveMetricsHelp } from "@/src/components/test-drives/test-drive-metrics-help";
import { TestDriveTable } from "@/src/components/test-drives/test-drive-table";
import { TestDriveToolbar } from "@/src/components/test-drives/test-drive-toolbar";
import { TestDriveCalendar } from "@/src/components/test-drives/calendar/test-drive-calendar";
import { useTestDriveView, type TestDriveView } from "@/src/hooks/use-test-drive-view";
import { EMPTY_TEST_DRIVE_METRICS, type TestDriveMetrics } from "@/src/lib/utils/test-drive-metrics";
import type { TestDriveCalendarParams } from "@/src/lib/utils/test-drive-calendar";
import type { TestDriveCalendarFilterOptions, TestDriveListRow } from "@/src/lib/types/test-drive";
import type { TestDriveFilterLookups } from "@/src/lib/supabase/test-drive-filter-lookups";
import { parseTestDriveListParams } from "@/src/lib/utils/test-drive-list-params";
import {
  TEST_DRIVE_FILTER_PARAM_KEYS,
  countActiveTestDriveFilters,
} from "@/src/lib/utils/test-drive-list-filters";
import { Button } from "@/src/components/ui/button";

interface TestDrivesPageClientProps {
  /** null when the summary query failed. */
  metrics: TestDriveMetrics | null;
  initialView: TestDriveView;
  /** null while the table view's data isn't loaded (calendar view, or mid-switch). */
  tableData: { rows: TestDriveListRow[]; totalCount: number } | null;
  tableLoadFailed: boolean;
  page: number;
  pageSize: number;
  /** Options for the table's filter drawer. */
  filterLookups: TestDriveFilterLookups;
  filterLookupsFailed: boolean;
  /** null while the calendar's data isn't loaded (table view, or mid-switch). */
  calendarData: { rows: TestDriveListRow[]; truncated: boolean } | null;
  calendarLoadFailed: boolean;
  calendarParams: TestDriveCalendarParams;
  calendarFilterOptions: TestDriveCalendarFilterOptions;
  /** Whether the current user may approve and reject requests. */
  permissions: TestDrivePermissions;
}

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

function ViewLoading({ label }: { label: string }) {
  return (
    <div className="surface-card p-5" aria-busy="true" aria-label={label}>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function TestDrivesPageClient({
  metrics,
  initialView,
  tableData,
  tableLoadFailed,
  page,
  pageSize,
  filterLookups,
  filterLookupsFailed,
  calendarData,
  calendarLoadFailed,
  calendarParams,
  calendarFilterOptions,
  permissions,
}: TestDrivesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { view, setView, isPending } = useTestDriveView(initialView);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const m = metrics ?? EMPTY_TEST_DRIVE_METRICS;

  const listQuery = useMemo(
    () => parseTestDriveListParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const hasActiveQuery = listQuery.search !== "" || countActiveTestDriveFilters(listQuery.filters) > 0;

  // A different search, filter or sort means a different list, so earlier ticks no longer apply.
  const queryKey = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("pageSize");
    return params.toString();
  })();
  const [selectionKey, setSelectionKey] = useState(queryKey);
  if (selectionKey !== queryKey) {
    setSelectionKey(queryKey);
    setRowSelection({});
  }

  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearSearchAndFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    TEST_DRIVE_FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h3">Test Drives</h1>
          <p className="text-body-sm text-text-muted">
            Manage test drive requests, scheduling, approvals, and appointments across Optimus locations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {permissions.checkIn && (
            <Link href="/admin/test-drives/check-in">
              <Button variant="secondary" size="sm" leftIcon={<LogIn className="size-4" />}>
                Check-in desk
              </Button>
            </Link>
          )}

          {permissions.create && (
            <Link href="/admin/test-drives/new">
              <Button variant="gradient" size="sm" leftIcon={<Plus className="size-4" />}>
                Add Test Drive
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!metrics && (
        <div
          role="alert"
          className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          The summary numbers couldn&apos;t be loaded, so the cards below show zeros for now. Refresh the page
          to try again.
        </div>
      )}

      <section aria-label="Test drive summary" className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Total Requests"
            value={m.total.value}
            icon={<ClipboardList />}
            change={m.total.change}
            trend={m.total.trend}
          />
          <MetricCard
            label="Pending"
            value={m.pending.value}
            icon={<Clock />}
            change={m.pending.change}
            changeTone="neutral"
            trend={m.pending.trend}
          />
          <MetricCard
            label="Approved"
            value={m.approved.value}
            icon={<CheckCircle2 />}
            change={m.approved.change}
            changeTone="neutral"
            trend={m.approved.trend}
          />
          <MetricCard
            label="Today"
            value={m.today.value}
            icon={<CalendarDays />}
            change={m.today.change}
            changeTone="neutral"
            trend={m.today.trend}
          />
          <MetricCard
            label="Completed"
            value={m.completed.value}
            icon={<BadgeCheck />}
            change={m.completed.change}
            changeTone="neutral"
            trend={m.completed.trend}
          />
          <MetricCard
            label="Cancelled"
            value={m.cancelled.value}
            icon={<Ban />}
            change={m.cancelled.change}
            changeTone="neutral"
            trend={m.cancelled.trend}
          />
        </div>

        <TestDriveMetricsHelp />
      </section>

      <div className="flex items-center justify-end">
        <div
          role="group"
          aria-label="Switch view"
          className="border-border flex items-center rounded-md border p-0.5"
        >
          <Tooltip content="Table view: sortable list of every request">
            <IconButton
              aria-label="Table view"
              aria-pressed={view === "table"}
              variant={view === "table" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
            >
              <TableIcon className="size-4" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Calendar view: appointments by day, week or month">
            <IconButton
              aria-label="Calendar view"
              aria-pressed={view === "calendar"}
              variant={view === "calendar" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              <Calendar className="size-4" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* The search and filters belong to the table. The calendar keeps its own. */}
      {view === "table" && (
        <TestDriveToolbar
          resultCount={tableData?.totalCount ?? 0}
          lookups={filterLookups}
          lookupsFailed={filterLookupsFailed}
          canExport={permissions.export}
        />
      )}

      <div
        className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}
        aria-busy={isPending}
      >
        {view === "table" ? (
          tableData ? (
            <TestDriveTable
              rows={tableData.rows}
              archivedView={listQuery.archived}
              totalCount={tableData.totalCount}
              page={page}
              permissions={permissions}
              pageSize={pageSize}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              onPageChange={(p) => updateParams({ page: String(p) })}
              onPageSizeChange={(size) => updateParams({ pageSize: String(size), page: "1" })}
              hasActiveQuery={hasActiveQuery}
              onClearQuery={clearSearchAndFilters}

              staff={filterLookups.staff}
            />
          ) : tableLoadFailed ? (
            <LoadFailed what="test drives" />
          ) : (
            <ViewLoading label="Loading test drives" />
          )
        ) : calendarData ? (
          <TestDriveCalendar
            rows={calendarData.rows}
            truncated={calendarData.truncated}
            params={calendarParams}
            permissions={permissions}
            options={calendarFilterOptions}
          />
        ) : calendarLoadFailed ? (
          <LoadFailed what="calendar" />
        ) : (
          <ViewLoading label="Loading calendar" />
        )}
      </div>
    </div>
  );
}
