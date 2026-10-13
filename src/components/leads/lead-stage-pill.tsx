import { cn } from "@/src/lib/utils/cn";

interface LeadStagePillProps {
  name: string;
  colorHex: string;
  className?: string;
}

export function LeadStagePill({ name, colorHex, className }: LeadStagePillProps) {
  return (
    <span
      className={cn(
        "text-body-sm inline-flex items-center rounded-full border px-2.5 py-1 text-[var(--omc-status-text)]",
        className,
      )}
      style={
        {
          "--omc-status-raw": colorHex,
          backgroundColor: `${colorHex}1A`,
          borderColor: `${colorHex}66`,
        } as React.CSSProperties
      }
    >
      {name}
    </span>
  );
}
