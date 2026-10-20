import Link from "next/link";
import { CalendarClock, CalendarPlus, CarFront, CheckCircle2, MapPin, UserRound, Car } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { InterestBadge } from "@/src/components/test-drives/interest-badge";
import { TestDriveStatusBadge } from "@/src/components/test-drives/test-drive-status-badge";
import { formatDateTimeFull, formatDay, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDrivePanelItem, TestDrivePanelLoad } from "@/src/lib/types/test-drive";

interface TestDrivePanelListProps {
  load: TestDrivePanelLoad;
  emptyTitle: string;
  emptyDescription: string;
  /** Show which lead each drive is linked to (useful on the customer's page). */
  showLead?: boolean;
  /** When given, completed drives with no follow-up yet get a "Create follow-up" button. */
  onCreateFollowUp?: (item: TestDrivePanelItem) => void;
}

function Result({ item }: { item: TestDrivePanelItem }) {
  switch (item.status) {
    case "Completed":
      return item.interest_level ? (
        <InterestBadge level={item.interest_level} />
      ) : (
        <span className="text-body-sm text-text-subtle">Completed, no interest level recorded</span>
      );
    case "Rejected":
      return (
        <span className="text-body-sm text-text-muted">Rejected{item.reason ? `: ${item.reason}` : ""}</span>
      );
    case "Cancelled":
      return (
        <span className="text-body-sm text-text-muted">Cancelled{item.reason ? `: ${item.reason}` : ""}</span>
      );
    case "No Show":
      return <span className="text-body-sm text-text-muted">The customer did not arrive</span>;
    case "Pending":
      return <span className="text-body-sm text-text-muted">Waiting for approval</span>;
    default:
      return (
        <span className="text-body-sm text-text-muted">
          {item.checked_in_at ? "The customer has arrived" : "Confirmed, coming up"}
        </span>
      );
  }
}

export function TestDrivePanelList({
  load,
  emptyTitle,
  emptyDescription,
  showLead,
  onCreateFollowUp,
}: TestDrivePanelListProps) {
  if (load.status === "error") {
    return (
      <p
        role="alert"
        className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
      >
        The test drives couldn&apos;t be loaded. Refresh the page to try again.
      </p>
    );
  }

  if (load.items.length === 0) {
    return (
      <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
        <Car className="text-text-subtle size-7" aria-hidden="true" />
        <p className="text-body-lg text-text-primary">{emptyTitle}</p>
        <p className="text-body-sm text-text-muted max-w-md">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {load.items.map((item) => {
        const canFollowUp = !!onCreateFollowUp && item.status === "Completed" && !item.follow_up;
        const needsFollowUp = item.follow_up_required && !item.follow_up;

        return (
          <li key={item.id} className="surface-card flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/admin/test-drives/${item.id}`}
                  className="text-caption text-text-subtle hover:text-primary-text"
                >
                  {item.test_drive_number}
                </Link>
                <Link
                  href={`/admin/inventory/${item.car_id}`}
                  className="text-text-primary hover:text-primary-text flex items-center gap-1.5 font-medium"
                >
                  <CarFront className="text-text-muted size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.vehicle_title}</span>
                  {item.brand_name && (
                    <span className="text-caption text-text-subtle shrink-0 font-normal">
                      · {item.brand_name}
                    </span>
                  )}
                </Link>
              </div>
              <TestDriveStatusBadge status={item.status} size="sm" />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <p className="text-body-sm text-text-muted flex items-center gap-1.5">
                <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
                {formatDay(item.scheduled_start)} ·{" "}
                {formatTimeRange(item.scheduled_start, item.scheduled_end)}
              </p>
              <p className="text-body-sm text-text-muted flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                {item.location_name}
              </p>
              <p className="text-body-sm text-text-muted flex items-center gap-1.5">
                <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                Host: {item.staff_name ?? "Unassigned"}
              </p>
              {showLead && (
                <p className="text-body-sm text-text-muted">
                  Lead:{" "}
                  {item.lead_id ? (
                    <Link
                      href={`/admin/leads/${item.lead_id}`}
                      className="text-primary-text hover:text-primary-hover"
                    >
                      {item.lead_number ?? "View lead"}
                    </Link>
                  ) : (
                    <span className="text-text-subtle">none</span>
                  )}
                </p>
              )}
            </div>

            <div className="border-border flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-caption text-text-subtle">Result</span>
              <Result item={item} />

              {needsFollowUp && (
                <span
                  className="text-caption inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[var(--omc-status-text)]"
                  style={
                    {
                      "--omc-status-raw": "#f59e0b",
                      backgroundColor: "#f59e0b1A",
                      borderColor: "#f59e0b66",
                    } as React.CSSProperties
                  }
                >
                  <CalendarClock className="size-3" aria-hidden="true" />
                  Follow-up needed
                </span>
              )}
            </div>

            {item.follow_up && (
              <p className="text-body-sm text-text-muted flex flex-wrap items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                Follow-up ({item.follow_up.type}) · {item.follow_up.status} ·{" "}
                <time dateTime={item.follow_up.scheduled_at}>
                  {formatDateTimeFull(item.follow_up.scheduled_at)}
                </time>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/test-drives/${item.id}`}
                className="border-border text-body-sm text-text-primary hover:bg-card-hover inline-flex h-8 items-center justify-center rounded-md border px-3 transition-colors"
              >
                View details
              </Link>
              {canFollowUp && (
                <Button
                  size="sm"
                  variant={needsFollowUp ? "primary" : "outline"}
                  leftIcon={<CalendarPlus className="size-3.5" />}
                  onClick={() => onCreateFollowUp?.(item)}
                >
                  Create follow-up
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
