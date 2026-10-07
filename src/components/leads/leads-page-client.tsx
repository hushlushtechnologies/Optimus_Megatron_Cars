"use client";

import { useState } from "react";

import Link from "next/link";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

import { LeadToolbar } from "@/src/components/leads/lead-toolbar";

import { LeadKanbanBoard } from "@/src/components/leads/lead-kanban-board";

import { LeadTable } from "@/src/components/leads/lead-table";

import { useLeadView } from "@/src/hooks/use-lead-view";

import type { LeadMetrics, LeadKanbanData, LeadRow } from "@/src/lib/supabase/lead-queries";

import type { LeadFilterLookups } from "@/src/lib/supabase/lead-lookups";

/* =========================================================
   TYPES
========================================================= */

interface LeadsPageClientProps {
  metrics: LeadMetrics;

  kanbanData: LeadKanbanData;

  tableRows: LeadRow[];

  tableTotalCount: number;

  page: number;

  pageSize: number;

  filterLookups: LeadFilterLookups;

  isArchivedView: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

export function LeadsPageClient({
  metrics,
  kanbanData,
  tableRows,
  tableTotalCount,
  page,
  pageSize,
  filterLookups,
  isArchivedView,
}: LeadsPageClientProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { view, setView, isHydrated } = useLeadView();

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  /* =========================================================
     UPDATE QUERY PARAM
  ========================================================= */

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  /* =========================================================
     RESULT COUNT
  ========================================================= */

  const resultCount =
    view === "kanban"
      ? Object.values(kanbanData.leadsByStage).reduce((sum, leads) => sum + leads.length, 0)
      : tableTotalCount;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

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

      {/* =====================================================
          METRICS
      ===================================================== */}

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

      {/* =====================================================
          TOOLBAR + VIEW TOGGLE
      ===================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <LeadToolbar resultCount={resultCount} filterLookups={filterLookups} />
        </div>

        <div className="border-border flex items-center rounded-md border p-0.5">
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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {!isHydrated ? null : view === "kanban" ? (
        <LeadKanbanBoard stages={kanbanData.stages} initialLeadsByStage={kanbanData.leadsByStage} />
      ) : (
        <LeadTable
          rows={tableRows}
          totalCount={tableTotalCount}
          page={page}
          pageSize={pageSize}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onPageChange={(nextPage) => updateParam("page", String(nextPage))}
          onPageSizeChange={(size) => updateParam("pageSize", String(size))}
          isArchivedView={isArchivedView}
          filterLookups={filterLookups}
        />
      )}
    </div>
  );
}
