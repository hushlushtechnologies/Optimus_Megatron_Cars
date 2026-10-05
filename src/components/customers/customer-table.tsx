"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Archive,
  ArchiveRestore,
  Tag,
  UserCog,
  ShieldOff,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { SelectActionDialog } from "@/src/components/shared/select-action-dialog";
import { NoSearchResults } from "@/src/components/shared/no-search-results";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";
import { triggerDownloadFromUrl } from "@/src/lib/utils/trigger-download";
import {
  getCustomerColumns,
  DEFAULT_CUSTOMER_COLUMN_ORDER,
  DEFAULT_CUSTOMER_COLUMN_VISIBILITY,
  CUSTOMIZABLE_CUSTOMER_COLUMNS,
  type CustomerRow,
} from "@/src/components/customers/customer-columns";
import {
  bulkAddTag,
  bulkChangeStatus,
  bulkAssignPrm,
  bulkDisableAccount,
  bulkArchiveCustomers,
  bulkRestoreCustomers,
  deleteCustomers,
} from "@/app/admin/customers/actions";

const LIFECYCLE_OPTIONS = ["Prospect", "Active", "VIP", "Inactive", "Do Not Contact"].map((v) => ({
  value: v,
  label: v,
}));

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
  isArchivedView: boolean;
  tagOptions: { id: string; name: string }[];
  staffOptions: { id: string; full_name: string }[];
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
  isArchivedView,
  tagOptions,
  staffOptions,
}: CustomerTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-customers-table", {
      columnVisibility: DEFAULT_CUSTOMER_COLUMN_VISIBILITY,
      columnOrder: DEFAULT_CUSTOMER_COLUMN_ORDER,
      sorting: [],
    });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [prmDialogOpen, setPrmDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const clearSelection = () => onRowSelectionChange({});

  const columns = getCustomerColumns({
    onArchive: (id) => runAction(() => bulkArchiveCustomers([id]), "Customer archived successfully"),
    onRestore: (id) => runAction(() => bulkRestoreCustomers([id]), "Customer restored successfully"),
    onDelete: (id) => runAction(() => deleteCustomers([id]), "Customer deleted successfully"),
  });

  const runAction = async (
    action: () => Promise<{ error: string | null; summary?: string }>,
    successMessage: string,
  ) => {
    const result = await action();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.summary ?? successMessage);
    clearSelection();
  };

  if (rows.length === 0) {
    return <NoSearchResults query={searchQuery} />;
  }

  const handleExportSelected = (format: "pdf" | "excel") => {
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("scope", "selected");
    params.set("ids", selectedIds.join(","));

    toast.promise(
      triggerDownloadFromUrl(`/admin/customers/export?${params.toString()}`).then((result) => {
        if (result.error) throw new Error(result.error);
      }),
      {
        loading: `Preparing ${format.toUpperCase()} export...`,
        success: `Exported ${selectedIds.length} customer${selectedIds.length === 1 ? "" : "s"}`,
        error: (err) => (err instanceof Error ? err.message : "Export failed. Please try again."),
      },
    );
  };

  const bulkActions = isArchivedView
    ? [
        {
          label: "Restore",
          icon: ArchiveRestore,
          onClick: () =>
            runAction(() => bulkRestoreCustomers(selectedIds), "Customers restored successfully"),
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "destructive" as const,
          onClick: () => setConfirmDeleteOpen(true),
        },
      ]
    : [
        { label: "Add Tag", icon: Tag, onClick: () => setTagDialogOpen(true) },
        { label: "Change Status", icon: Tag, onClick: () => setStatusDialogOpen(true) },
        { label: "Assign PRM", icon: UserCog, onClick: () => setPrmDialogOpen(true) },
        { label: "Disable Account", icon: ShieldOff, onClick: () => setConfirmDisableOpen(true) },
        { label: "Archive", icon: Archive, onClick: () => setConfirmArchiveOpen(true) },
        {
          label: "Delete",
          icon: Trash2,
          variant: "destructive" as const,
          onClick: () => setConfirmDeleteOpen(true),
        },
        { label: "Export PDF", icon: FileText, onClick: () => handleExportSelected("pdf") },
        { label: "Export Excel", icon: FileSpreadsheet, onClick: () => handleExportSelected("excel") },
      ];

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
        onClearSelection={clearSelection}
        actions={bulkActions}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          await runAction(() => deleteCustomers(selectedIds), "Customer(s) deleted successfully");
          setIsDeleting(false);
          setConfirmDeleteOpen(false);
        }}
        title={`Delete ${selectedIds.length} Customer${selectedIds.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={confirmArchiveOpen}
        onClose={() => setConfirmArchiveOpen(false)}
        onConfirm={async () => {
          await runAction(() => bulkArchiveCustomers(selectedIds), "Customers archived successfully");
          setConfirmArchiveOpen(false);
        }}
        title={`Archive ${selectedIds.length} Customer${selectedIds.length === 1 ? "" : "s"}?`}
        description="Archived customers are hidden from the list but can be restored anytime."
        confirmLabel="Archive"
      />

      <ConfirmDialog
        isOpen={confirmDisableOpen}
        onClose={() => setConfirmDisableOpen(false)}
        onConfirm={async () => {
          await runAction(() => bulkDisableAccount(selectedIds), "Accounts disabled");
          setConfirmDisableOpen(false);
        }}
        title={`Disable ${selectedIds.length} Account${selectedIds.length === 1 ? "" : "s"}?`}
        description="Customers with a login will be immediately signed out. Customers without an account are unaffected."
        confirmLabel="Disable"
        variant="danger"
      />

      <SelectActionDialog
        isOpen={tagDialogOpen}
        onClose={() => setTagDialogOpen(false)}
        title={`Add Tag to ${selectedIds.length} Customer${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Tag"
        options={tagOptions.map((t) => ({ value: t.id, label: t.name }))}
        confirmLabel="Add Tag"
        onConfirm={(tagId) => runAction(() => bulkAddTag(selectedIds, tagId), "Tag added")}
      />

      <SelectActionDialog
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        title={`Change Status for ${selectedIds.length} Customer${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="New Status"
        options={LIFECYCLE_OPTIONS}
        confirmLabel="Update Status"
        onConfirm={(status) => runAction(() => bulkChangeStatus(selectedIds, status), "Status updated")}
      />

      <SelectActionDialog
        isOpen={prmDialogOpen}
        onClose={() => setPrmDialogOpen(false)}
        title={`Assign Relationship Manager to ${selectedIds.length} Customer${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Primary Relationship Manager"
        options={staffOptions.map((s) => ({ value: s.id, label: s.full_name }))}
        confirmLabel="Assign"
        onConfirm={(staffId) =>
          runAction(() => bulkAssignPrm(selectedIds, staffId), "Relationship Manager assigned")
        }
      />
    </div>
  );
}
