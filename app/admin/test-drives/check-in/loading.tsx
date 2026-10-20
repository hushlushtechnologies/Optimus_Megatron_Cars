import { Skeleton } from "@/src/components/ui/skeleton";

export default function CheckInDeskLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading check-in desk">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
