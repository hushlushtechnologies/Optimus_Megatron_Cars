"use client";

import { motion } from "motion/react";
import { CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { formatDateTimeFull, formatTime } from "@/src/lib/utils/test-drive-format";
import type { TestDriveStatus } from "@/src/lib/types/test-drive";

interface TestDriveCheckInCardProps {
  status: TestDriveStatus;
  checkedInAt: string | null;
  checkedInByName?: string | null;
  /** Whether the current user is allowed to check customers in. */
  canCheckIn: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  onCheckIn?: () => void;
}

export function TestDriveCheckInCard({
  status,
  checkedInAt,
  checkedInByName,
  canCheckIn,
  isLoading,
  errorMessage,
  onCheckIn,
}: TestDriveCheckInCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isConfirmed = status === "Approved" || status === "Rescheduled";

  return (
    <div className="surface-card flex flex-col gap-3 p-4">
      <p className="text-label">Customer Arrival</p>

      {checkedInAt ? (
        <div
          className="flex items-center gap-3 text-[var(--omc-status-text)]"
          style={{ "--omc-status-raw": "#34d399" } as React.CSSProperties}
        >
          <motion.span
            initial={prefersReducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15"
          >
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </motion.span>
          <div className="min-w-0" role="status">
            <p className="text-body-sm font-medium">Customer checked in</p>
            <p className="text-caption text-text-muted">
              <time dateTime={checkedInAt} title={formatDateTimeFull(checkedInAt)}>
                {formatTime(checkedInAt)}
              </time>
              {checkedInByName && ` · by ${checkedInByName}`}
            </p>
          </div>
        </div>
      ) : isConfirmed ? (
        canCheckIn ? (
          <>
            <p className="text-body-sm text-text-muted">
              Press check in when the customer arrives. The arrival time and your name are recorded
              automatically.
            </p>
            <div>
              <Button
                type="button"
                leftIcon={<LogIn className="size-4" />}
                isLoading={isLoading}
                onClick={onCheckIn}
              >
                Check In Customer
              </Button>
            </div>
          </>
        ) : (
          <p className="text-body-sm text-text-muted">
            You don&apos;t have permission to check in customers.
          </p>
        )
      ) : status === "Pending" ? (
        <p className="text-body-sm text-text-muted">Check-in opens once this appointment is approved.</p>
      ) : (
        <p className="text-body-sm text-text-muted">
          This appointment is {status.toLowerCase()}, so check-in is closed.
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
