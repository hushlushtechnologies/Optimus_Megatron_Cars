"use client";

import { Timer } from "lucide-react";
import { useMinuteClock } from "@/src/hooks/use-minute-clock";
import { describeTimeLeft, type ExpiryTone } from "@/src/lib/utils/sales-format";
import { cn } from "@/src/lib/utils/cn";

const TONE: Record<ExpiryTone, string> = {
  calm: "border-border text-text-muted",
  soon: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  urgent: "border-red-500/40 bg-red-500/10 text-red-400",
  expired: "border-red-500/40 bg-red-500/10 text-red-400",
};

/** Time left on the reservation holding this vehicle. Renders nothing when there is no active hold. */
export function SalesExpiryChip({
  expiresAt,
  reservationStatus,
}: {
  expiresAt: string | null;
  reservationStatus: string | null;
}) {
  const now = useMinuteClock();
  if (!expiresAt || reservationStatus !== "Confirmed" || now === 0) return null;

  const { label, tone } = describeTimeLeft(Date.parse(expiresAt), now);

  return (
    <span
      className={cn(
        "text-caption inline-flex items-center gap-1 rounded-full border px-2 py-0.5 tabular-nums",
        TONE[tone],
      )}
    >
      <Timer className="size-3" aria-hidden="true" />
      <span className="sr-only">Reservation: </span>
      {label}
    </span>
  );
}
