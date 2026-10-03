import { cn } from "@/src/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "flat" = static content, "elevated" = hoverable/interactive card */
  variant?: "flat" | "elevated";
  padding?: "sm" | "md" | "lg" | "no";
}

const paddingMap = {
  no: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export function Card({ className, variant = "flat", padding = "md", ...props }: CardProps) {
  return (
    <div
      className={cn(
        variant === "elevated" ? "surface-card-elevated" : "surface-card",
        paddingMap[padding],
        className,
      )}
      {...props}
    />
  );
}
