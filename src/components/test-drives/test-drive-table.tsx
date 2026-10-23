"use client";

import { Archive, ArchiveRestore, Ban, FileSpreadsheet, FileText, SearchX, UserCog } from "lucide-react";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import { TestDriveCardList } from "@/src/components/test-drives/test-drive-card-list";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { EmptyState } from "@/src/components/shared/empty-state";
import { Button } from "@/src/components/ui/button";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";
import { useTestDriveActions } from "@/src/components/test-drives/actions/use-test-drive-actions";
import { useTestDriveBulkActions } from "@/src/components/test-drives/bulk/use-test-drive-bulk-actions";
import { useTestDriveExport } from "@/src/components/test-drives/use-test-drive-export";
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
  /** What the current user may do. Decides which bulk actions are offered. */
  permissions: TestDrivePermissions;
  /** A search or at least one filter is applied. */
  hasActiveQuery: boolean;
  /** Clears the search and every filter. */
  onClearQuery: () => void;
  /** Hosts for the bulk Assign dialog. */
  staff: { id: string; name: string }[];
  /** Showing archived test drives instead of active ones. */
  archivedView: boolean;
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
  hasActiveQuery,
  onClearQuery,
  staff,
  archivedView,
}: TestDriveTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-test-drives-table", {
      columnVisibility: DEFAULT_TEST_DRIVE_COLUMN_VISIBILITY,
      columnOrder: DEFAULT_TEST_DRIVE_COLUMN_ORDER,
      sorting: [],
    });

  const actionHost = useTestDriveActions();
  const exporter = useTestDriveExport();

  // Only rows on this page count. Ticks from another page can't linger.
  const selectedRows = rows.filter((row) => rowSelection[row.id]);

  const bulk = useTestDriveBulkActions({
    selectedRows,
    staff,
    onFinished: () => onRowSelectionChange({}),
  });

  const columns = getTestDriveColumns({
    permissions,
    onAction: (action, row) => actionHost.request(action, row),
    onViewAssignmentHistory: (row) => actionHost.viewAssignmentHistory(row),
  });

  if (rows.length === 0 && (hasActiveQuery || archivedView)) {
    const title = hasActiveQuery
      ? archivedView
        ? "No archived test drives match your search"
        : "No test drives match your search"
      : "No archived test drives";
    const description = hasActiveQuery
      ? "Try different words, or remove some of the filters."
      : "Finished test drives you archive will appear here, and can be restored from this view.";

    return (
      <div role="status" className="surface-card flex flex-col items-center gap-4 px-6 py-12 text-center">
        {hasActiveQuery ? (
          <SearchX className="text-text-subtle size-8" aria-hidden="true" />
        ) : (
          <Archive className="text-text-subtle size-8" aria-hidden="true" />
        )}
        <div>
          <p className="text-body text-text-primary font-medium">{title}</p>
          <p className="text-body-sm text-text-muted mt-1">{description}</p>
        </div>
        {hasActiveQuery && (
          <Button variant="outline" size="sm" onClick={onClearQuery}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

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

  // The bar only offers what this person may do. The server and database check again.
  const bulkActions = [
    ...(!archivedView && permissions.assign
      ? [{ label: "Assign Staff", icon: UserCog, onClick: () => bulk.request("assign") }]
      : []),
    ...(!archivedView && permissions.cancel
      ? [
          {
            label: "Cancel drives",
            icon: Ban,
            variant: "destructive" as const,
            onClick: () => bulk.request("cancel"),
          },
        ]
      : []),
    ...(permissions.export
      ? [
          {
            label: "Export Excel",
            icon: FileSpreadsheet,
            disabled: exporter.isExporting,
            onClick: () =>
              void exporter.run(
                "excel",
                "selected",
                selectedRows.map((row) => row.id),
              ),
          },
          {
            label: "Export PDF",
            icon: FileText,
            disabled: exporter.isExporting,
            onClick: () =>
              void exporter.run(
                "pdf",
                "selected",
                selectedRows.map((row) => row.id),
              ),
          },
        ]
      : []),
    ...(!archivedView && permissions.edit
      ? [{ label: "Archive", icon: Archive, onClick: () => bulk.request("archive") }]
      : []),
    ...(archivedView && permissions.edit
      ? [{ label: "Restore", icon: ArchiveRestore, onClick: () => bulk.request("restore") }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-3 pb-20">
      {archivedView && (
        <p role="status" className="text-body-sm text-text-muted">
          You are viewing archived test drives. Tick rows to restore them.
        </p>
      )}

      <div className="hidden justify-end md:flex">
        <TableCustomizer
          columns={CUSTOMIZABLE_TEST_DRIVE_COLUMNS}
          visibility={columnVisibility}
          onVisibilityChange={(id, visible) => setColumnVisibility({ ...columnVisibility, [id]: visible })}
          onReset={reset}
        />
      </div>

      <div className="hidden md:block">
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
          ariaLabel={archivedView ? "Archived test drives table" : "Test drives table"}
        />
      </div>

      <div className="md:hidden">
        <TestDriveCardList
          rows={rows}
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
          permissions={permissions}
          onAction={(action, row) => actionHost.request(action, row)}
          onViewAssignmentHistory={(row) => actionHost.viewAssignmentHistory(row)}
        />
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={(next) => {
          onRowSelectionChange({});
          onPageChange(next);
        }}
        onPageSizeChange={(size) => {
          onRowSelectionChange({});
          onPageSizeChange(size);
        }}
        itemLabel={{ singular: "test drive", plural: "test drives" }}
      />

      <BulkActionBar
        selectedCount={selectedRows.length}
        onClearSelection={() => onRowSelectionChange({})}
        actions={bulkActions}
      />

      {actionHost.dialogs}
      {bulk.dialogs}
    </div>
  );
}
