import { SALES_DEAL_STATUSES, type SalesDealStatus } from "@/src/lib/types/sales";
import { readParam } from "@/src/lib/utils/test-drive-list-filters";

export const UNASSIGNED_OWNER = "unassigned";

export type BalanceFilter = "outstanding" | "settled";

export interface SalesListFilters {
  status: SalesDealStatus[];
  showroom: string | null;
  /** An owner id, or "unassigned". */
  owner: string | null;
  brand: string | null;
  customer: string | null;
  vehicle: string | null;
  /** YYYY-MM-DD, Dubai day the deal was created. */
  from: string | null;
  to: string | null;
  balance: BalanceFilter | null;
}

export const EMPTY_SALES_FILTERS: SalesListFilters = {
  status: [],
  showroom: null,
  owner: null,
  brand: null,
  customer: null,
  vehicle: null,
  from: null,
  to: null,
  balance: null,
};

export const SALES_FILTER_PARAM_KEYS = [
  "status",
  "showroom",
  "owner",
  "brand",
  "customer",
  "vehicle",
  "from",
  "to",
  "balance",
] as const;

export interface SalesFilterCustomerOption {
  id: string;
  full_name: string;
  customer_number: string;
}

export interface SalesFilterVehicleOption {
  id: string;
  display_title: string;
  stock_id: string;
  brand_name: string | null;
}

type RawParams = Record<string, string | string[] | undefined>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function asUuid(value: string): string | null {
  return UUID_RE.test(value) ? value.toLowerCase() : null;
}

function asIsoDate(value: string): string | null {
  if (!DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

/** Turns raw URL values into safe filters. Anything invalid is dropped. */
export function parseSalesFilters(params: RawParams): SalesListFilters {
  const requested = new Set(
    readParam(params, "status")
      .split(",")
      .map((value) => value.trim()),
  );

  let from = asIsoDate(readParam(params, "from"));
  let to = asIsoDate(readParam(params, "to"));
  if (from && to && from > to) [from, to] = [to, from];

  const ownerRaw = readParam(params, "owner");
  const balanceRaw = readParam(params, "balance");

  return {
    status: SALES_DEAL_STATUSES.filter((status) => requested.has(status)),
    showroom: asUuid(readParam(params, "showroom")),
    owner: ownerRaw === UNASSIGNED_OWNER ? UNASSIGNED_OWNER : asUuid(ownerRaw),
    brand: asUuid(readParam(params, "brand")),
    customer: asUuid(readParam(params, "customer")),
    vehicle: asUuid(readParam(params, "vehicle")),
    from,
    to,
    balance: balanceRaw === "outstanding" || balanceRaw === "settled" ? balanceRaw : null,
  };
}

/** One per status, one for the date range, one for each other filter. Matches the chips. */
export function countActiveSalesFilters(filters: SalesListFilters): number {
  return (
    filters.status.length +
    (filters.from || filters.to ? 1 : 0) +
    [
      filters.showroom,
      filters.owner,
      filters.brand,
      filters.customer,
      filters.vehicle,
      filters.balance,
    ].filter(Boolean).length
  );
}

export function salesFiltersKey(filters: SalesListFilters): string {
  return JSON.stringify([
    filters.status,
    filters.showroom,
    filters.owner,
    filters.brand,
    filters.customer,
    filters.vehicle,
    filters.from,
    filters.to,
    filters.balance,
  ]);
}

export function writeSalesFiltersToParams(params: URLSearchParams, filters: SalesListFilters) {
  SALES_FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
  if (filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.showroom) params.set("showroom", filters.showroom);
  if (filters.owner) params.set("owner", filters.owner);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.customer) params.set("customer", filters.customer);
  if (filters.vehicle) params.set("vehicle", filters.vehicle);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.balance) params.set("balance", filters.balance);
}
