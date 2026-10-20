"use client";

import { format } from "date-fns";
import { CalendarEventRow } from "@/src/components/test-drives/calendar/calendar-event";
import { parseIsoDate } from "@/src/lib/utils/test-drive-format";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

export interface AgendaDay {
  iso: string;
  events: TestDriveListRow[];
}

interface CalendarAgendaProps {
  days: AgendaDay[];
  today: string;
  onSelectEvent: (event: TestDriveListRow) => void;
  /** Shown for a day with nothing booked. */
  emptyLabel?: string;
}

/** The phone layout for the week, day and selected-day lists. */
export function CalendarAgenda({
  days,
  today,
  onSelectEvent,
  emptyLabel = "No appointments on this day.",
}: CalendarAgendaProps) {
  return (
    <div className="flex flex-col gap-5">
      {days.map(({ iso, events }) => {
        const date = parseIsoDate(iso);
        const headingId = `agenda-${iso}`;

        return (
          <section key={iso} aria-labelledby={headingId} className="flex flex-col gap-2">
            <h3 id={headingId} className="text-body-sm text-text-primary flex items-center gap-2 font-medium">
              {format(date, "EEEE d MMMM")}
              {iso === today && (
                <span className="bg-primary/15 text-caption text-primary-text rounded-full px-1.5 py-0.5">
                  Today
                </span>
              )}
              <span className="text-caption text-text-subtle font-normal">
                {events.length} {events.length === 1 ? "appointment" : "appointments"}
              </span>
            </h3>

            {events.length === 0 ? (
              <p className="border-border text-body-sm text-text-subtle rounded-md border border-dashed px-3 py-3">
                {emptyLabel}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {events.map((event) => (
                  <li key={event.id}>
                    <CalendarEventRow event={event} onSelect={onSelectEvent} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
