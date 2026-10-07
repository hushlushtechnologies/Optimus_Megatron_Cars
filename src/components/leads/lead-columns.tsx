"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Eye, Archive, ArchiveRestore, Trash2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { LeadTemperatureBadge } from "@/src/components/leads/lead-temperature-badge";
import { createSelectionColumn } from "@/src/components/shared/data-table/data-table";

import type { LeadRow } from "@/src/lib/supabase/lead-queries";

export type { LeadRow };

const columnHelper = createColumnHelper<LeadRow>();

export interface LeadColumnActions {
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function getLeadColumns({
  onArchive,
  onRestore,
  onDelete,
}: LeadColumnActions): ColumnDef<LeadRow, unknown>[] {
  const columns = [
    createSelectionColumn<LeadRow>(),

    columnHelper.accessor("lead_number", {
      id: "lead_number",
      header: "Lead ID",
      enableSorting: false,

      cell: ({ row }) => (
        <Link
          href={`/admin/leads/${row.original.id}`}
          className="text-text-primary hover:text-primary-text font-medium"
        >
          {row.original.lead_number}
        </Link>
      ),
    }),

    columnHelper.accessor("customer_name", {
      id: "customer",
      header: "Customer",
      enableSorting: false,
      size: 200,

      cell: ({ row }) => (
        <div>
          <p className="text-text-primary truncate font-medium">{row.original.customer_name}</p>

          <p className="text-caption text-text-subtle truncate">{row.original.customer_number}</p>
        </div>
      ),
    }),

    columnHelper.accessor("vehicle_title", {
      id: "vehicle",
      header: "Vehicle",
      enableSorting: false,

      cell: (ctx) => ctx.getValue() ?? "—",
    }),

    columnHelper.accessor("brand_name", {
      id: "brand",
      header: "Brand",
      enableSorting: false,

      cell: (ctx) => ctx.getValue() ?? "—",
    }),

    columnHelper.accessor("source_name", {
      id: "source",
      header: "Source",
      enableSorting: false,

      cell: (ctx) => ctx.getValue() ?? "—",
    }),

    columnHelper.display({
      id: "stage",
      header: "Stage",
      enableSorting: false,

      cell: ({ row }) => {
        const stage = row.original.stage;

        return (
          <span
            className="text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{
              backgroundColor: `${stage.color_hex}1A`,
              borderColor: `${stage.color_hex}66`,
              color: stage.color_hex,
            }}
          >
            {stage.name}
          </span>
        );
      },
    }),

    columnHelper.accessor("temperature", {
      id: "temperature",
      header: "Temperature",
      enableSorting: false,

      cell: (ctx) => <LeadTemperatureBadge temperature={ctx.getValue()} />,
    }),

    columnHelper.accessor("assigned_staff_name", {
      id: "assigned_staff",
      header: "Assigned Staff",
      enableSorting: false,

      cell: (ctx) => ctx.getValue() ?? "Unassigned",
    }),

    columnHelper.accessor("next_follow_up_at", {
      id: "next_follow_up",
      header: "Next Follow-Up",
      enableSorting: false,

      cell: (ctx) => {
        const value = ctx.getValue();

        return value ? new Date(value).toLocaleString() : "—";
      },
    }),

    columnHelper.accessor("last_activity_at", {
      id: "last_activity",
      header: "Last Activity",
      enableSorting: false,

      cell: (ctx) => {
        const value = ctx.getValue();

        return value
          ? formatDistanceToNow(new Date(value), {
              addSuffix: true,
            })
          : "—";
      },
    }),

    columnHelper.accessor("created_at", {
      id: "created_at",
      header: "Created Date",
      enableSorting: false,

      cell: (ctx) =>
        formatDistanceToNow(new Date(ctx.getValue()), {
          addSuffix: true,
        }),
    }),

    columnHelper.display({
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      enableResizing: false,

      cell: ({ row }) => {
        const lead = row.original;

        const isArchived = Boolean(lead.archived_at);

        return (
          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label="Row actions" variant="ghost" size="sm">
                <MoreVertical className="size-4" />
              </IconButton>
            </DropdownTrigger>

            <DropdownContent align="end" className="w-44 py-1">
              <Link
                href={`/admin/leads/${lead.id}`}
                role="menuitem"
                className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
              >
                <Eye className="text-text-muted size-4" aria-hidden="true" />
                View
              </Link>

              {isArchived ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onRestore(lead.id)}
                  className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                >
                  <ArchiveRestore className="text-text-muted size-4" aria-hidden="true" />
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onArchive(lead.id)}
                  className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                >
                  <Archive className="text-text-muted size-4" aria-hidden="true" />
                  Archive
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => onDelete(lead.id)}
                className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left text-red-400"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </button>
            </DropdownContent>
          </Dropdown>
        );
      },
    }),
  ];

  return columns as ColumnDef<LeadRow, unknown>[];
}

export const DEFAULT_LEAD_COLUMN_ORDER = [
  "select",
  "lead_number",
  "customer",
  "vehicle",
  "brand",
  "source",
  "stage",
  "temperature",
  "assigned_staff",
  "next_follow_up",
  "last_activity",
  "created_at",
  "actions",
];

export const DEFAULT_LEAD_COLUMN_VISIBILITY: Record<string, boolean> = {
  select: true,
  lead_number: true,
  customer: true,
  vehicle: true,
  brand: false,
  source: false,
  stage: true,
  temperature: true,
  assigned_staff: true,
  next_follow_up: false,
  last_activity: false,
  created_at: true,
  actions: true,
};

export const CUSTOMIZABLE_LEAD_COLUMNS = [
  {
    id: "vehicle",
    label: "Vehicle",
  },
  {
    id: "brand",
    label: "Brand",
  },
  {
    id: "source",
    label: "Source",
  },
  {
    id: "stage",
    label: "Stage",
  },
  {
    id: "temperature",
    label: "Temperature",
  },
  {
    id: "assigned_staff",
    label: "Assigned Staff",
  },
  {
    id: "next_follow_up",
    label: "Next Follow-Up",
  },
  {
    id: "last_activity",
    label: "Last Activity",
  },
  {
    id: "created_at",
    label: "Created Date",
  },
];
