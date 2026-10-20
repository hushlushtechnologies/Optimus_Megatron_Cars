import { MetricCard } from "@/src/components/shared/metric-card";
import { Skeleton } from "@/src/components/ui/skeleton";

const LABELS = ["Total Requests", "Pending", "Approved", "Today", "Completed", "Cancelled"];

export default function TestDrivesLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading test drives">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {LABELS.map((label) => (
          <MetricCard key={label} label={label} value={0} isLoading />
        ))}
      </div>

      <Skeleton className="h-96 w-full" />
    </div>
  );
}
