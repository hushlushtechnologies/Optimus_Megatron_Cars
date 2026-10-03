import { cn } from "@/src/lib/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden="true" className={cn("bg-card-hover animate-pulse rounded-md", className)} {...props} />
  );
}
