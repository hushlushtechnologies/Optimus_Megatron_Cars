import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";
import type { LeadStage } from "@/src/lib/types/lead";

interface LeadStageColumnProps {
  stage: LeadStage;
  count: number;
  totalValue?: number;
  children: ReactNode;
  className?: string;
}

export function LeadStageColumn({ stage, count, totalValue, children, className }: LeadStageColumnProps) {
  return (
    <div
      className={cn(
        "border-border bg-card-hover/40 flex w-72 shrink-0 flex-col gap-3 rounded-lg border p-2.5",
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
          <p className="text-label text-text-primary">{stage.name}</p>
        </div>
        <span className="bg-card text-caption text-text-muted rounded-full px-2 py-0.5">{count}</span>
      </div>

      {totalValue !== undefined && totalValue > 0 && (
        <p className="text-caption text-text-subtle px-1">AED {totalValue.toLocaleString()}</p>
      )}

      <div className="flex flex-col gap-2.5 overflow-y-auto">{children}</div>
    </div>
  );
}
