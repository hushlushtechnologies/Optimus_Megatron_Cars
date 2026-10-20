import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarClock, CarFront, CheckCircle2, MapPin, UserRound, type LucideIcon } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import {
  formatDay,
  formatDuration,
  formatTime,
  formatTimeRange,
  getDubaiToday,
  toDubaiIsoDate,
} from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveSummary } from "@/src/lib/types/test-drive";

interface TestDriveCardProps {
  testDrive: TestDriveSummary;
  /** Makes the customer name a link, e.g. to the detail page. */
  href?: string;
  /** Buttons or a menu, shown beside the status badge. */
  actions?: ReactNode;
  /** Only date and vehicle, for tight spaces. */
  compact?: boolean;
  className?: string;
}

function Fact({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-body-sm text-text-muted flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{children}</span>
    </p>
  );
}

export function TestDriveCard({ testDrive, href, actions, compact, className }: TestDriveCardProps) {
  const isToday = toDubaiIsoDate(testDrive.scheduled_start) === getDubaiToday();
  const isUnassigned = !testDrive.assigned_staff_name;

  const identity = (
    <>
      <p className="text-caption text-text-subtle truncate">{testDrive.test_drive_number}</p>
      <p className="text-text-primary truncate font-medium">{testDrive.customer.full_name}</p>
    </>
  );

  return (
    <Card
      variant="elevated"
      padding="sm"
      className={cn(
        "hover:border-primary/30 flex flex-col gap-3 transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <CustomerAvatar fullName={testDrive.customer.full_name} photoUrl={null} size="sm" />
          {href ? (
            <Link href={href} className="hover:text-primary-text min-w-0">
              {identity}
            </Link>
          ) : (
            <div className="min-w-0">{identity}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TestDriveStatusBadge status={testDrive.status} size="sm" />
          {actions}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Fact icon={CalendarClock}>
          {isToday && (
            <span className="bg-primary/15 text-caption text-primary-text mr-1.5 rounded-full px-1.5 py-0.5">
              Today
            </span>
          )}
          {formatDay(testDrive.scheduled_start)} ·{" "}
          {formatTimeRange(testDrive.scheduled_start, testDrive.scheduled_end)}
          {!compact && (
            <span className="text-text-subtle"> ({formatDuration(testDrive.duration_minutes)})</span>
          )}
        </Fact>

        <Fact icon={CarFront}>
          {testDrive.vehicle.display_title}
          {testDrive.vehicle.brand_name && (
            <span className="text-text-subtle"> · {testDrive.vehicle.brand_name}</span>
          )}
        </Fact>

        {!compact && (
          <>
            <Fact icon={MapPin}>{testDrive.location_name}</Fact>
            <Fact icon={UserRound} className={isUnassigned ? "text-text-subtle" : undefined}>
              {testDrive.assigned_staff_name ?? "Unassigned"}
            </Fact>
          </>
        )}

        {testDrive.checked_in_at && (
          <p
            className="text-body-sm flex items-center gap-1.5 text-[var(--omc-status-text)]"
            style={{ "--omc-status-raw": "#34d399" } as React.CSSProperties}
          >
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            Checked in at {formatTime(testDrive.checked_in_at)}
          </p>
        )}
      </div>
    </Card>
  );
}

export function TestDriveCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading test drive">
      <Card variant="flat" padding="sm" className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
        {!compact && <Skeleton className="h-4 w-28" />}
      </Card>
    </div>
  );
}
