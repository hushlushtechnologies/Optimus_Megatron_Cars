import { createClient } from "@/src/lib/supabase/server";

import type { SupabaseServerClient } from "@/src/lib/supabase/test-drive-action-helpers";

import type { TestDriveListRow, TestDriveSort } from "@/src/lib/types/test-drive";

import {
  EMPTY_TEST_DRIVE_FILTERS,
  UNASSIGNED_STAFF,
  cleanSearchTerm,
  phoneDigitsForSearch,
  type TestDriveListFilters,
} from "@/src/lib/utils/test-drive-list-filters";

/* =========================================================
   LIST COLUMNS
========================================================= */

export const LIST_COLUMNS = [
  "id",
  "test_drive_number",
  "status",
  "scheduled_start",
  "scheduled_end",
  "duration_minutes",
  "created_at",
  "updated_at",
  "checked_in_at",
  "customer_id",
  "customer_name",
  "customer_number",
  "customer_photo_url",
  "car_id",
  "vehicle_title",
  "stock_id",
  "brand_name",
  "model_name",
  "location_id",
  "location_name",
  "assigned_staff_id",
  "staff_name",
  "lead_id",
  "lead_number",
  "request_source_name",
].join(", ");

/* =========================================================
   SORT MAP
========================================================= */

export const SORT_MAP: Record<
  TestDriveSort,
  {
    column: string;
    ascending: boolean;
  }
> = {
  upcoming: {
    column: "upcoming_sort_key",

    ascending: true,
  },

  newest: {
    column: "created_at",

    ascending: false,
  },

  oldest: {
    column: "created_at",

    ascending: true,
  },

  "recently-updated": {
    column: "updated_at",

    ascending: false,
  },

  "date-asc": {
    column: "scheduled_start",

    ascending: true,
  },

  "date-desc": {
    column: "scheduled_start",

    ascending: false,
  },
};

/* =========================================================
   QUERY OPTIONS
========================================================= */

export interface TestDriveListQueryOptions {
  columns: string;

  search?: string;

  filters?: TestDriveListFilters;

  /**
   * false (default):
   * active rows only.
   *
   * true:
   * archived rows only.
   */
  archived?: boolean;

  /**
   * Ask Supabase for the
   * exact total row count.
   */
  count?: boolean;
}

/* =========================================================
   BASE LIST QUERY
========================================================= */

/**
 * Central place that converts Test Drive
 * search/filter/archive state into a query
 * against `test_drive_list`.
 *
 * This intentionally does not apply
 * ordering or pagination so the same
 * query can be reused for:
 *
 * - table rows
 * - exports
 * - bulk actions
 */
export function buildTestDriveListQuery(
  supabase: SupabaseServerClient,

  options: TestDriveListQueryOptions,
) {
  const {
    columns,
    search = "",
    filters = EMPTY_TEST_DRIVE_FILTERS,
    archived = false,
    count = false,
  } = options;

  let query = supabase.from("test_drive_list").select(
    columns,
    count
      ? {
          count: "exact",
        }
      : undefined,
  );

  /* =========================================================
     ARCHIVE STATE
  ========================================================= */

  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  /* =========================================================
     SEARCH
  ========================================================= */

  const term = cleanSearchTerm(search);

  if (term) {
    const like = `%${term}%`;

    const clauses = [
      `test_drive_number.ilike."${like}"`,
      `customer_name.ilike."${like}"`,
      `customer_number.ilike."${like}"`,
      `vehicle_title.ilike."${like}"`,
      `stock_id.ilike."${like}"`,
    ];

    const digits = phoneDigitsForSearch(term);

    if (digits) {
      clauses.push(`customer_phone_digits.ilike."%${digits}%"`);
    }

    query = query.or(clauses.join(","));
  }

  /* =========================================================
     STATUS
  ========================================================= */

  if (filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  /* =========================================================
     SHOWROOM
  ========================================================= */

  if (filters.showroom) {
    query = query.eq("location_id", filters.showroom);
  }

  /* =========================================================
     STAFF
  ========================================================= */

  if (filters.staff === UNASSIGNED_STAFF) {
    query = query.is("assigned_staff_id", null);
  } else if (filters.staff) {
    query = query.eq("assigned_staff_id", filters.staff);
  }

  /* =========================================================
     DATE RANGE
  ========================================================= */

  if (filters.from) {
    query = query.gte("scheduled_day", filters.from);
  }

  if (filters.to) {
    query = query.lte("scheduled_day", filters.to);
  }

  /* =========================================================
     BRAND
  ========================================================= */

  if (filters.brand) {
    query = query.eq("brand_id", filters.brand);
  }

  /* =========================================================
     MODEL
  ========================================================= */

  if (filters.model) {
    query = query.eq("model_id", filters.model);
  }

  /* =========================================================
     VEHICLE
  ========================================================= */

  if (filters.vehicle) {
    query = query.eq("car_id", filters.vehicle);
  }

  /* =========================================================
     SOURCE
  ========================================================= */

  if (filters.source) {
    query = query.eq("request_source_id", filters.source);
  }

  /* =========================================================
     LEAD
  ========================================================= */

  if (filters.lead === "linked") {
    query = query.not("lead_id", "is", null);
  }

  if (filters.lead === "none") {
    query = query.is("lead_id", null);
  }

  /* =========================================================
     CHECK-IN
  ========================================================= */

  if (filters.checkedIn === "yes") {
    query = query.not("checked_in_at", "is", null);
  }

  if (filters.checkedIn === "no") {
    query = query.is("checked_in_at", null);
  }

  return query;
}

/* =========================================================
   GET TABLE ROWS
========================================================= */

interface GetTestDriveRowsParams {
  page: number;

  pageSize: number;

  sort: TestDriveSort;

  search?: string;

  filters?: TestDriveListFilters;

  archived: boolean;
}

/**
 * Returns null rather than an empty
 * result when the Supabase query fails,
 * allowing the page to render its
 * dedicated error state.
 */
export async function getTestDriveRows({
  page,
  pageSize,
  sort,
  search,
  filters,
  archived,
}: GetTestDriveRowsParams): Promise<{
  rows: TestDriveListRow[];

  totalCount: number;
} | null> {
  const supabase = await createClient();

  /* =========================================================
     PAGINATION
  ========================================================= */

  const from = (page - 1) * pageSize;

  const to = from + pageSize - 1;

  const sortConfig = SORT_MAP[sort];

  /* =========================================================
     QUERY
  ========================================================= */

  /*
   * The extra created_at + id sorting
   * makes pagination deterministic.
   *
   * Without stable fallback sorting,
   * rows tied on the selected sort value
   * can repeat or disappear across pages.
   */
  const { data, error, count } = await buildTestDriveListQuery(supabase, {
    columns: LIST_COLUMNS,

    search,

    filters,

    archived,

    count: true,
  })
    .order(sortConfig.column, {
      ascending: sortConfig.ascending,
    })
    .order("created_at", {
      ascending: false,
    })
    .order("id", {
      ascending: true,
    })
    .range(from, to);

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    console.error("getTestDriveRows error:", error);

    return null;
  }

  /* =========================================================
     RESULT
  ========================================================= */

  return {
    rows: (data ?? []) as unknown as TestDriveListRow[],

    totalCount: count ?? 0,
  };
}
