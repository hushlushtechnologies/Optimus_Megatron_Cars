import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}

export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2
        className={cn("animate-spin text-primary", sizeMap[size], className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
