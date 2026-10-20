import { Check, Circle } from "lucide-react";
import { addMinutesToTime, formatDayLong, formatDuration } from "@/src/lib/utils/test-drive-format";
import type { TestDriveCustomerOption, TestDriveVehicleOption } from "@/src/lib/types/test-drive";

interface TestDriveSummaryCardProps {
  customer: TestDriveCustomerOption | null;
  vehicle: TestDriveVehicleOption | null;
  showroomName: string | null;
  date: string;
  time: string;
  durationMinutes: number;
  staffName: string | null;
  leadSummary: string;
}

function Row({ label, value, done }: { label: string; value: string | null; done: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      {done ? (
        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
      ) : (
        <Circle className="text-text-subtle mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p className="text-caption text-text-subtle">
          {label}
          <span className="sr-only">{done ? " (done)" : " (still needed)"}</span>
        </p>
        <p className={done ? "text-body-sm text-text-primary" : "text-body-sm text-text-subtle"}>
          {value ?? "Not chosen yet"}
        </p>
      </div>
    </div>
  );
}

export function TestDriveSummaryCard({
  customer,
  vehicle,
  showroomName,
  date,
  time,
  durationMinutes,
  staffName,
  leadSummary,
}: TestDriveSummaryCardProps) {
  const when =
    date && time
      ? `${formatDayLong(date)}, ${time} – ${addMinutesToTime(time, durationMinutes)} (${formatDuration(durationMinutes)})`
      : null;

  return (
    <aside aria-label="Request summary" className="surface-card flex flex-col gap-4 p-5">
      <h2 className="text-h3">Summary</h2>

      <div className="flex flex-col gap-3">
        <Row
          label="Customer"
          value={customer ? `${customer.full_name} · ${customer.customer_number}` : null}
          done={!!customer}
        />
        <Row
          label="Vehicle"
          value={vehicle ? `${vehicle.display_title} · ${vehicle.stock_id}` : null}
          done={!!vehicle}
        />
        <Row label="Showroom" value={showroomName} done={!!showroomName} />
        <Row label="Date and time" value={when} done={!!when} />
        <Row label="Staff" value={staffName ?? "Assign before approval"} done={!!staffName} />
        <Row label="Lead" value={leadSummary} done={leadSummary !== "None"} />
      </div>

      <p className="border-border text-caption text-text-subtle border-t pt-3">
        The request is saved as <span className="text-text-muted font-medium">Pending</span>. A manager
        approves it, and availability is checked again at that point.
      </p>
    </aside>
  );
}
