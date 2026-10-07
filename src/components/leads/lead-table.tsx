"use client";

import { toast } from "sonner";
import { Trash2, Archive, Tag } from "lucide-react";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";
import {
  getLeadColumns,
  DEFAULT_LEAD_COLUMN_ORDER,
  DEFAULT_LEAD_COLUMN_VISIBILITY,
  CUSTOMIZABLE_LEAD_COLUMNS,
  type LeadRow,
} from "@/src/components/leads/lead-columns";

interface LeadTableProps {
  rows: LeadRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function LeadTable({
  rows,
  totalCount,
  page,
  pageSize,
  rowSelection,
  onRowSelectionChange,
  onPageChange,
  onPageSizeChange,
}: LeadTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-leads-table", {
      columnVisibility: DEFAULT_LEAD_COLUMN_VISIBILITY,
      columnOrder: DEFAULT_LEAD_COLUMN_ORDER,
      sorting: [],
    });

  const columns = getLeadColumns({
    onArchive: () => toast.info("Archive arrives in Sprint 4 Phase 18"),
    onDelete: () => toast.info("Delete arrives in Sprint 4 Phase 18"),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  if (rows.length === 0) {
    return (
      <div className="surface-card flex min-h-[240px] flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-body-lg text-text-primary">No leads yet</p>
        <p className="text-body-sm text-text-muted">Leads you create will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="flex justify-end">
        <TableCustomizer
          columns={CUSTOMIZABLE_LEAD_COLUMNS}
          visibility={columnVisibility}
          onVisibilityChange={(id, visible) => setColumnVisibility({ ...columnVisibility, [id]: visible })}
          onReset={reset}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        columnVisibility={isHydrated ? columnVisibility : DEFAULT_LEAD_COLUMN_VISIBILITY}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={isHydrated ? columnOrder : DEFAULT_LEAD_COLUMN_ORDER}
        onColumnOrderChange={setColumnOrder}
        enableColumnResizing
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => onRowSelectionChange({})}
        actions={[
          {
            label: "Add Tag",
            icon: Tag,
            onClick: () => toast.info("Bulk tagging arrives in Sprint 4 Phase 18"),
          },
          {
            label: "Archive",
            icon: Archive,
            onClick: () => toast.info("Archive arrives in Sprint 4 Phase 18"),
          },
          {
            label: "Delete",
            icon: Trash2,
            variant: "destructive",
            onClick: () => toast.info("Delete arrives in Sprint 4 Phase 18"),
          },
        ]}
      />
    </div>
  );
}
