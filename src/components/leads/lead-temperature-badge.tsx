import { Flame, Thermometer, Snowflake, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { LeadTemperature } from "@/src/lib/types/lead";

interface LeadTemperatureBadgeProps {
  temperature: LeadTemperature;
  className?: string;
}

const CONFIG: Record<LeadTemperature, { icon: LucideIcon; raw: string }> = {
  Hot: { icon: Flame, raw: "#f87171" },
  Warm: { icon: Thermometer, raw: "#f59e0b" },
  Cold: { icon: Snowflake, raw: "#38bdf8" },
};

export function LeadTemperatureBadge({ temperature, className }: LeadTemperatureBadgeProps) {
  const { icon: Icon, raw } = CONFIG[temperature];

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
      {temperature}
    </span>
  );
}
