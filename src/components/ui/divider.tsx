import { cn } from "@/src/lib/utils/cn";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("bg-border w-px self-stretch", className)}
      />
    );
  }

  if (label) {
    return (
      <div role="separator" className={cn("text-label flex items-center gap-3", className)}>
        <span className="bg-border h-px flex-1" />
        {label}
        <span className="bg-border h-px flex-1" />
      </div>
    );
  }

  return <div role="separator" className={cn("bg-border h-px w-full", className)} />;
}
