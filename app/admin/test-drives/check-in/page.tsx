import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { currentUserTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import { getTodaysArrivals } from "@/src/lib/supabase/test-drive-arrivals-queries";
import { getTestDriveCalendarFilterOptions } from "@/src/lib/supabase/test-drive-calendar-queries";
import { formatDayLong } from "@/src/lib/utils/test-drive-format";
import { CheckInDeskClient } from "@/src/components/test-drives/check-in/check-in-desk-client";

interface CheckInDeskPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="surface-card flex max-w-2xl items-start gap-3 p-5">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
      <div>
        <p className="text-body-sm text-text-primary font-medium">{title}</p>
        <div className="text-body-sm text-text-muted mt-1">{children}</div>
        <Link
          href="/admin/test-drives"
          className="text-body-sm text-primary-text hover:text-primary-hover mt-3 inline-block"
        >
          Back to Test Drives
        </Link>
      </div>
    </div>
  );
}

export default async function CheckInDeskPage({ searchParams }: CheckInDeskPageProps) {
  const permissions = await currentUserTestDrivePermissions();
  if (!permissions.checkIn) {
    return (
      <Notice title="You don't have permission to check customers in.">
        Ask an administrator if you need access.
      </Notice>
    );
  }

  const params = await searchParams;
  const [result, filterOptions] = await Promise.all([
    getTodaysArrivals({ search: params.q, showroomId: params.showroom }),
    getTestDriveCalendarFilterOptions(),
  ]);

  if (!result) {
    return (
      <Notice title="Today's appointments couldn't be loaded.">
        Nothing has been lost. Refresh the page to try again, and let someone know if it keeps happening.
      </Notice>
    );
  }

  return (
    <CheckInDeskClient
      arrivals={result.arrivals}
      opensBefore={result.opensBefore}
      showrooms={filterOptions.showrooms}
      initialSearch={params.q ?? ""}
      showroomId={params.showroom ?? ""}
      todayLabel={formatDayLong(new Date())}
    />
  );
}
