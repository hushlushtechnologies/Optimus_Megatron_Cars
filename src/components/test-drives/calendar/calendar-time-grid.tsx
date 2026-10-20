"use client";

import { format } from "date-fns";
import { CalendarEventBlock } from "@/src/components/test-drives/calendar/calendar-event";
import {
  HOUR_HEIGHT_PX,
  formatHourLabel,
  getGridHourRange,
  layoutDayEvents,
} from "@/src/lib/utils/test-drive-calendar";
import { parseIsoDate } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

interface CalendarTimeGridProps {
  days: string[];
  byDay: Map<string, TestDriveListRow[]>;
  today: string;
  /** The current time in Dubai. Null until the browser takes over. */
  now: { iso: string; minutes: number } | null;
  ariaLabel: string;
  /** In the week view, a day heading opens that day. */
  clickableHeaders: boolean;
  onSelectEvent: (event: TestDriveListRow) => void;
  onOpenDay: (isoDate: string) => void;
}

export function CalendarTimeGrid({
  days,
  byDay,
  today,
  now,
  ariaLabel,
  clickableHeaders,
  onSelectEvent,
  onOpenDay,
}: CalendarTimeGridProps) {
  const layouts = days.map((iso) => layoutDayEvents(byDay.get(iso) ?? []));
  const { startHour, endHour } = getGridHourRange(layouts.flat());
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const bodyHeight = hours.length * HOUR_HEIGHT_PX;
  const columns = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;

  return (
    // Focusable so keyboard users can scroll it sideways on narrower screens.
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className="border-border bg-card focus-visible:ring-primary overflow-x-auto rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className={days.length > 1 ? "min-w-[760px]" : undefined}>
        <div
          className="border-border bg-card-hover/40 grid border-b"
          style={{ gridTemplateColumns: columns }}
        >
          <div aria-hidden="true" />
          {days.map((iso) => {
            const date = parseIsoDate(iso);
            const isToday = iso === today;
            const heading = (
              <>
                <span className="text-caption text-text-subtle">{format(date, "EEE")}</span>
                <span
                  className={cn(
                    "text-body-sm flex size-7 items-center justify-center rounded-full tabular-nums",
                    isToday ? "bg-primary font-semibold text-[#0b1220]" : "text-text-primary",
                  )}
                >
                  {format(date, "d")}
                </span>
              </>
            );

            return clickableHeaders ? (
              <button
                key={iso}
                type="button"
                onClick={() => onOpenDay(iso)}
                aria-label={`Open ${format(date, "EEEE d MMMM")}${isToday ? ", today" : ""}`}
                className="border-border hover:bg-card-hover focus-visible:ring-primary flex flex-col items-center gap-0.5 border-l py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset motion-reduce:transition-none"
              >
                {heading}
              </button>
            ) : (
              <div key={iso} className="border-border flex flex-col items-center gap-0.5 border-l py-2">
                {heading}
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div aria-hidden="true" className="relative" style={{ height: bodyHeight }}>
            {hours.map((hour, i) => (
              <span
                key={hour}
                className="text-caption text-text-subtle absolute right-2 tabular-nums"
                style={{ top: i * HOUR_HEIGHT_PX + 2 }}
              >
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>

          {days.map((iso, dayIndex) => {
            const showNow =
              now !== null && now.iso === iso && now.minutes >= startHour * 60 && now.minutes <= endHour * 60;

            return (
              <div key={iso} className="border-border relative border-l" style={{ height: bodyHeight }}>
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    aria-hidden="true"
                    className="border-border/60 absolute inset-x-0 border-t"
                    style={{ top: i * HOUR_HEIGHT_PX }}
                  />
                ))}

                {showNow && now && (
                  <div
                    aria-hidden="true"
                    className="bg-primary pointer-events-none absolute inset-x-0 z-20 h-px"
                    style={{ top: ((now.minutes - startHour * 60) / 60) * HOUR_HEIGHT_PX }}
                  >
                    <span className="bg-primary absolute -top-[3px] -left-1 size-[7px] rounded-full" />
                  </div>
                )}

                {layouts[dayIndex].map((p) => {
                  const top = ((p.startMinutes - startHour * 60) / 60) * HOUR_HEIGHT_PX;
                  const height = Math.max(((p.endMinutes - p.startMinutes) / 60) * HOUR_HEIGHT_PX, 28);
                  const left = (p.column / p.columns) * 100;
                  const width = 100 / p.columns;

                  return (
                    <CalendarEventBlock
                      key={p.event.id}
                      event={p.event}
                      heightPx={height}
                      onSelect={onSelectEvent}
                      style={{
                        top,
                        height,
                        left: `calc(${left}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
