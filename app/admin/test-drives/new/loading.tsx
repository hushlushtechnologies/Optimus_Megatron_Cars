import { Skeleton } from "@/src/components/ui/skeleton";

export default function NewTestDriveLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading form">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <Skeleton className="hidden h-72 w-full xl:block" />
      </div>
    </div>
  );
}
