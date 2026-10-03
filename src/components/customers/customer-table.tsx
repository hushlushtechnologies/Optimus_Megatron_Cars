"use client";

import { toast } from "sonner";
import { Trash2, Archive, Tag } from "lucide-react";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { NoSearchResults } from "@/src/components/shared/no-search-results";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";
import {
  getCustomerColumns,
  DEFAULT_CUSTOMER_COLUMN_ORDER,
  DEFAULT_CUSTOMER_COLUMN_VISIBILITY,
  CUSTOMIZABLE_CUSTOMER_COLUMNS,
  type CustomerRow,
} from "@/src/components/customers/customer-columns";

interface CustomerTableProps {
  rows: CustomerRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchQuery: string;
}

export function CustomerTable({
  rows,
  totalCount,
  page,
  pageSize,
  rowSelection,
  onRowSelectionChange,
  onPageChange,
  onPageSizeChange,
  searchQuery,
}: CustomerTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-customers-table", {
      columnVisibility: DEFAULT_CUSTOMER_COLUMN_VISIBILITY,
      columnOrder: DEFAULT_CUSTOMER_COLUMN_ORDER,
      sorting: [],
    });

  const columns = getCustomerColumns({
    onArchive: () => toast.info("Archive arrives in Sprint 3 Phase 16"),
    onDelete: () => toast.info("Delete arrives in Sprint 3 Phase 16"),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  if (rows.length === 0) {
    return <NoSearchResults query={searchQuery} />;
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="flex justify-end">
        <TableCustomizer
          columns={CUSTOMIZABLE_CUSTOMER_COLUMNS}
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
        columnVisibility={isHydrated ? columnVisibility : DEFAULT_CUSTOMER_COLUMN_VISIBILITY}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={isHydrated ? columnOrder : DEFAULT_CUSTOMER_COLUMN_ORDER}
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
            onClick: () => toast.info("Bulk tagging arrives in Sprint 3 Phase 16"),
          },
          {
            label: "Archive",
            icon: Archive,
            onClick: () => toast.info("Archive arrives in Sprint 3 Phase 16"),
          },
          {
            label: "Delete",
            icon: Trash2,
            variant: "destructive",
            onClick: () => toast.info("Delete arrives in Sprint 3 Phase 16"),
          },
        ]}
      />
    </div>
  );
}
