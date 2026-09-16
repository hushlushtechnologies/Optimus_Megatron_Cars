import { Skeleton } from "@/src/components/ui/skeleton";
import { Card } from "@/src/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-64 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="flat" className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-full" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card variant="flat" className="xl:col-span-7">
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card variant="flat" className="xl:col-span-5">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}
