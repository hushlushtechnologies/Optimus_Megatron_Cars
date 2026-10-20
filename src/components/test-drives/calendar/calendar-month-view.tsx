"use client";

import { format } from "date-fns";
import { CalendarEventChip } from "@/src/components/test-drives/calendar/calendar-event";
import { parseIsoDate } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS_PER_DAY = 3;

interface CalendarMonthViewProps {
  /** Every day in the grid, including the neighbouring days that fill out the weeks. */
  days: string[];
  /** Any date inside the month being shown. */
  monthDate: string;
  byDay: Map<string, TestDriveListRow[]>;
  today: string;
  selectedDay: string;
  onSelectDay: (isoDate: string) => void;
  onSelectEvent: (event: TestDriveListRow) => void;
  onOpenDay: (isoDate: string) => void;
}

const countLabel = (count: number) => `${count} appointment${count === 1 ? "" : "s"}`;

export function CalendarMonthView({
  days,
  monthDate,
  byDay,
  today,
  selectedDay,
  onSelectDay,
  onSelectEvent,
  onOpenDay,
}: CalendarMonthViewProps) {
  const month = parseIsoDate(monthDate).getMonth();

  return (
    <>
      {/* Tablet and desktop: the full month grid */}
      <div className="hidden md:block">
        <div
          aria-hidden="true"
          className="border-border bg-card-hover/40 grid grid-cols-7 rounded-t-lg border border-b-0"
        >
          {WEEKDAYS.map((day) => (
            <p key={day} className="text-caption text-text-subtle px-2 py-2 text-center">
              {day}
            </p>
          ))}
        </div>

        <ol className="border-border bg-card grid grid-cols-7 overflow-hidden rounded-b-lg border-t border-l">
          {days.map((iso) => {
            const date = parseIsoDate(iso);
            const events = byDay.get(iso) ?? [];
            const visible = events.slice(0, MAX_CHIPS_PER_DAY);
            const extra = events.length - visible.length;
            const inMonth = date.getMonth() === month;
            const isToday = iso === today;

            return (
              <li
                key={iso}
                className={cn(
                  "border-border flex min-h-28 min-w-0 flex-col gap-1 border-r border-b p-1.5",
                  !inMonth && "bg-card-hover/30",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenDay(iso)}
                  aria-label={`${format(date, "EEEE d MMMM")}, ${countLabel(events.length)}. Open day view.`}
                  className={cn(
                    "text-body-sm hover:bg-card-hover focus-visible:ring-primary flex h-7 min-w-7 items-center justify-center self-start rounded-full px-1.5 tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none",
                    isToday && "bg-primary hover:bg-primary-hover font-semibold text-[#0b1220]",
                    !isToday && !inMonth && "text-text-subtle",
                    !isToday && inMonth && "text-text-primary",
                  )}
                >
                  {format(date, date.getDate() === 1 ? "d MMM" : "d")}
                </button>

                {visible.map((event) => (
                  <CalendarEventChip key={event.id} event={event} onSelect={onSelectEvent} />
                ))}

                {extra > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(iso)}
                    className="text-caption text-primary-text hover:text-primary-hover focus-visible:ring-primary rounded px-1 text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    +{extra} more
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Phone: a compact month. Tapping a day lists its appointments below. */}
      <div className="md:hidden">
        <div aria-hidden="true" className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((day) => (
            <p key={day} className="text-caption text-text-subtle py-1">
              {day.slice(0, 1)}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((iso) => {
            const date = parseIsoDate(iso);
            const count = (byDay.get(iso) ?? []).length;
            const isSelected = iso === selectedDay;
            const isToday = iso === today;
            const inMonth = date.getMonth() === month;

            return (
              <button
                key={iso}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${format(date, "EEEE d MMMM")}${isToday ? ", today" : ""}, ${countLabel(count)}`}
                onClick={() => onSelectDay(iso)}
                className={cn(
                  "text-body-sm focus-visible:ring-primary flex h-12 flex-col items-center justify-center gap-0.5 rounded-md border tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none",
                  isSelected
                    ? "border-primary bg-primary/15 text-primary-text font-semibold"
                    : "hover:bg-card-hover border-transparent",
                  !isSelected && (inMonth ? "text-text-primary" : "text-text-subtle"),
                  isToday && !isSelected && "border-primary/50",
                )}
              >
                {format(date, "d")}
                <span className="flex h-1 gap-0.5" aria-hidden="true">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className="bg-primary size-1 rounded-full" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
