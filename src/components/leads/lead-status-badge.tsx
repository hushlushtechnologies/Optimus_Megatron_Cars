import { Circle, Trophy, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { StageType } from "@/src/lib/types/lead";

interface LeadStatusBadgeProps {
  stageType: StageType;
  className?: string;
}

const CONFIG: Record<StageType, { icon: LucideIcon; label: string; raw: string }> = {
  open: { icon: Circle, label: "Open", raw: "#94a3b8" },
  won: { icon: Trophy, label: "Won", raw: "#34d399" },
  lost: { icon: XCircle, label: "Lost", raw: "#f87171" },
};

export function LeadStatusBadge({ stageType, className }: LeadStatusBadgeProps) {
  const { icon: Icon, label, raw } = CONFIG[stageType];

  return (
    <span
      className={cn(
        "text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[var(--omc-status-text)]",
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
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
