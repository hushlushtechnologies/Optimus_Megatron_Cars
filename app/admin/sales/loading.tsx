import { Skeleton } from "@/src/components/ui/skeleton";

export default function SalesLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading sales">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full max-w-md" />
      <div className="surface-card flex flex-col gap-4 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
