"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Plus,
  Target,
  Sparkles,
  Clock,
  Flame,
  Trophy,
  XCircle,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { MetricCard } from "@/src/components/shared/metric-card";
import { IconButton } from "@/src/components/ui/icon-button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { LeadToolbar } from "@/src/components/leads/lead-toolbar";
import { LeadKanbanBoard } from "@/src/components/leads/lead-kanban-board";
import { LeadTable } from "@/src/components/leads/lead-table";
import { useLeadView, type LeadView } from "@/src/hooks/use-lead-view";
import { parseLeadFilters, countActiveLeadFilters } from "@/src/lib/utils/lead-filters";
import type { LeadMetrics, LeadKanbanData, LeadRow } from "@/src/lib/supabase/lead-queries";
import type { LeadFilterLookups } from "@/src/lib/supabase/lead-lookups";
import type { LeadLostReason } from "@/src/lib/types/lead";

interface LeadsPageClientProps {
  metrics: LeadMetrics;
  initialView: LeadView;
  kanbanData: LeadKanbanData | null;
  tableData: { rows: LeadRow[]; totalCount: number } | null;
  resultCount: number;
  page: number;
  pageSize: number;
  filterLookups: LeadFilterLookups;
  lostReasons: LeadLostReason[];
}

function ViewLoading() {
  return (
    <div className="surface-card p-5" aria-busy="true">
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function LeadsPageClient({
  metrics,
  initialView,
  kanbanData,
  tableData,
  resultCount,
  page,
  pageSize,
  filterLookups,
  lostReasons,
}: LeadsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { view, setView, isPending } = useLeadView(initialView);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters =
    !!searchParams.get("q") ||
    countActiveLeadFilters(parseLeadFilters(Object.fromEntries(searchParams.entries()))) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1">Leads</h1>
          <p className="text-body-sm text-text-muted">
            Every customer opportunity, tracked from first contact through to a sale.
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="bg-primary text-body hover:bg-primary-hover inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-[#0b1220] transition-colors"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Lead
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Leads"
          value={metrics.total}
          icon={<Target />}
          change={metrics.totalChange}
          trend={metrics.totalTrend}
        />
        <MetricCard label="New Leads" value={metrics.newLeads} icon={<Sparkles />} />
        <MetricCard label="Follow-Ups Due" value={metrics.followUpsDue} icon={<Clock />} />
        <MetricCard label="Hot Leads" value={metrics.hotLeads} icon={<Flame />} />
        <MetricCard label="Won" value={metrics.won} icon={<Trophy />} />
        <MetricCard label="Lost" value={metrics.lost} icon={<XCircle />} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <LeadToolbar
            resultCount={resultCount}
            filterLookups={filterLookups}
            showArchivedToggle={view === "table"}
          />
        </div>
        <div
          role="group"
          aria-label="Switch view"
          className="border-border flex items-center rounded-md border p-0.5"
        >
          <IconButton
            aria-label="Kanban view"
            aria-pressed={view === "kanban"}
            variant={view === "kanban" ? "outline" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="size-4" />
          </IconButton>
          <IconButton
            aria-label="Table view"
            aria-pressed={view === "table"}
            variant={view === "table" ? "outline" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
          >
            <TableIcon className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {view === "kanban" ? (
          kanbanData ? (
            <>
              {resultCount === 0 && hasActiveFilters && (
                <p role="status" className="text-body-sm text-text-muted mb-3">
                  No leads match your search or filters.
                </p>
              )}
              {/* Keyed on the URL so a new search, filter or sort rebuilds the
                  board. Without this the board keeps showing the first data it
                  was given and ignores every filter change. */}
              <LeadKanbanBoard
                key={searchParams.toString()}
                stages={kanbanData.stages}
                initialLeadsByStage={kanbanData.leadsByStage}
                stageTotals={kanbanData.stageTotals}
                openTruncated={kanbanData.openTruncated}
                lostReasons={lostReasons}
              />
            </>
          ) : (
            <ViewLoading />
          )
        ) : tableData ? (
          <LeadTable
            rows={tableData.rows}
            totalCount={tableData.totalCount}
            page={page}
            pageSize={pageSize}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onPageChange={(p) => updateParam("page", String(p))}
            onPageSizeChange={(size) => updateParam("pageSize", String(size))}
            isArchivedView={searchParams.get("archived") === "true"}
            hasActiveFilters={hasActiveFilters}
            filterLookups={filterLookups}
          />
        ) : (
          <ViewLoading />
        )}
      </div>
    </div>
  );
}
