import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-body-sm font-medium",
  {
    variants: {
      status: {
        neutral: "bg-card-hover text-text-muted border border-border",
        success:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20",
        info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, status, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)} {...props}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "success" && "bg-emerald-400",
          status === "warning" && "bg-amber-400",
          status === "danger" && "bg-red-400",
          status === "info" && "bg-blue-400",
          (status === "neutral" || !status) && "bg-text-muted",
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
