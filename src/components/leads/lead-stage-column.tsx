import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";
import type { LeadStage } from "@/src/lib/types/lead";

interface LeadStageColumnProps {
  stage: LeadStage;
  count: number;
  totalValue?: number;
  /** Shown under the cards, e.g. "Showing 25 of 140". */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function LeadStageColumn({
  stage,
  count,
  totalValue,
  footer,
  children,
  className,
}: LeadStageColumnProps) {
  const headingId = `stage-heading-${stage.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "border-border bg-card-hover/40 flex w-[85vw] max-w-72 shrink-0 snap-start flex-col gap-3 rounded-lg border p-2.5 sm:w-72",
        className,
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: stage.color_hex }}
          />
          <h3 id={headingId} className="text-label text-text-primary">
            {stage.name}
          </h3>
        </div>
        <span className="bg-card text-caption text-text-muted rounded-full px-2 py-0.5">
          <span className="sr-only">
            {count} {count === 1 ? "lead" : "leads"}
          </span>
          <span aria-hidden="true">{count.toLocaleString()}</span>
        </span>
      </div>

      {totalValue !== undefined && totalValue > 0 && (
        <p className="text-caption text-text-subtle px-1">AED {totalValue.toLocaleString()}</p>
      )}

      <div className="flex flex-col gap-2.5 lg:max-h-[calc(100vh-24rem)] lg:overflow-y-auto">{children}</div>

      {footer}
    </section>
  );
}
