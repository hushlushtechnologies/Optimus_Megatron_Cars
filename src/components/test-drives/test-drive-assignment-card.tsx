"use client";

import { formatDistanceToNow } from "date-fns";
import { History, UserCog } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Tooltip } from "@/src/components/ui/tooltip";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from "@/src/components/test-drives/availability-indicator";
import { cn } from "@/src/lib/utils/cn";

interface TestDriveAssignmentCardProps {
  staffName: string | null;
  assignedByName?: string | null;
  assignedAt?: string | null;
  availability?: { state: AvailabilityState; detail?: string };
  /** Whether the current user may assign or reassign. */
  canChange?: boolean;
  onChange?: () => void;
  onViewHistory?: () => void;
  label?: string;
  className?: string;
}

export function TestDriveAssignmentCard({
  staffName,
  assignedByName,
  assignedAt,
  availability,
  canChange,
  onChange,
  onViewHistory,
  label = "Assigned Staff",
  className,
}: TestDriveAssignmentCardProps) {
  return (
    <div className={cn("surface-card flex flex-col gap-3 p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-label">{label}</p>
        {onViewHistory && (
          <Tooltip content="Assignment history">
            <IconButton
              aria-label="View assignment history"
              variant="ghost"
              size="sm"
              onClick={onViewHistory}
            >
              <History className="size-4" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {staffName ? (
        <div className="flex items-center gap-3">
          <CustomerAvatar fullName={staffName} photoUrl={null} size="sm" />
          <div className="min-w-0">
            <p className="text-text-primary truncate font-medium">{staffName}</p>
            {(assignedByName || assignedAt) && (
              <p className="text-caption text-text-subtle truncate" suppressHydrationWarning>
                {assignedByName ? `Assigned by ${assignedByName}` : "Assigned"}
                {assignedAt && ` · ${formatDistanceToNow(new Date(assignedAt), { addSuffix: true })}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-body-sm text-text-muted">No staff member assigned yet.</p>
          <p className="text-caption text-text-subtle mt-0.5">
            A staff member is required before a request can be approved.
          </p>
        </div>
      )}

      {availability && (
        <AvailabilityIndicator
          state={availability.state}
          label="Staff availability"
          detail={availability.detail}
          help="Checks the staff member's other appointments and any leave for this time."
        />
      )}

      {canChange && onChange && (
        <div>
          <Tooltip
            content={
              staffName
                ? "Choose a different staff member to host this drive."
                : "Choose who will host this drive."
            }
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<UserCog className="size-3.5" />}
              onClick={onChange}
            >
              {staffName ? "Reassign" : "Assign Staff"}
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
