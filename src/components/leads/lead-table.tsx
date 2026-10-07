"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Archive,
  ArchiveRestore,
  Tag,
  UserCog,
  Thermometer,
  CalendarPlus,
  FileDown,
} from "lucide-react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { triggerDownloadFromUrl } from "@/src/lib/utils/trigger-download";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { SelectActionDialog } from "@/src/components/shared/select-action-dialog";
import { NoSearchResults } from "@/src/components/shared/no-search-results";
import { BulkFollowUpDialog } from "@/src/components/leads/bulk-follow-up-dialog";

import { useTablePreferences } from "@/src/hooks/use-table-preferences";

import {
  getLeadColumns,
  DEFAULT_LEAD_COLUMN_ORDER,
  DEFAULT_LEAD_COLUMN_VISIBILITY,
  CUSTOMIZABLE_LEAD_COLUMNS,
  type LeadRow,
} from "@/src/components/leads/lead-columns";

import {
  bulkAssignStaff,
  bulkChangeStage,
  bulkAddTag,
  bulkRemoveTag,
  bulkChangeTemperature,
  bulkArchiveLeads,
  bulkRestoreLeads,
  deleteLeads,
} from "@/app/admin/leads/actions";

import type { LeadFilterLookups } from "@/src/lib/supabase/lead-lookups";
import type { LeadTemperature } from "@/src/lib/types/lead";

interface LeadTableProps {
  rows: LeadRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  rowSelection: Record<string, boolean>;

  onRowSelectionChange: (selection: Record<string, boolean>) => void;

  onPageChange: (page: number) => void;

  onPageSizeChange: (size: number) => void;

  isArchivedView: boolean;

  filterLookups: LeadFilterLookups;
}

const TEMPERATURE_OPTIONS: {
  value: LeadTemperature;
  label: string;
}[] = [
  {
    value: "Hot",
    label: "Hot",
  },
  {
    value: "Warm",
    label: "Warm",
  },
  {
    value: "Cold",
    label: "Cold",
  },
];

