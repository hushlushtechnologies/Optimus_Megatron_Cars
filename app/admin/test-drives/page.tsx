import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTestDriveMetrics } from "@/src/lib/supabase/test-drive-metrics";
import { getTestDriveRows } from "@/src/lib/supabase/test-drive-queries";
import {
  EMPTY_TEST_DRIVE_FILTER_LOOKUPS_RESULT,
  getTestDriveFilterLookups,
} from "@/src/lib/supabase/test-drive-filter-lookups";
import {
  getTestDriveCalendarFilterOptions,
  getTestDriveCalendarRows,
} from "@/src/lib/supabase/test-drive-calendar-queries";
import { currentUserTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import { TEST_DRIVE_VIEW_COOKIE, type TestDriveView } from "@/src/lib/utils/test-drive-view";
import { DEFAULT_TEST_DRIVE_SORT, parseTestDriveListParams } from "@/src/lib/utils/test-drive-list-params";
import { buildTestDriveListSearchParams } from "@/src/lib/utils/test-drive-list-filters";
import { parseCalendarParams } from "@/src/lib/utils/test-drive-calendar";
import { TestDrivesPageClient } from "@/src/components/test-drives/test-drives-page-client";
import type { TestDriveCalendarFilterOptions } from "@/src/lib/types/test-drive";

export const maxDuration = 60;

interface TestDrivesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const NO_FILTER_OPTIONS: TestDriveCalendarFilterOptions = { showrooms: [], staff: [] };

export default async function TestDrivesPage({ searchParams }: TestDrivesPageProps) {
  const params = await searchParams;
  const { page, pageSize, sort, search, filters, archived } = parseTestDriveListParams(params);
  const calendarParams = parseCalendarParams(params);

  const cookieStore = await cookies();
  // The server knows the chosen view from a cookie, so only that view's data is fetched.
  const view: TestDriveView =
    cookieStore.get(TEST_DRIVE_VIEW_COOKIE)?.value === "calendar" ? "calendar" : "table";

  const [metrics, tableResult, filterLookupsResult, calendarResult, calendarFilterOptions, permissions] =
    await Promise.all([
      getTestDriveMetrics(),
      view === "table"
        ? getTestDriveRows({ page, pageSize, sort, search, filters, archived })
        : Promise.resolve(null),
      view === "table"
        ? getTestDriveFilterLookups(filters.vehicle)
        : Promise.resolve(EMPTY_TEST_DRIVE_FILTER_LOOKUPS_RESULT),
      view === "calendar" ? getTestDriveCalendarRows(calendarParams) : Promise.resolve(null),
      view === "calendar" ? getTestDriveCalendarFilterOptions() : Promise.resolve(NO_FILTER_OPTIONS),
      currentUserTestDrivePermissions(),
    ]);

  // Past the last page (for example after the list shrank): jump to the real last one,
  // keeping the search, sort and every filter.
  if (tableResult && tableResult.totalCount > 0 && page > Math.ceil(tableResult.totalCount / pageSize)) {
    const lastPage = Math.ceil(tableResult.totalCount / pageSize);
    const query = buildTestDriveListSearchParams({
      page: lastPage,
      pageSize,
      sort,
      defaultSort: DEFAULT_TEST_DRIVE_SORT,
      search,
      filters,
      archived,
    });
    redirect(`/admin/test-drives?${query.toString()}`);
  }

  return (
    <TestDrivesPageClient
      metrics={metrics}
      initialView={view}
      tableData={tableResult}
      tableLoadFailed={view === "table" && tableResult === null}
      page={page}
      pageSize={pageSize}
      filterLookups={filterLookupsResult.lookups}
      filterLookupsFailed={filterLookupsResult.failed}
      calendarData={calendarResult}
      calendarLoadFailed={view === "calendar" && calendarResult === null}
      calendarParams={calendarParams}
      calendarFilterOptions={calendarFilterOptions}
      permissions={permissions}
    />
  );
}
