import { TEST_DRIVE_STATUS_META } from "@/src/components/test-drives/test-drive-status-badge";
import type { TestDriveStatus } from "@/src/lib/types/test-drive";

const ORDER: TestDriveStatus[] = [
  "Pending",
  "Approved",
  "Rescheduled",
  "Completed",
  "No Show",
  "Cancelled",
  "Rejected",
];

export function CalendarLegend() {
  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-md border px-4 py-3">
      <p className="text-caption text-text-subtle">Status key</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {ORDER.map((status) => {
          const { icon: Icon, raw, description } = TEST_DRIVE_STATUS_META[status];
          return (
            <li
              key={status}
              title={description}
              className="text-body-sm text-text-muted flex items-center gap-1.5"
              style={{ "--omc-status-raw": raw } as React.CSSProperties}
            >
              <Icon className="size-4 text-[var(--omc-status-text)]" aria-hidden="true" />
              <span>
                {status}
                <span className="sr-only">: {description}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
