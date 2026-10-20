import { ArrowDown } from "lucide-react";
import { formatDateTimeFull, formatDay, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDriveScheduleChangeItem } from "@/src/lib/types/test-drive";

interface ScheduleHistoryListProps {
  /** null means the history couldn't be loaded. */
  changes: TestDriveScheduleChangeItem[] | null;
  /** The appointment as it is right now. */
  current: { start: string; durationMinutes: number };
}

function rangeText(startIso: string, minutes: number): string {
  const endIso = new Date(Date.parse(startIso) + minutes * 60_000).toISOString();
  return `${formatDay(startIso)} · ${formatTimeRange(startIso, endIso)}`;
}

export function ScheduleHistoryList({ changes, current }: ScheduleHistoryListProps) {
  if (changes === null) {
    return (
      <p
        role="alert"
        className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
      >
        The appointment history couldn&apos;t be loaded. Refresh the page to try again.
      </p>
    );
  }

  // The oldest change (the last in the list) remembers what the appointment started as.
  const original = changes.length > 0 ? changes[changes.length - 1] : null;
  const originalText = original
    ? rangeText(original.old_start, original.old_duration_minutes)
    : rangeText(current.start, current.durationMinutes);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body-sm text-text-muted">
        {changes.length === 0
          ? "No changes: the appointment is still at its original time."
          : "Every change to the date, time, duration or showroom."}
      </p>

      {changes.length > 0 && (
        <ol className="border-border relative flex flex-col gap-5 border-l pl-4">
          {changes.map((change) => (
            <li key={change.id} className="relative">
              <span
                className="bg-primary absolute top-1.5 -left-[21px] size-2.5 rounded-full"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-0.5">
                <p className="text-body-sm text-text-muted">
                  {rangeText(change.old_start, change.old_duration_minutes)}
                </p>
                <ArrowDown className="text-text-subtle size-3.5" aria-label="changed to" />
                <p className="text-body-sm text-text-primary font-medium">
                  {rangeText(change.new_start, change.new_duration_minutes)}
                </p>
              </div>

              {change.old_location_name &&
                change.new_location_name &&
                change.old_location_name !== change.new_location_name && (
                  <p className="text-body-sm text-text-primary mt-1">
                    Showroom: {change.old_location_name} →{" "}
                    <span className="font-medium">{change.new_location_name}</span>
                  </p>
                )}

              {change.reason && <p className="text-body-sm text-text-muted mt-1">Reason: {change.reason}</p>}

              <p className="text-caption text-text-subtle mt-0.5">
                By {change.changed_by_name} ·{" "}
                <time dateTime={change.changed_at}>{formatDateTimeFull(change.changed_at)}</time>
              </p>
            </li>
          ))}
        </ol>
      )}

      <p className="border-border text-body-sm text-text-muted border-t pt-3">
        Originally booked for <span className="text-text-primary font-medium">{originalText}</span>
      </p>
    </div>
  );
}
