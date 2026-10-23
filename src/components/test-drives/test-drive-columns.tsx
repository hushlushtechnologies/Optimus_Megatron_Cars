"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Eye, History, MoreVertical, CheckCircle2 } from "lucide-react";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { createSelectionColumn } from "@/src/components/shared/data-table/data-table";
import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import { TEST_DRIVE_ACTION_ICON } from "@/src/components/test-drives/test-drive-action-icons";
import {
  TEST_DRIVE_ACTION_META,
  getAvailableActions,
  type TestDriveActionKey,
} from "@/src/lib/utils/test-drive-actions";
import {
  formatDateTimeFull,
  formatDay,
  formatTimeRange,
  getDubaiToday,
  toDubaiIsoDate,
} from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

export type { TestDriveListRow };

const columnHelper = createColumnHelper<TestDriveListRow>();

interface TestDriveColumnActions {
  onAction: (action: TestDriveActionKey, row: TestDriveListRow) => void;
  onViewAssignmentHistory: (row: TestDriveListRow) => void;
  /** Whether the current user may approve and reject requests. */
  permissions: TestDrivePermissions;
}

export function getTestDriveColumns({
  onAction,
  onViewAssignmentHistory,
  permissions,
}: TestDriveColumnActions): ColumnDef<TestDriveListRow, unknown>[] {
  const columns = [
    createSelectionColumn<TestDriveListRow>((row) => row.test_drive_number),

    columnHelper.accessor("test_drive_number", {
      id: "test_drive_number",
      header: "Test Drive ID",
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <Link
          href={`/admin/test-drives/${row.original.id}`}
          className="text-text-primary hover:text-primary-text font-medium whitespace-nowrap"
        >
          {row.original.test_drive_number}
        </Link>
      ),
    }),

    columnHelper.display({
      id: "customer",
      header: "Customer",
      enableSorting: false,
      size: 230,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <CustomerAvatar
            fullName={row.original.customer_name}
            photoUrl={row.original.customer_photo_url}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              href={`/admin/customers/${row.original.customer_id}`}
              className="text-text-primary hover:text-primary-text block truncate font-medium"
            >
              {row.original.customer_name}
            </Link>
            <p className="text-caption text-text-subtle truncate">{row.original.customer_number}</p>
          </div>
        </div>
      ),
    }),

    columnHelper.display({
      id: "vehicle",
      header: "Vehicle",
      enableSorting: false,
      size: 240,
      cell: ({ row }) => (
        <div className="min-w-0">
          <Link
            href={`/admin/inventory/${row.original.car_id}`}
            className="text-text-primary hover:text-primary-text block truncate font-medium"
          >
            {row.original.vehicle_title}
          </Link>
          <p className="text-caption text-text-subtle truncate">{row.original.stock_id}</p>
        </div>
      ),
    }),

    columnHelper.display({
      id: "brand_model",
      header: "Brand / Model",
      enableSorting: false,
      size: 200,
      cell: ({ row }) => {
        const parts = [row.original.brand_name, row.original.model_name].filter(Boolean);
        return parts.length > 0 ? parts.join(" · ") : "—";
      },
    }),

    columnHelper.accessor("location_name", {
      id: "showroom",
      header: "Showroom",
      enableSorting: false,
      size: 170,
    }),

    columnHelper.display({
      id: "date",
      header: "Date",
      enableSorting: false,
      size: 160,
      cell: ({ row }) => {
        const isToday = toDubaiIsoDate(row.original.scheduled_start) === getDubaiToday();
        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {formatDay(row.original.scheduled_start)}
            {isToday && (
              <span className="bg-primary/15 text-caption text-primary-text rounded-full px-1.5 py-0.5">
                Today
              </span>
            )}
          </span>
        );
      },
    }),

    columnHelper.display({
      id: "time",
      header: "Time",
      enableSorting: false,
      size: 130,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatTimeRange(row.original.scheduled_start, row.original.scheduled_end)}
        </span>
      ),
    }),

    columnHelper.display({
      id: "assigned_staff",
      header: "Assigned Staff",
      enableSorting: false,
      size: 160,
      cell: ({ row }) =>
        row.original.staff_name ? (
          <span className="truncate">{row.original.staff_name}</span>
        ) : (
          <span className="text-text-subtle">Unassigned</span>
        ),
    }),

    columnHelper.display({
      id: "status",
      header: "Status",
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <TestDriveStatusBadge status={row.original.status} size="sm" />
          {row.original.checked_in_at && (
            <span
              className="text-caption inline-flex items-center gap-1 text-[var(--omc-status-text)]"
              style={{ "--omc-status-raw": "#34d399" } as React.CSSProperties}
            >
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Arrived
            </span>
          )}
        </div>
      ),
    }),

    columnHelper.accessor("request_source_name", {
      id: "request_source",
      header: "Request Source",
      enableSorting: false,
      size: 150,
      cell: (ctx) => ctx.getValue() ?? "—",
    }),

    columnHelper.display({
      id: "created_at",
      header: "Created Date",
      enableSorting: false,
      size: 130,
      cell: ({ row }) => (
        <span className="whitespace-nowrap" title={formatDateTimeFull(row.original.created_at)}>
          {formatDay(row.original.created_at)}
        </span>
      ),
    }),

    columnHelper.display({
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const testDrive = row.original;
        const actions = getAvailableActions(testDrive.status, {
          isCheckedIn: !!testDrive.checked_in_at,
          permissions,
          hasStaff: !!testDrive.assigned_staff_id,
        });

        return (
          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label={`Actions for ${testDrive.test_drive_number}`} variant="ghost" size="sm">
                <MoreVertical className="size-4" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-60 py-1">
              <Link
                href={`/admin/test-drives/${testDrive.id}`}
                role="menuitem"
                className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
              >
                <Eye className="text-text-muted size-4" aria-hidden="true" />
                View details
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => onViewAssignmentHistory(testDrive)}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <History className="text-text-muted size-4" aria-hidden="true" />
                Assignment history
              </button>

              {actions.length > 0 && <div role="separator" className="border-border my-1 border-t" />}

              {actions.map((key) => {
                const meta = TEST_DRIVE_ACTION_META[key];
                const Icon = TEST_DRIVE_ACTION_ICON[key];
                const destructive = meta.variant === "destructive";

                return (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    onClick={() => onAction(key, testDrive)}
                    className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                  >
                    <Icon
                      className={cn("size-4", destructive ? "text-red-500" : "text-text-muted")}
                      aria-hidden="true"
                    />
                    <span className={destructive ? "text-red-500" : "text-text-primary"}>{meta.label}</span>
                  </button>
                );
              })}
            </DropdownContent>
          </Dropdown>
        );
      },
    }),
  ];

  // Same TanStack column-def variance limitation documented in
  // inventory-columns.tsx, customer-columns.tsx and lead-columns.tsx.
  return columns as ColumnDef<TestDriveListRow, unknown>[];
}

