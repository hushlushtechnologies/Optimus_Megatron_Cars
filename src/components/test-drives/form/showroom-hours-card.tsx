import { format } from "date-fns";
import { CalendarOff, ChevronDown, Clock } from "lucide-react";
import { parseIsoDate } from "@/src/lib/utils/test-drive-format";
import { trimSeconds } from "@/src/lib/utils/test-drive-slots";
import type { ShowroomScheduleInfo } from "@/src/lib/types/test-drive";

// Monday first, to match the calendars in this module.
const DAYS = [
  { no: 1, name: "Monday" },
  { no: 2, name: "Tuesday" },
  { no: 3, name: "Wednesday" },
  { no: 4, name: "Thursday" },
  { no: 5, name: "Friday" },
  { no: 6, name: "Saturday" },
  { no: 0, name: "Sunday" },
];

function formatClosure(startsOn: string, endsOn: string): string {
  const start = parseIsoDate(startsOn);
  if (startsOn === endsOn) return format(start, "EEE d MMM yyyy");
  return `${format(start, "d MMM")} – ${format(parseIsoDate(endsOn), "d MMM yyyy")}`;
}

export function ShowroomHoursCard({ info }: { info: ShowroomScheduleInfo }) {
  const closures = [...info.blackouts].sort((a, b) => a.starts_on.localeCompare(b.starts_on)).slice(0, 5);

  return (
    <details className="group border-border bg-card rounded-md border px-4 py-2.5">
      <summary className="text-body-sm text-text-muted hover:text-text-primary focus-visible:ring-primary flex cursor-pointer list-none items-center gap-2 rounded focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <Clock className="size-4 shrink-0" aria-hidden="true" />
        Opening hours and closures
        <ChevronDown
          className="ml-auto size-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>

      <dl className="border-border mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 border-t pt-3 sm:grid-cols-2">
        {DAYS.map(({ no, name }) => {
          const row = info.hours.find((h) => h.day_of_week === no);
          const closed = !row || row.is_closed;
          return (
            <div key={no} className="flex items-baseline justify-between gap-3">
              <dt className="text-body-sm text-text-muted">{name}</dt>
              <dd
                className={
                  closed ? "text-body-sm text-text-subtle" : "text-body-sm text-text-primary tabular-nums"
                }
              >
                {closed ? "Closed" : `${trimSeconds(row.opens_at)} – ${trimSeconds(row.closes_at)}`}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="border-border mt-3 border-t pt-3">
        <p className="text-caption text-text-subtle flex items-center gap-1.5">
          <CalendarOff className="size-3.5" aria-hidden="true" />
          Upcoming closures
        </p>
        {closures.length === 0 ? (
          <p className="text-body-sm text-text-muted mt-1">None scheduled.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {closures.map((closure) => (
              <li
                key={`${closure.starts_on}-${closure.ends_on}-${closure.reason}`}
                className="text-body-sm text-text-primary"
              >
                {formatClosure(closure.starts_on, closure.ends_on)}
                <span className="text-text-muted"> · {closure.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-caption text-text-subtle mt-3">
        Slots every {info.settings.slot_interval_minutes} minutes · {info.settings.buffer_minutes} minute
        buffer after each drive · at least {info.settings.min_notice_hours} hours&apos; notice · bookings open{" "}
        {info.settings.max_advance_days} days ahead.
      </p>
    </details>
  );
}
