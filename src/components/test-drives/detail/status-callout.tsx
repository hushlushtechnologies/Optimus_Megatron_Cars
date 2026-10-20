import { TEST_DRIVE_STATUS_META } from "@/src/components/test-drives/test-drive-status-badge";
import { formatDateTimeFull, formatDay, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type {
  TestDriveDetail,
  TestDriveScheduleChangeItem,
  TestDriveStatusChangeItem,
} from "@/src/lib/types/test-drive";

interface StatusCalloutProps {
  detail: TestDriveDetail;
  statusChanges: TestDriveStatusChangeItem[] | null;
  scheduleChanges: TestDriveScheduleChangeItem[] | null;
}

function rangeText(startIso: string, minutes: number): string {
  const endIso = new Date(Date.parse(startIso) + minutes * 60_000).toISOString();
  return `${formatDay(startIso)} · ${formatTimeRange(startIso, endIso)}`;
}

/** The "what does this status mean right now?" banner. Approved needs none: the header says it all. */
export function StatusCallout({ detail, statusChanges, scheduleChanges }: StatusCalloutProps) {
  const { icon: Icon, raw } = TEST_DRIVE_STATUS_META[detail.status];

  // Newest first, so the first match is the change that put it in this status.
  const latest = statusChanges?.find((change) => change.new_status === detail.status);

  let title: string | null = null;
  const lines: string[] = [];

  switch (detail.status) {
    case "Pending":
      title = "Waiting for approval";
      lines.push("A manager reviews the request, and availability is checked again when it's approved.");
      if (!detail.assigned_staff_id)
        lines.push("No host is assigned yet. One is chosen at approval, or assigned earlier from Actions.");
      break;

    case "Rejected":
      title = "Request rejected";
      lines.push(detail.rejection_reason ? `Reason: ${detail.rejection_reason}` : "No reason was recorded.");
      break;

    case "Cancelled":
      title = "Appointment cancelled";
      lines.push(
        detail.cancellation_reason ? `Reason: ${detail.cancellation_reason}` : "No reason was recorded.",
      );
      lines.push("The vehicle and host were released for other bookings.");
      break;

    case "Rescheduled": {
      title = "Rescheduled";
      if (detail.reschedule_reason) lines.push(`Reason: ${detail.reschedule_reason}`);
      const previous = scheduleChanges?.[0];
      if (previous) lines.push(`Previously: ${rangeText(previous.old_start, previous.old_duration_minutes)}`);
      break;
    }

    case "No Show":
      title = "Marked as no show";
      lines.push("The customer didn't arrive. The vehicle and host were released.");
      break;

    case "Completed":
      title = "Test drive completed";
      if (detail.actual_start_at && detail.actual_end_at) {
        lines.push(
          `The drive ran ${formatDay(detail.actual_start_at)} · ${formatTimeRange(detail.actual_start_at, detail.actual_end_at)}.`,
        );
      }
      lines.push("The feedback is recorded below.");
      break;

    default:
      return null;
  }

  return (
    <section
      aria-label="Status details"
      className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={
        {
          "--omc-status-raw": raw,
          backgroundColor: `${raw}1A`,
          borderColor: `${raw}66`,
        } as React.CSSProperties
      }
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-[var(--omc-status-text)]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-[var(--omc-status-text)]">{title}</p>
        {lines.map((line) => (
          <p key={line} className="text-body-sm text-text-primary">
            {line}
          </p>
        ))}
        {latest && detail.status !== "Pending" && (
          <p className="text-caption text-text-subtle mt-0.5">
            By {latest.changed_by_name} ·{" "}
            <time dateTime={latest.changed_at}>{formatDateTimeFull(latest.changed_at)}</time>
          </p>
        )}
      </div>
    </section>
  );
}
