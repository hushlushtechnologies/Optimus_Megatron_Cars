import type { SalesSort, SalesView } from "@/src/lib/types/sales-list";
import {
  parseSalesFilters,
  writeSalesFiltersToParams,
  type SalesListFilters,
} from "@/src/lib/utils/sales-list-filters";
import { readParam } from "@/src/lib/utils/test-drive-list-filters";

export const SALES_PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_SALES_PAGE_SIZE = 25;
export const DEFAULT_SALES_SORT: SalesSort = "recently-updated";
export const DEFAULT_SALES_VIEW: SalesView = "table";

const VALID_SORTS: SalesSort[] = [
  "recently-updated",
  "newest",
  "oldest",
  "value-desc",
  "value-asc",
  "balance-desc",
];
const VALID_VIEWS: SalesView[] = ["table", "grid", "board"];

export interface SalesListParams {
  page: number;
  pageSize: number;
  sort: SalesSort;
  view: SalesView;
  search: string;
  filters: SalesListFilters;
}

export function parseSalesListParams(params: Record<string, string | string[] | undefined>): SalesListParams {
  const page = Math.max(1, Math.floor(Number(readParam(params, "page"))) || 1);

  const requestedSize = Math.floor(Number(readParam(params, "pageSize")));
  const pageSize = SALES_PAGE_SIZES.includes(requestedSize) ? requestedSize : DEFAULT_SALES_PAGE_SIZE;

  const requestedSort = readParam(params, "sort");
  const sort = VALID_SORTS.includes(requestedSort as SalesSort)
    ? (requestedSort as SalesSort)
    : DEFAULT_SALES_SORT;

  const requestedView = readParam(params, "view");
  const view = VALID_VIEWS.includes(requestedView as SalesView)
    ? (requestedView as SalesView)
    : DEFAULT_SALES_VIEW;

  return {
    page,
    pageSize,
    sort,
    view,
    search: readParam(params, "q").slice(0, 100),
    filters: parseSalesFilters(params),
  };
}

/** The full list URL for a page, keeping view, search, sort and every filter. */
export function buildSalesListSearchParams(input: SalesListParams): URLSearchParams {
  const params = new URLSearchParams({ page: String(input.page), pageSize: String(input.pageSize) });
  if (input.sort !== DEFAULT_SALES_SORT) params.set("sort", input.sort);
  if (input.view !== DEFAULT_SALES_VIEW) params.set("view", input.view);
  if (input.search) params.set("q", input.search);
  writeSalesFiltersToParams(params, input.filters);
  return params;
}
