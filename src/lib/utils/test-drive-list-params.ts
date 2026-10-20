import type { TestDriveSort } from "@/src/lib/types/test-drive";

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
}

/** Turns raw URL values into safe ones: junk becomes the default instead of an error. */
export function parseTestDriveListParams(params: Record<string, string | undefined>): TestDriveListParams {
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const requestedSize = Math.floor(Number(params.pageSize));
  const pageSize = TEST_DRIVE_PAGE_SIZES.includes(requestedSize)
    ? requestedSize
    : DEFAULT_TEST_DRIVE_PAGE_SIZE;

  const sort = VALID_SORTS.includes(params.sort as TestDriveSort)
    ? (params.sort as TestDriveSort)
    : DEFAULT_TEST_DRIVE_SORT;

  return { page, pageSize, sort };
}
