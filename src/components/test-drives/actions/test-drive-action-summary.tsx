import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import { formatDayLong, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDriveActionSubject } from "@/src/lib/types/test-drive";

/** The "which test drive is this?" box at the top of every action dialog. */
export function TestDriveActionSummary({ subject }: { subject: TestDriveActionSubject }) {
  return (
    <div className="border-border bg-card-hover/40 flex flex-col gap-1 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-text-subtle">{subject.test_drive_number}</p>
        <TestDriveStatusBadge status={subject.status} size="sm" />
      </div>
      <p className="text-text-primary font-medium">{subject.customer_name}</p>
      <p className="text-body-sm text-text-muted">{subject.vehicle_title}</p>
      <p className="text-body-sm text-text-muted">
        {formatDayLong(subject.scheduled_start)} ·{" "}
        {formatTimeRange(subject.scheduled_start, subject.scheduled_end)}
      </p>
      <p className="text-caption text-text-subtle">{subject.location_name}</p>
    </div>
  );
}
