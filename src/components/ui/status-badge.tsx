import { cn } from "@/src/lib/utils/cn";

interface StatusBadgeProps {
  label: string;
  colorHex: string;
  className?: string;
}

export function StatusBadge({ label, colorHex, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        "text-(--omc-status-text)",
        className,
      )}
      style={
        {
          "--omc-status-raw": colorHex,
          backgroundColor: `${colorHex}1A`,
          borderColor: `${colorHex}33`,
        } as React.CSSProperties
      }
    >
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
      {label}
    </span>
  );
}
