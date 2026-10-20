"use client";

import { toast } from "sonner";
import { Archive, Ban, FileDown, UserCog } from "lucide-react";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";

import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { EmptyState } from "@/src/components/shared/empty-state";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";
import { useTestDriveActions } from "@/src/components/test-drives/actions/use-test-drive-actions";
import {
  getTestDriveColumns,
  DEFAULT_TEST_DRIVE_COLUMN_ORDER,
  DEFAULT_TEST_DRIVE_COLUMN_VISIBILITY,
  CUSTOMIZABLE_TEST_DRIVE_COLUMNS,
  type TestDriveListRow,
} from "@/src/components/test-drives/test-drive-columns";

interface TestDriveTableProps {
  rows: TestDriveListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Whether the current user may approve and reject requests. */
  permissions: TestDrivePermissions;
}

export function TestDriveTable({
  rows,
  totalCount,
  page,
  pageSize,
  rowSelection,
  onRowSelectionChange,
  onPageChange,
  onPageSizeChange,
  permissions,
}: TestDriveTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-test-drives-table", {
      columnVisibility: DEFAULT_TEST_DRIVE_COLUMN_VISIBILITY,
      columnOrder: DEFAULT_TEST_DRIVE_COLUMN_ORDER,
      sorting: [],
    });

  const actionHost = useTestDriveActions();

  const columns = getTestDriveColumns({
    permissions,
    onAction: (action, row) => actionHost.request(action, row),
    onViewAssignmentHistory: (row) => actionHost.viewAssignmentHistory(row),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="Inbox"
        title="No test drives yet"
        description="Test drive requests and appointments will appear here once they're created."
        action={{ label: "Add Test Drive", href: "/admin/test-drives/new" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="flex justify-end">
        <TableCustomizer
          columns={CUSTOMIZABLE_TEST_DRIVE_COLUMNS}
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
        columnVisibility={isHydrated ? columnVisibility : DEFAULT_TEST_DRIVE_COLUMN_VISIBILITY}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={isHydrated ? columnOrder : DEFAULT_TEST_DRIVE_COLUMN_ORDER}
        onColumnOrderChange={setColumnOrder}
        enableColumnResizing
        ariaLabel="Test drives table"
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel={{ singular: "test drive", plural: "test drives" }}
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => onRowSelectionChange({})}
        actions={[
          {
            label: "Assign Staff",
            icon: UserCog,
            onClick: () => toast.info("Bulk staff assignment arrives in Sprint 5 Phase 17"),
          },
          {
            label: "Cancel",
            icon: Ban,
            variant: "destructive",
            onClick: () => toast.info("Bulk cancellation arrives in Sprint 5 Phase 17"),
          },
          {
            label: "Export",
            icon: FileDown,
            onClick: () => toast.info("Export arrives in Sprint 5 Phase 18"),
          },
          {
            label: "Archive",
            icon: Archive,
            onClick: () => toast.info("Archive arrives in Sprint 5 Phase 17"),
          },
        ]}
      />

      {actionHost.dialogs}
    </div>
  );
}
