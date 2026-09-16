import { CalendarClock } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { upcomingTestDrives } from "@/src/lib/mock-data/dashboard";

export function UpcomingTestDrives() {
  return (
    <Card variant="elevated" padding="lg" className="h-full">
      <h3 className="mb-4 text-h3">Upcoming Test Drives</h3>
      <ul className="flex flex-col gap-3">
        {upcomingTestDrives.map((drive) => (
          <li key={drive.id} className="flex items-start gap-3">
            <CalendarClock
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm text-text-primary">
                {drive.customer} — {drive.car}
              </p>
              <p className="text-caption">{drive.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
