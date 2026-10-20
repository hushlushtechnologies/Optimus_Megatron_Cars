"use client";

import Link from "next/link";
import { CheckCircle2, History } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Tooltip } from "@/src/components/ui/tooltip";
import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import { TEST_DRIVE_ACTION_ICON } from "@/src/components/test-drives/test-drive-action-icons";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import {
  TEST_DRIVE_ACTION_META,
  getAvailableActions,
  type TestDriveActionKey,
} from "@/src/lib/utils/test-drive-actions";
import {
  formatDayLong,
  formatDuration,
  formatTime,
  formatTimeRange,
} from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

interface TestDriveQuickViewProps {
  event: TestDriveListRow | null;
  /** Whether the current user may approve and reject requests. */
  permissions: TestDrivePermissions;
  onClose: () => void;
  onAction: (action: TestDriveActionKey, event: TestDriveListRow) => void;
  onViewAssignmentHistory: (event: TestDriveListRow) => void;
}

export function TestDriveQuickView({
  event,
  permissions,
  onClose,
  onAction,
  onViewAssignmentHistory,
}: TestDriveQuickViewProps) {
  const actions = event
    ? getAvailableActions(event.status, {
        isCheckedIn: !!event.checked_in_at,
        permissions,
        hasStaff: !!event.assigned_staff_id,
      })
    : [];

  return (
    <Modal
      isOpen={!!event}
      onClose={onClose}
      title={event ? `Test Drive ${event.test_drive_number}` : "Test Drive"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {event && (
            <Link
              href={`/admin/test-drives/${event.id}`}
              className="bg-primary text-body hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-md px-4 text-[#0b1220] transition-colors"
            >
              View full details
            </Link>
          )}
        </>
      }
    >
      {event && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <TestDriveStatusBadge status={event.status} />
            {event.checked_in_at && (
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
                Checked in {formatTime(event.checked_in_at)}
              </span>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="When">
              {formatDayLong(event.scheduled_start)}
              <br />
              {formatTimeRange(event.scheduled_start, event.scheduled_end)}{" "}
              <span className="text-text-subtle">({formatDuration(event.duration_minutes)})</span>
            </Detail>
            <Detail label="Showroom">{event.location_name}</Detail>
            <Detail label="Customer">
              <Link
                href={`/admin/customers/${event.customer_id}`}
                className="text-primary-text hover:text-primary-hover"
              >
                {event.customer_name}
              </Link>
              <span className="text-caption text-text-subtle block">{event.customer_number}</span>
            </Detail>
            <Detail label="Vehicle">
              <Link
                href={`/admin/inventory/${event.car_id}`}
                className="text-primary-text hover:text-primary-hover"
              >
                {event.vehicle_title}
              </Link>
              <span className="text-caption text-text-subtle block">
                {event.brand_name ? `${event.brand_name} · ` : ""}
                {event.stock_id}
              </span>
            </Detail>
            <Detail label="Assigned staff">
              {event.staff_name ?? <span className="text-text-muted">Unassigned</span>}
            </Detail>
            <Detail label="Related lead">
              {event.lead_id ? (
                <Link
                  href={`/admin/leads/${event.lead_id}`}
                  className="text-primary-text hover:text-primary-hover"
                >
                  {event.lead_number ?? "View lead"}
                </Link>
              ) : (
                <span className="text-text-muted">None</span>
              )}
            </Detail>
          </dl>

          <div className="border-border flex flex-col gap-2 border-t pt-4">
            {actions.length > 0 && (
              <>
                <p className="text-label">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {actions.map((key) => {
                    const meta = TEST_DRIVE_ACTION_META[key];
                    const Icon = TEST_DRIVE_ACTION_ICON[key];
                    return (
                      <Tooltip key={key} content={meta.tooltip}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={cn(
                            meta.variant === "destructive" &&
                              "border-red-500/40 text-red-500 hover:bg-red-500/10",
                          )}
                          leftIcon={<Icon className="size-3.5" />}
                          onClick={() => onAction(key, event)}
                        >
                          {meta.label}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </div>
              </>
            )}

            <div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leftIcon={<History className="size-3.5" />}
                onClick={() => onViewAssignmentHistory(event)}
              >
                Assignment history
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-text-subtle">{label}</dt>
      <dd className="text-body-sm text-text-primary">{children}</dd>
    </div>
  );
}
