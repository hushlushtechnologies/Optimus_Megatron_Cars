"use client";

import type { CSSProperties } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  TEST_DRIVE_STATUS_META,
  TestDriveStatusBadge,
} from "@/src/components/test-drives/test-drive-status-badge";
import { formatTime, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

/** One sentence a screen reader can say for an appointment, status included. */
export function describeCalendarEvent(event: TestDriveListRow): string {
  return [
    formatTimeRange(event.scheduled_start, event.scheduled_end),
    event.customer_name,
    event.vehicle_title,
    event.status,
    event.staff_name ? `with ${event.staff_name}` : "unassigned",
  ].join(", ");
}

function tint(raw: string): CSSProperties {
  return {
    "--omc-status-raw": raw,
    backgroundColor: `${raw}1A`,
    borderColor: `${raw}66`,
    borderLeftColor: raw,
  } as CSSProperties;
}

interface BaseProps {
  event: TestDriveListRow;
  onSelect: (event: TestDriveListRow) => void;
}

/** Month view: one line. */
export function CalendarEventChip({ event, onSelect }: BaseProps) {
  const { icon: Icon, raw } = TEST_DRIVE_STATUS_META[event.status];
  const description = describeCalendarEvent(event);

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-label={description}
      title={description}
      className="text-caption focus-visible:ring-primary flex w-full items-center gap-1 rounded border border-l-[3px] px-1.5 py-0.5 text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
      style={tint(raw)}
    >
      <Icon className="size-3 shrink-0 text-[var(--omc-status-text)]" aria-hidden="true" />
      <span className="text-text-primary shrink-0 font-medium tabular-nums">
        {formatTime(event.scheduled_start)}
      </span>
      <span className="text-text-muted truncate">{event.customer_name}</span>
    </button>
  );
}

interface BlockProps extends BaseProps {
  heightPx: number;
  /** Position inside the day column: top, height, left, width. */
  style: CSSProperties;
}

/** Week and day views: placed on the time grid. */
export function CalendarEventBlock({ event, heightPx, style, onSelect }: BlockProps) {
  const { icon: Icon, raw } = TEST_DRIVE_STATUS_META[event.status];
  const description = describeCalendarEvent(event);

  // Show only what fits. A tall block earns the vehicle and the status word.
  const showVehicle = heightPx >= 58;
  const showStatus = heightPx >= 80;

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-label={description}
      title={description}
      className="text-caption focus-visible:ring-primary absolute flex flex-col gap-0.5 overflow-hidden rounded-md border border-l-[3px] px-1.5 py-1 text-left leading-tight transition-shadow hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
      style={{ ...tint(raw), ...style }}
    >
      <span className="text-text-muted flex items-center gap-1 tabular-nums">
        <Icon className="size-3 shrink-0 text-[var(--omc-status-text)]" aria-hidden="true" />
        {formatTime(event.scheduled_start)}
        {event.checked_in_at && (
          <CheckCircle2 className="size-3 shrink-0 text-[var(--omc-status-text)]" aria-hidden="true" />
        )}
      </span>
      <span className="text-text-primary truncate font-medium">{event.customer_name}</span>
      {showVehicle && <span className="text-text-muted truncate">{event.vehicle_title}</span>}
      {showStatus && <span className="truncate text-[var(--omc-status-text)]">{event.status}</span>}
    </button>
  );
}

/** Agenda lists (phone): a full-width row. */
export function CalendarEventRow({ event, onSelect }: BaseProps) {
  const { raw } = TEST_DRIVE_STATUS_META[event.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-label={describeCalendarEvent(event)}
      className={cn(
        "border-border bg-card hover:bg-card-hover focus-visible:ring-primary flex w-full items-start gap-3 rounded-lg border border-l-[3px] p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none",
      )}
      style={{ borderLeftColor: raw }}
    >
      <span className="text-body-sm flex w-12 shrink-0 flex-col tabular-nums">
        <span className="text-text-primary font-medium">{formatTime(event.scheduled_start)}</span>
        <span className="text-caption text-text-subtle">{formatTime(event.scheduled_end)}</span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-text-primary truncate font-medium">{event.customer_name}</span>
        <span className="text-body-sm text-text-muted truncate">
          {event.vehicle_title}
          {event.brand_name ? ` · ${event.brand_name}` : ""}
        </span>
        <span className="text-caption text-text-subtle truncate">
          {event.location_name} · {event.staff_name ?? "Unassigned"}
        </span>
      </span>

      <TestDriveStatusBadge status={event.status} size="sm" className="shrink-0" />
    </button>
  );
}
