"use client";

import { AlertTriangle, CheckCircle2, CircleHelp, Loader2, XCircle, type LucideIcon } from "lucide-react";
import { Tooltip } from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils/cn";

export type AvailabilityState = "available" | "unavailable" | "conflict" | "checking" | "unknown";

const META: Record<AvailabilityState, { icon: LucideIcon; raw: string; text: string }> = {
  available: { icon: CheckCircle2, raw: "#34d399", text: "Available" },
  unavailable: { icon: XCircle, raw: "#f87171", text: "Unavailable" },
  conflict: { icon: AlertTriangle, raw: "#f59e0b", text: "Conflict" },
  checking: { icon: Loader2, raw: "#94a3b8", text: "Checking…" },
  unknown: { icon: CircleHelp, raw: "#94a3b8", text: "Not checked yet" },
};

interface AvailabilityIndicatorProps {
  state: AvailabilityState;
  /** What is being checked, e.g. "Vehicle" or "Staff". */
  label: string;
  /** Plain-language explanation, e.g. "Booked 11:00 to 12:00 for another customer". */
  detail?: string;
  /** Optional tooltip explaining what this check means. */
  help?: string;
  className?: string;
}

export function AvailabilityIndicator({ state, label, detail, help, className }: AvailabilityIndicatorProps) {
  const { icon: Icon, raw, text } = META[state];

  const content = (
    <div
      role="status"
      aria-live="polite"
      tabIndex={help ? 0 : undefined}
      className={cn(
        "focus-visible:ring-primary flex items-start gap-2 rounded-md focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
      style={{ "--omc-status-raw": raw } as React.CSSProperties}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0 text-[var(--omc-status-text)]",
          state === "checking" && "motion-safe:animate-spin",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-body-sm text-text-primary">
          {label}: <span className="font-medium text-[var(--omc-status-text)]">{text}</span>
        </p>
        {detail && <p className="text-caption text-text-muted">{detail}</p>}
      </div>
    </div>
  );

  return help ? <Tooltip content={help}>{content}</Tooltip> : content;
}
