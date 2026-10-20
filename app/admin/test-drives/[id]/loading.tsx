import { Skeleton } from "@/src/components/ui/skeleton";
import { TestDriveDetailHeaderSkeleton } from "@/src/components/test-drives/test-drive-detail-header";

export default function TestDriveDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading test drive">
      <Skeleton className="h-5 w-32" />
      <TestDriveDetailHeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    </div>
  );
}
