import { Flame, Scale, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveInterest } from "@/src/lib/types/test-drive";

// The interest is always written out, so colour is never the only signal.
const META: Record<TestDriveInterest, { icon: LucideIcon; raw: string }> = {
  "Very Interested": { icon: Flame, raw: "#34d399" },
  Interested: { icon: ThumbsUp, raw: "#38bdf8" },
  Considering: { icon: Scale, raw: "#f59e0b" },
  "Not Interested": { icon: ThumbsDown, raw: "#94a3b8" },
};

export function InterestBadge({ level, className }: { level: TestDriveInterest; className?: string }) {
  const { icon: Icon, raw } = META[level];

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
      {level}
    </span>
  );
}