interface ActionResult {
  error: string | null;
  summary?: string;
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
  isArchivedView,
  filterLookups,
}: LeadTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-leads-table", {
      columnVisibility: DEFAULT_LEAD_COLUMN_VISIBILITY,

      columnOrder: DEFAULT_LEAD_COLUMN_ORDER,

      sorting: [],
    });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [assignStaffOpen, setAssignStaffOpen] = useState(false);

  const [changeStageOpen, setChangeStageOpen] = useState(false);

  const [addTagOpen, setAddTagOpen] = useState(false);

  const [removeTagOpen, setRemoveTagOpen] = useState(false);

  const [temperatureOpen, setTemperatureOpen] = useState(false);

  const [followUpOpen, setFollowUpOpen] = useState(false);

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const clearSelection = () => {
    onRowSelectionChange({});
  };

  const runAction = async (action: () => Promise<ActionResult>, successMessage: string) => {
    const result = await action();

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result.summary ?? successMessage);

    clearSelection();
  };

  const columns = getLeadColumns({
    onArchive: (id) => runAction(() => bulkArchiveLeads([id]), "Lead archived"),

    onRestore: (id) => runAction(() => bulkRestoreLeads([id]), "Lead restored"),

    onDelete: (id) => runAction(() => deleteLeads([id]), "Lead deleted"),
  });

  if (rows.length === 0) {
    return <NoSearchResults query="" />;
  }

  const handleExportSelected = (format: "pdf" | "excel") => {
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("scope", "selected");
    params.set("ids", selectedIds.join(","));

    toast.promise(
      triggerDownloadFromUrl(`/admin/leads/export?${params.toString()}`).then((result) => {
        if (result.error) throw new Error(result.error);
      }),
      {
        loading: `Preparing ${format.toUpperCase()} export...`,
        success: `Exported ${selectedIds.length} lead${selectedIds.length === 1 ? "" : "s"}`,
        error: (err) => (err instanceof Error ? err.message : "Export failed. Please try again."),
      },
    );
  };

  const bulkActions = isArchivedView
    ? [
        {
          label: "Restore",
          icon: ArchiveRestore,

          onClick: () => runAction(() => bulkRestoreLeads(selectedIds), "Leads restored"),
        },

        {
          label: "Delete",
          icon: Trash2,

          variant: "destructive" as const,

          onClick: () => setConfirmDeleteOpen(true),
        },
      ]
    : [
        {
          label: "Assign Staff",
          icon: UserCog,

          onClick: () => setAssignStaffOpen(true),
        },

        {
          label: "Change Stage",
          icon: Archive,

          onClick: () => setChangeStageOpen(true),
        },

        {
          label: "Add Tag",
          icon: Tag,

          onClick: () => setAddTagOpen(true),
        },

        {
          label: "Remove Tag",
          icon: Tag,

          onClick: () => setRemoveTagOpen(true),
        },

        {
          label: "Change Temperature",

          icon: Thermometer,

          onClick: () => setTemperatureOpen(true),
        },

        {
          label: "Schedule Follow-Up",

          icon: CalendarPlus,

          onClick: () => setFollowUpOpen(true),
        },

        { label: "Export PDF", icon: FileText, onClick: () => handleExportSelected("pdf") },
        { label: "Export Excel", icon: FileSpreadsheet, onClick: () => handleExportSelected("excel") },

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
      ];

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="flex justify-end">
        <TableCustomizer
          columns={CUSTOMIZABLE_LEAD_COLUMNS}
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
        onClearSelection={clearSelection}
        actions={bulkActions}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);

          await runAction(() => deleteLeads(selectedIds), "Lead(s) deleted");

          setIsDeleting(false);

          setConfirmDeleteOpen(false);
        }}
        title={`Delete ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={confirmArchiveOpen}
        onClose={() => setConfirmArchiveOpen(false)}
        onConfirm={async () => {
          await runAction(() => bulkArchiveLeads(selectedIds), "Leads archived");

          setConfirmArchiveOpen(false);
        }}
        title={`Archive ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}?`}
        description="Archived leads are hidden from the default view but can be restored anytime."
        confirmLabel="Archive"
      />

      <SelectActionDialog
        isOpen={assignStaffOpen}
        onClose={() => setAssignStaffOpen(false)}
        title={`Assign Staff to ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Staff Member"
        options={filterLookups.staff.map((staff) => ({
          value: staff.id,

          label: staff.full_name,
        }))}
        confirmLabel="Assign"
        onConfirm={(staffId) => runAction(() => bulkAssignStaff(selectedIds, staffId), "Staff assigned")}
      />

      <SelectActionDialog
        isOpen={changeStageOpen}
        onClose={() => setChangeStageOpen(false)}
        title={`Change Stage for ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="New Stage"
        options={filterLookups.stages.map((stage) => ({
          value: stage.id,

          label: stage.name,
        }))}
        confirmLabel="Move"
        onConfirm={(stageId) => runAction(() => bulkChangeStage(selectedIds, stageId), "Stage updated")}
      />

      <SelectActionDialog
        isOpen={addTagOpen}
        onClose={() => setAddTagOpen(false)}
        title={`Add Tag to ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Tag"
        options={filterLookups.tags.map((tag) => ({
          value: tag.id,

          label: tag.name,
        }))}
        confirmLabel="Add Tag"
        onConfirm={(tagId) => runAction(() => bulkAddTag(selectedIds, tagId), "Tag added")}
      />

      <SelectActionDialog
        isOpen={removeTagOpen}
        onClose={() => setRemoveTagOpen(false)}
        title={`Remove Tag from ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Tag"
        options={filterLookups.tags.map((tag) => ({
          value: tag.id,

          label: tag.name,
        }))}
        confirmLabel="Remove Tag"
        onConfirm={(tagId) => runAction(() => bulkRemoveTag(selectedIds, tagId), "Tag removed")}
      />

      <SelectActionDialog
        isOpen={temperatureOpen}
        onClose={() => setTemperatureOpen(false)}
        title={`Change Temperature for ${selectedIds.length} Lead${selectedIds.length === 1 ? "" : "s"}`}
        selectLabel="Temperature"
        options={TEMPERATURE_OPTIONS}
        confirmLabel="Update"
        onConfirm={(temperature) =>
          runAction(
            () => bulkChangeTemperature(selectedIds, temperature as LeadTemperature),
            "Temperature updated",
          )
        }
      />

      <BulkFollowUpDialog
        isOpen={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        leadIds={selectedIds}
        onDone={(summary) => {
          toast.success(summary);

          clearSelection();
        }}
      />
    </div>
  );
}
