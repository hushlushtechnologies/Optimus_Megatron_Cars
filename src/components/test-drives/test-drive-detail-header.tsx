"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Ban,
  BadgeCheck,
  CalendarClock,
  CarFront,
  Check,
  CheckCircle2,
  Inbox,
  Link2,
  LogIn,
  MapPin,
  MoreVertical,
  Pencil,
  UserRound,
  UserX,
  X,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tooltip } from "@/src/components/ui/tooltip";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import { TEST_DRIVE_ACTION_META, type TestDriveActionKey } from "@/src/lib/utils/test-drive-actions";
import {
  formatDayLong,
  formatDuration,
  formatTime,
  formatTimeRange,
} from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveSummary } from "@/src/lib/types/test-drive";

const ACTION_ICON: Record<TestDriveActionKey, LucideIcon> = {
  approve: Check,
  reject: X,
  edit: Pencil,
  reschedule: CalendarClock,
  cancel: Ban,
  check_in: LogIn,
  complete: BadgeCheck,
  no_show: UserX,
  assign_staff: UserCog,
  reassign_staff: UserCog,
};

const INLINE_ACTION_COUNT = 2;

interface TestDriveDetailHeaderProps {
  testDrive: TestDriveSummary;
  /** The actions valid right now for this status AND this user. */
  allowedActions: TestDriveActionKey[];
  onAction?: (action: TestDriveActionKey) => void;
  /** The action currently being processed, shown as a loading button. */
  busyAction?: TestDriveActionKey | null;
}

export function TestDriveDetailHeader({
  testDrive,
  allowedActions,
  onAction,
  busyAction,
}: TestDriveDetailHeaderProps) {
  const inlineActions = allowedActions.slice(0, INLINE_ACTION_COUNT);
  const menuActions = allowedActions.slice(INLINE_ACTION_COUNT);

  const facts: { icon: LucideIcon; label: string; value: ReactNode }[] = [
    {
      icon: CalendarClock,
      label: "Appointment",
      value: (
        <>
          {formatDayLong(testDrive.scheduled_start)}
          <br />
          {formatTimeRange(testDrive.scheduled_start, testDrive.scheduled_end)}{" "}
          <span className="text-text-subtle">({formatDuration(testDrive.duration_minutes)})</span>
        </>
      ),
    },
    { icon: MapPin, label: "Showroom", value: testDrive.location_name },
    {
      icon: CarFront,
      label: "Vehicle",
      value: (
        <Link
          href={`/admin/inventory/${testDrive.vehicle.id}`}
          className="text-primary-text hover:text-primary-hover"
        >
          {testDrive.vehicle.display_title}
          <span className="text-caption text-text-subtle block">
            {testDrive.vehicle.brand_name ? `${testDrive.vehicle.brand_name} · ` : ""}
            {testDrive.vehicle.stock_id}
          </span>
        </Link>
      ),
    },
    {
      icon: UserRound,
      label: "Assigned staff",
      value: testDrive.assigned_staff_name ?? <span className="text-text-muted">Unassigned</span>,
    },
    {
      icon: Link2,
      label: "Related lead",
      value: testDrive.lead_id ? (
        <Link
          href={`/admin/leads/${testDrive.lead_id}`}
          className="text-primary-text hover:text-primary-hover"
        >
          {testDrive.lead_number ?? "View lead"}
        </Link>
      ) : (
        <span className="text-text-muted">None</span>
      ),
    },
    { icon: Inbox, label: "Request source", value: testDrive.request_source_name ?? "—" },
  ];

  return (
    <div className="surface-card flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption text-text-subtle">{testDrive.test_drive_number}</p>
          <h1 className="text-h2 text-text-primary truncate">
            <Link href={`/admin/customers/${testDrive.customer.id}`} className="hover:text-primary-text">
              {testDrive.customer.full_name}
            </Link>
          </h1>
          <p className="text-caption text-text-subtle">
            {testDrive.customer.customer_number} · {testDrive.customer.phone}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2" aria-live="polite">
            <TestDriveStatusBadge status={testDrive.status} />
            {testDrive.checked_in_at && (
              <span
                className="text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[var(--omc-status-text)]"
                style={
                  {
                    "--omc-status-raw": "#34d399",
                    backgroundColor: "#34d3991A",
                    borderColor: "#34d39966",
                  } as React.CSSProperties
                }
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Checked in {formatTime(testDrive.checked_in_at)}
              </span>
            )}
          </div>
        </div>

        {allowedActions.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {inlineActions.map((key) => {
              const meta = TEST_DRIVE_ACTION_META[key];
              const Icon = ACTION_ICON[key];
              return (
                <Tooltip key={key} content={meta.tooltip}>
                  <Button
                    type="button"
                    size="sm"
                    variant={meta.variant === "default" ? undefined : "outline"}
                    className={cn(
                      meta.variant === "destructive" && "border-red-500/40 text-red-500 hover:bg-red-500/10",
                    )}
                    leftIcon={<Icon className="size-3.5" />}
                    isLoading={busyAction === key}
                    disabled={!!busyAction && busyAction !== key}
                    onClick={() => onAction?.(key)}
                  >
                    {meta.label}
                  </Button>
                </Tooltip>
              );
            })}

            {menuActions.length > 0 && (
              <Dropdown>
                <DropdownTrigger>
                  <IconButton aria-label="More actions" variant="outline" size="sm">
                    <MoreVertical className="size-4" />
                  </IconButton>
                </DropdownTrigger>
                <DropdownContent align="end" className="w-64 py-1">
                  {menuActions.map((key) => {
                    const meta = TEST_DRIVE_ACTION_META[key];
                    const Icon = ACTION_ICON[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        role="menuitem"
                        disabled={!!busyAction}
                        onClick={() => onAction?.(key)}
                        className="hover:bg-card-hover flex w-full items-start gap-2.5 px-4 py-2 text-left disabled:opacity-50"
                      >
                        <Icon
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            meta.variant === "destructive" ? "text-red-500" : "text-text-muted",
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "text-body-sm block",
                              meta.variant === "destructive" ? "text-red-500" : "text-text-primary",
                            )}
                          >
                            {meta.label}
                          </span>
                          <span className="text-caption text-text-subtle block">{meta.tooltip}</span>
                        </span>
                      </button>
                    );
                  })}
                </DropdownContent>
              </Dropdown>
            )}
          </div>
        )}
      </div>

      <dl className="border-border grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="text-text-subtle mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-caption text-text-subtle">{label}</dt>
              <dd className="text-body-sm text-text-primary">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TestDriveDetailHeaderSkeleton() {
  return (
    <div className="surface-card flex flex-col gap-5 p-5" aria-busy="true" aria-label="Loading test drive">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <div className="border-border grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