export const DEFAULT_TEST_DRIVE_COLUMN_ORDER = [
  "select",
  "test_drive_number",
  "customer",
  "vehicle",
  "brand_model",
  "showroom",
  "date",
  "time",
  "assigned_staff",
  "status",
  "request_source",
  "created_at",
  "actions",
];

// A clean default: who, what, when, who's hosting, and where it stands.
// Everything else is one click away in the column menu.
export const DEFAULT_TEST_DRIVE_COLUMN_VISIBILITY: Record<string, boolean> = {
  select: true,
  test_drive_number: true,
  customer: true,
  vehicle: true,
  brand_model: false,
  showroom: false,
  date: true,
  time: true,
  assigned_staff: true,
  status: true,
  request_source: false,
  created_at: false,
  actions: true,
};

// Test Drive ID and Customer always stay visible: they identify the row.
export const CUSTOMIZABLE_TEST_DRIVE_COLUMNS = [
  { id: "vehicle", label: "Vehicle" },
  { id: "brand_model", label: "Brand / Model" },
  { id: "showroom", label: "Showroom" },
  { id: "date", label: "Date" },
  { id: "time", label: "Time" },
  { id: "assigned_staff", label: "Assigned Staff" },
  { id: "status", label: "Status" },
  { id: "request_source", label: "Request Source" },
  { id: "created_at", label: "Created Date" },
];
