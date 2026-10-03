"use client";

import { DataTable } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";

import {
  getInventoryColumns,
  DEFAULT_COLUMN_ORDER,
  DEFAULT_COLUMN_VISIBILITY,
  CUSTOMIZABLE_COLUMNS,
  type InventoryCarRow,
} from "@/src/components/inventory/inventory-columns";

interface InventoryTableProps {
  rows: InventoryCarRow[];
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

export function InventoryTable({
  rows,
  rowSelection,
  onRowSelectionChange,
  onDuplicate,
  onArchive,
  onRestore,
  onRequestDelete,
}: InventoryTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-inventory-table", {
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,

      columnOrder: DEFAULT_COLUMN_ORDER,

      sorting: [],
    });

  const columns = getInventoryColumns({
    onDuplicate,
    onArchive,
    onRestore,
    onDelete: onRequestDelete,
  });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* ============================================
          TABLE OPTIONS
      ============================================ */}

      <div className="flex items-center justify-end">
        <TableCustomizer
          columns={CUSTOMIZABLE_COLUMNS}
          visibility={columnVisibility}
          onVisibilityChange={(id, visible) =>
            setColumnVisibility({
              ...columnVisibility,
              [id]: visible,
            })
          }
          onReset={reset}
        />
      </div>

      {/* ============================================
          INVENTORY TABLE
      ============================================ */}

      <div className="min-w-0">
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
          columnVisibility={isHydrated ? columnVisibility : DEFAULT_COLUMN_VISIBILITY}
          onColumnVisibilityChange={setColumnVisibility}
          columnOrder={isHydrated ? columnOrder : DEFAULT_COLUMN_ORDER}
          onColumnOrderChange={setColumnOrder}
          enableColumnResizing
        />
      </div>
    </div>
  );
}
