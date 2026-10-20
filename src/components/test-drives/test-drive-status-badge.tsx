import {
  Ban,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveStatus } from "@/src/lib/types/test-drive";

// Shared by the badge, the calendar (Phase 5) and anywhere else that needs
// a status's color, so a status looks the same everywhere in the module.
export const TEST_DRIVE_STATUS_META: Record<
  TestDriveStatus,
  { icon: LucideIcon; raw: string; description: string }
> = {
  Pending: { icon: Clock, raw: "#f59e0b", description: "Waiting for approval" },
  Approved: { icon: CheckCircle2, raw: "#34d399", description: "Confirmed" },
  Rejected: { icon: XCircle, raw: "#f87171", description: "Request declined" },
  Rescheduled: { icon: CalendarClock, raw: "#818cf8", description: "Confirmed at a new time" },
  Cancelled: { icon: Ban, raw: "#94a3b8", description: "Appointment cancelled" },
  Completed: { icon: BadgeCheck, raw: "#38bdf8", description: "Test drive took place" },
  "No Show": { icon: UserX, raw: "#fb923c", description: "Customer did not arrive" },
};

interface TestDriveStatusBadgeProps {
  status: TestDriveStatus;
  size?: "sm" | "md";
  className?: string;
}

export function TestDriveStatusBadge({ status, size = "md", className }: TestDriveStatusBadgeProps) {
  const { icon: Icon, raw } = TEST_DRIVE_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border text-[var(--omc-status-text)]",
        size === "sm" ? "text-caption px-2 py-0.5" : "text-body-sm px-2.5 py-1",
        className,
      )}
      style={
        {
          "--omc-status-raw": raw,
          backgroundColor: `${raw}1A`,
          borderColor: `${raw}66`,
        } as React.CSSProperties
      }
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
      {status}
    </span>
  );
}
