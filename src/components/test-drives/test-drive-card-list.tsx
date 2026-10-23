"use client";

import Link from "next/link";
import { CheckCircle2, Eye, History, MoreVertical } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { IconButton } from "@/src/components/ui/icon-button";
import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import { TEST_DRIVE_ACTION_ICON } from "@/src/components/test-drives/test-drive-action-icons";
import {
  TEST_DRIVE_ACTION_META,
  getAvailableActions,
  type TestDriveActionKey,
} from "@/src/lib/utils/test-drive-actions";
import { formatDay, formatTimeRange, getDubaiToday, toDubaiIsoDate } from "@/src/lib/utils/test-drive-format";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";
import { cn } from "@/src/lib/utils/cn";

interface TestDriveCardListProps {
  rows: TestDriveListRow[];
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  permissions: TestDrivePermissions;
  onAction: (action: TestDriveActionKey, row: TestDriveListRow) => void;
  onViewAssignmentHistory: (row: TestDriveListRow) => void;
}

export function TestDriveCardList({
  rows,
  rowSelection,
  onRowSelectionChange,
  permissions,
  onAction,
  onViewAssignmentHistory,
}: TestDriveCardListProps) {
  const today = getDubaiToday();
  const selectedCount = rows.filter((row) => rowSelection[row.id]).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;

  const toggleAll = () => {
    if (allSelected) {
      onRowSelectionChange({});
      return;
    }
    onRowSelectionChange(Object.fromEntries(rows.map((row) => [row.id, true])));
  };

  const toggleOne = (id: string) => {
    const next = { ...rowSelection };
    if (next[id]) delete next[id];
    else next[id] = true;
    onRowSelectionChange(next);
  };

  return (
    <section aria-label="Test drives" className="flex flex-col gap-3">
      <label className="text-body-sm text-text-muted flex min-h-11 items-center gap-3 px-1">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(element) => {
            if (element) element.indeterminate = selectedCount > 0 && !allSelected;
          }}
          onChange={toggleAll}
          className="accent-primary size-5 rounded"
        />
        Select all on this page
      </label>

      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const selected = !!rowSelection[row.id];
          const isToday = toDubaiIsoDate(row.scheduled_start) === getDubaiToday() && today !== "";
          const actions = getAvailableActions(row.status, {
            isCheckedIn: !!row.checked_in_at,
            permissions,
            hasStaff: !!row.assigned_staff_id,
          });

          return (
            <li
              key={row.id}
              className={cn("surface-card flex flex-col gap-3 p-4", selected && "ring-primary/50 ring-1")}
            >
              <div className="flex items-start gap-3">
                <label className="-m-2 flex size-11 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.test_drive_number}`}
                    checked={selected}
                    onChange={() => toggleOne(row.id)}
                    className="accent-primary size-5 rounded"
                  />
                </label>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/test-drives/${row.id}`}
                    className="text-text-primary block truncate font-medium"
                  >
                    {row.test_drive_number}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <TestDriveStatusBadge status={row.status} size="sm" />
                    {row.checked_in_at && (
                      <span
                        className="text-caption inline-flex items-center gap-1 text-[var(--omc-status-text)]"
                        style={{ "--omc-status-raw": "#34d399" } as React.CSSProperties}
                      >
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        Arrived
                      </span>
                    )}
                  </div>
                </div>

                <Dropdown>
                  <DropdownTrigger>
                    <IconButton aria-label={`Actions for ${row.test_drive_number}`} variant="ghost" size="sm">
                      <MoreVertical className="size-4" aria-hidden="true" />
                    </IconButton>
                  </DropdownTrigger>
                  <DropdownContent align="end" className="w-60 py-1">
                    <Link
                      href={`/admin/test-drives/${row.id}`}
                      role="menuitem"
                      className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-3"
                    >
                      <Eye className="text-text-muted size-4" aria-hidden="true" />
                      View details
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onViewAssignmentHistory(row)}
                      className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-3 text-left"
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
                          onClick={() => onAction(key, row)}
                          className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-3 text-left"
                        >
                          <Icon
                            className={cn("size-4", destructive ? "text-red-500" : "text-text-muted")}
                            aria-hidden="true"
                          />
                          <span className={destructive ? "text-red-500" : "text-text-primary"}>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </DropdownContent>
                </Dropdown>
              </div>

              <div className="flex flex-col gap-0.5">
                <Link
                  href={`/admin/customers/${row.customer_id}`}
                  className="text-text-primary truncate font-medium"
                >
                  {row.customer_name}
                </Link>
                <Link
                  href={`/admin/inventory/${row.car_id}`}
                  className="text-body-sm text-text-muted truncate"
                >
                  {row.vehicle_title} · {row.stock_id}
                </Link>
              </div>

              <dl className="text-body-sm grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <dt className="text-caption text-text-subtle">Date</dt>
                  <dd className="text-text-primary flex flex-wrap items-center gap-1.5">
                    {formatDay(row.scheduled_start)}
                    {isToday && (
                      <span className="bg-primary/15 text-caption text-primary-text rounded-full px-1.5 py-0.5">
                        Today
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-text-subtle">Time</dt>
                  <dd className="text-text-primary tabular-nums">
                    {formatTimeRange(row.scheduled_start, row.scheduled_end)}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-text-subtle">Host</dt>
                  <dd className="text-text-primary truncate">{row.staff_name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-caption text-text-subtle">Showroom</dt>
                  <dd className="text-text-primary truncate">{row.location_name}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
