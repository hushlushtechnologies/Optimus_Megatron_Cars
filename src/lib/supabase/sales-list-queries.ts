import { createClient } from "@/src/lib/supabase/server";
import type { SalesSupabaseClient } from "@/src/lib/supabase/sales-permissions";
import type { SalesDealStatus } from "@/src/lib/types/sales";
import type { SalesBoardColumn, SalesListRow, SalesSort, SalesSummary } from "@/src/lib/types/sales-list";
import {
  EMPTY_SALES_FILTERS,
  UNASSIGNED_OWNER,
  type SalesListFilters,
} from "@/src/lib/utils/sales-list-filters";
import { cleanSearchTerm, phoneDigitsForSearch } from "@/src/lib/utils/test-drive-list-filters";

export const SALES_LIST_COLUMNS = [
  "id",
  "deal_number",
  "status",
  "created_at",
  "updated_at",
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
  "owner_id",
  "owner_name",
  "lead_id",
  "lead_number",
  "reservation_id",
  "reservation_number",
  "reservation_expires_at",
  "reservation_status",
  "currency",
  "listed_price",
  "proposed_price",
  "discount_amount",
  "agreed_price",
  "total_due",
  "verified_paid",
  "awaiting_verification",
  "balance_due",
].join(", ");

export const SALES_SORT_MAP: Record<SalesSort, { column: string; ascending: boolean }> = {
  "recently-updated": { column: "updated_at", ascending: false },
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  "value-desc": { column: "agreed_price", ascending: false },
  "value-asc": { column: "agreed_price", ascending: true },
  "balance-desc": { column: "balance_due", ascending: false },
};

export const BOARD_STATUSES: SalesDealStatus[] = ["Draft", "Negotiation", "Reserved", "Confirmed"];
export const BOARD_COLUMN_LIMIT = 20;

interface SalesListQueryOptions {
  columns: string;
  search?: string;
  filters?: SalesListFilters;
  count?: boolean;
}

/**
 * The one place that turns search and filters into a query on sales_deal_list.
 * It returns the query without ordering or paging, so the table, board, exports and
 * bulk actions can each add their own.
 */
export function buildSalesListQuery(supabase: SalesSupabaseClient, options: SalesListQueryOptions) {
  const { columns, search = "", filters = EMPTY_SALES_FILTERS, count = false } = options;

  let query = supabase.from("sales_deal_list").select(columns, count ? { count: "exact" } : undefined);

  const term = cleanSearchTerm(search);
  if (term) {
    const like = `%${term}%`;
    const clauses = [
      `deal_number.ilike."${like}"`,
      `customer_name.ilike."${like}"`,
      `customer_number.ilike."${like}"`,
      `vehicle_title.ilike."${like}"`,
      `stock_id.ilike."${like}"`,
      `lead_number.ilike."${like}"`,
      `reservation_number.ilike."${like}"`,
    ];
    const digits = phoneDigitsForSearch(term);
    if (digits) clauses.push(`customer_phone_digits.ilike."%${digits}%"`);
    query = query.or(clauses.join(","));
  }

  if (filters.status.length > 0) query = query.in("status", filters.status);
  if (filters.showroom) query = query.eq("location_id", filters.showroom);
  if (filters.owner === UNASSIGNED_OWNER) query = query.is("owner_id", null);
  else if (filters.owner) query = query.eq("owner_id", filters.owner);
  if (filters.brand) query = query.eq("brand_id", filters.brand);
  if (filters.customer) query = query.eq("customer_id", filters.customer);
  if (filters.vehicle) query = query.eq("car_id", filters.vehicle);
  if (filters.from) query = query.gte("created_day", filters.from);
  if (filters.to) query = query.lte("created_day", filters.to);
  if (filters.balance === "outstanding") query = query.gt("balance_due", 0);
  if (filters.balance === "settled") query = query.not("total_due", "is", null).lte("balance_due", 0);

  return query;
}

interface GetSalesRowsParams {
  page: number;
  pageSize: number;
  sort: SalesSort;
  search?: string;
  filters?: SalesListFilters;
}

/** Returns null (not an empty list) when the query fails, so the page can say so. */
export async function getSalesRows({
  page,
  pageSize,
  sort,
  search,
  filters,
}: GetSalesRowsParams): Promise<{ rows: SalesListRow[]; totalCount: number } | null> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const sortConfig = SALES_SORT_MAP[sort];

  const { data, error, count } = await buildSalesListQuery(supabase, {
    columns: SALES_LIST_COLUMNS,
    search,
    filters,
    count: true,
  })
    .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("getSalesRows error:", error);
    return null;
  }
  return { rows: (data ?? []) as unknown as SalesListRow[], totalCount: count ?? 0 };
}

/** One column per open status. Returns null when any column fails to load. */
export async function getSalesBoard(
  search: string,
  filters: SalesListFilters,
): Promise<SalesBoardColumn[] | null> {
  const supabase = await createClient();
  const statuses =
    filters.status.length > 0
      ? BOARD_STATUSES.filter((status) => filters.status.includes(status))
      : BOARD_STATUSES;

  const columns = await Promise.all(
    statuses.map(async (status) => {
      const { data, error, count } = await buildSalesListQuery(supabase, {
        columns: SALES_LIST_COLUMNS,
        search,
        filters: { ...filters, status: [status] },
        count: true,
      })
        .order("updated_at", { ascending: false })
        .order("id", { ascending: true })
        .limit(BOARD_COLUMN_LIMIT);

      if (error) {
        console.error("getSalesBoard error:", error);
        return null;
      }
      return { status, rows: (data ?? []) as unknown as SalesListRow[], total: count ?? 0 };
    }),
  );

  return columns.some((column) => column === null) ? null : (columns as SalesBoardColumn[]);
}

export async function getSalesSummary(): Promise<SalesSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_sales_summary");
  if (error) {
    console.error("getSalesSummary error:", error);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, number | string | null> | undefined;
  if (!row) return null;

  const num = (value: number | string | null | undefined) => Number(value ?? 0);
  return {
    openCount: num(row.open_count),
    reservedCount: num(row.reserved_count),
    confirmedCount: num(row.confirmed_count),
    completedMonthCount: num(row.completed_month_count),
    completedMonthValue: num(row.completed_month_value),
    outstandingBalance: num(row.outstanding_balance),
    pipelineValue: num(row.pipeline_value),
    expiringHolds: num(row.expiring_holds),
  };
}
