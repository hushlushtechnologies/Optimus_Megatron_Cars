import { formatDateTimeFull, formatDuration, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDriveDetail } from "@/src/lib/types/test-drive";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-body-sm text-text-muted shrink-0">{label}</dt>
      <dd className="text-body-sm text-text-primary text-right">{children}</dd>
    </div>
  );
}

export function AppointmentInfoCard({ detail }: { detail: TestDriveDetail }) {
  return (
    <section aria-label="Appointment details" className="surface-card flex flex-col gap-3 p-4">
      <p className="text-label">Appointment details</p>

      <dl className="flex flex-col gap-2">
        <Row label="Duration">{formatDuration(detail.duration_minutes)}</Row>
        <Row label="Held after the drive">{detail.buffer_minutes} min</Row>

        {detail.actual_start_at && detail.actual_end_at && (
          <Row label="Actual drive">{formatTimeRange(detail.actual_start_at, detail.actual_end_at)}</Row>
        )}

        <Row label="Requested">
          <time dateTime={detail.created_at}>{formatDateTimeFull(detail.created_at)}</time>
          {detail.created_by_name && (
            <span className="text-caption text-text-subtle block">by {detail.created_by_name}</span>
          )}
        </Row>

        <Row label="Last updated">
          <time dateTime={detail.updated_at}>{formatDateTimeFull(detail.updated_at)}</time>
        </Row>
      </dl>

      <p className="border-border text-caption text-text-subtle border-t pt-3">
        The time after the drive is held for the car to be reset, so back-to-back bookings can&apos;t collide.
      </p>
    </section>
  );
}
