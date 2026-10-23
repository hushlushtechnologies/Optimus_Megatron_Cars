import type { TestDriveSort } from "@/src/lib/types/test-drive";
import {
  parseTestDriveFilters,
  readParam,
  type TestDriveListFilters,
} from "@/src/lib/utils/test-drive-list-filters";

export const TEST_DRIVE_PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_TEST_DRIVE_PAGE_SIZE = 25;
export const DEFAULT_TEST_DRIVE_SORT: TestDriveSort = "upcoming";

const VALID_SORTS: TestDriveSort[] = [
  "upcoming",
  "newest",
  "oldest",
  "recently-updated",
  "date-asc",
  "date-desc",
];

export interface TestDriveListParams {
  page: number;
  pageSize: number;
  sort: TestDriveSort;
  search: string;
  filters: TestDriveListFilters;
  archived: boolean;
}

/** Turns raw URL values into safe ones: junk becomes the default instead of an error. */
export function parseTestDriveListParams(
  params: Record<string, string | string[] | undefined>,
): TestDriveListParams {
  const page = Math.max(1, Math.floor(Number(readParam(params, "page"))) || 1);

  const requestedSize = Math.floor(Number(readParam(params, "pageSize")));
  const pageSize = TEST_DRIVE_PAGE_SIZES.includes(requestedSize)
    ? requestedSize
    : DEFAULT_TEST_DRIVE_PAGE_SIZE;

  const requestedSort = readParam(params, "sort");
  const sort = VALID_SORTS.includes(requestedSort as TestDriveSort)
    ? (requestedSort as TestDriveSort)
    : DEFAULT_TEST_DRIVE_SORT;

  return {
    page,
    pageSize,
    sort,
    search: readParam(params, "q").slice(0, 100),
    filters: parseTestDriveFilters(params),
    archived: readParam(params, "archived") === "true",
  };
}
