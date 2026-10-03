"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Archive, ArchiveRestore, Tag } from "lucide-react";
import { useInventoryView } from "@/src/hooks/use-inventory-view";
import { InventoryTable } from "@/src/components/inventory/inventory-table";
import { InventoryGrid } from "@/src/components/inventory/inventory-grid";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { SelectActionDialog } from "@/src/components/shared/select-action-dialog";
import { NoSearchResults } from "@/src/components/shared/no-search-results";
import { FileText, FileSpreadsheet } from "lucide-react";
import { triggerDownloadFromUrl } from "@/src/lib/utils/trigger-download";
import {
  deleteCars,
  archiveCars,
  restoreCars,
  updateCarsAvailabilityStatus,
  assignCarsCollection,
} from "@/app/admin/inventory/actions";
import type { InventoryCarRow } from "@/src/lib/supabase/inventory-queries";

interface InventoryViewSwitcherProps {
  rows: InventoryCarRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  isArchivedView: boolean;
  availabilityStatuses: { id: string; name: string }[];
  collections: { id: string; name: string }[];
}

export function InventoryViewSwitcher({
  rows,
  totalCount,
  page,
  pageSize,
  isArchivedView,
  availabilityStatuses,
  collections,
}: InventoryViewSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { view } = useInventoryView();

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const requestDelete = (id: string) => {
    setRowSelection({ [id]: true });
    setConfirmDeleteOpen(true);
  };

  const requestArchive = async (id: string) => {
    const result = await archiveCars([id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Vehicle archived successfully");
      router.refresh();
    }
  };

  const requestRestore = async (id: string) => {
    const result = await restoreCars([id]);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Vehicle restored successfully");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCars(selectedIds);
    setIsDeleting(false);
    setConfirmDeleteOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      selectedIds.length === 1
        ? "Vehicle deleted successfully"
        : `${selectedIds.length} vehicles deleted successfully`,
    );
    setRowSelection({});
    router.refresh();
  };

  const handleBulkArchive = async () => {
    const result = await archiveCars(selectedIds);
    setConfirmArchiveOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `${selectedIds.length} vehicle${selectedIds.length === 1 ? "" : "s"} archived successfully`,
    );
    setRowSelection({});
    router.refresh();
  };

  const handleBulkRestore = async () => {
    const result = await restoreCars(selectedIds);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `${selectedIds.length} vehicle${selectedIds.length === 1 ? "" : "s"} restored successfully`,
    );
    setRowSelection({});
    router.refresh();
  };

  const handleStatusChange = async (statusId: string) => {
    const result = await updateCarsAvailabilityStatus(selectedIds, statusId);
    setStatusDialogOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Status updated for the selected vehicles");
    setRowSelection({});
    router.refresh();
  };

  const handleCollectionAssign = async (collectionId: string) => {
    const result = await assignCarsCollection(selectedIds, collectionId);
    setCollectionDialogOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Collection assigned to the selected vehicles");
    setRowSelection({});
    router.refresh();
  };

  const toggleSelect = (id: string) => {
    setRowSelection((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const sharedActionProps = {
    onDuplicate: () => toast.info("Duplicate arrives in a future phase"),
    onArchive: requestArchive,
    onRestore: requestRestore,
    onRequestDelete: requestDelete,
  };

  if (rows.length === 0) {
    return <NoSearchResults query={searchParams.get("q") ?? (isArchivedView ? "archived vehicles" : "")} />;
  }

  const handleExportSelected = (format: "pdf" | "excel") => {
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("scope", "selected");
    params.set("ids", selectedIds.join(","));

    toast.promise(
      triggerDownloadFromUrl(`/admin/inventory/export?${params.toString()}`).then((result) => {
        if (result.error) throw new Error(result.error);
      }),
      {
        loading: `Preparing ${format.toUpperCase()} export...`,
        success: `Exported ${selectedIds.length} vehicle${selectedIds.length === 1 ? "" : "s"}`,
        error: (err) => (err instanceof Error ? err.message : "Export failed. Please try again."),
      },
    );
  };

  const bulkActions = isArchivedView
    ? [
        { label: "Restore", icon: ArchiveRestore, onClick: handleBulkRestore },
        {
          label: "Delete",
          icon: Trash2,
          variant: "destructive" as const,
          onClick: () => setConfirmDeleteOpen(true),
        },
      ]
    : [
        {
          label: "Change Status",
          icon: Tag,
          onClick: () => setStatusDialogOpen(true),
        },
        {
          label: "Assign Collection",
          icon: Tag,
          onClick: () => setCollectionDialogOpen(true),
        },
        {
          label: "Archive",
          icon: Archive,
          onClick: () => setConfirmArchiveOpen(true),
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "destructive" as const,
          onClick: () => setConfirmDeleteOpen(true),
        },
        {
          label: "Export PDF",
          icon: FileText,
          onClick: () => handleExportSelected("pdf"),
        },
        {
          label: "Export Excel",
          icon: FileSpreadsheet,
          onClick: () => handleExportSelected("excel"),
        },
      ];

  return (
    <>
      {view === "grid" ? (
        <InventoryGrid
          rows={rows}
          rowSelection={rowSelection}
          onToggleSelect={toggleSelect}
          {...sharedActionProps}
        />
      ) : (
        <InventoryTable
          rows={rows}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          {...sharedActionProps}
        />
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", String(p));
          router.replace(`${pathname}?${params.toString()}`);
        }}
        onPageSizeChange={(size) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("pageSize", String(size));
          params.set("page", "1");
          router.replace(`${pathname}?${params.toString()}`);
        }}
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setRowSelection({})}
        actions={bulkActions}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${selectedIds.length} Vehicle${selectedIds.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={confirmArchiveOpen}
        onClose={() => setConfirmArchiveOpen(false)}
        onConfirm={handleBulkArchive}
        title={`Archive ${selectedIds.length} Vehicle${selectedIds.length === 1 ? "" : "s"}?`}
        description="Archived vehicles are hidden from Inventory but can be restored anytime."
        confirmLabel="Archive"
      />

      <SelectActionDialog
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        title={`Change Status for ${selectedIds.length} Vehicle${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="New Status"
        options={availabilityStatuses.map((s) => ({
          value: s.id,
          label: s.name,
        }))}
        confirmLabel="Update Status"
        onConfirm={handleStatusChange}
      />

      <SelectActionDialog
        isOpen={collectionDialogOpen}
        onClose={() => setCollectionDialogOpen(false)}
        title={`Assign Collection to ${selectedIds.length} Vehicle${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Collection"
        options={collections.map((c) => ({ value: c.id, label: c.name }))}
        confirmLabel="Assign"
        onConfirm={handleCollectionAssign}
      />
    </>
  );
}
