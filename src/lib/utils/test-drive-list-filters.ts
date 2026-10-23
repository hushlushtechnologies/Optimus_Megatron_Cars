import type { TestDriveStatus } from "@/src/lib/types/test-drive";

export const TEST_DRIVE_STATUS_OPTIONS: TestDriveStatus[] = [
  "Pending",
  "Approved",
  "Rescheduled",
  "Completed",
  "Cancelled",
  "Rejected",
  "No Show",
];

export const UNASSIGNED_STAFF = "unassigned";

export type LeadLinkFilter = "linked" | "none";
export type CheckInFilter = "yes" | "no";

export interface TestDriveListFilters {
  status: TestDriveStatus[];
  showroom: string | null;
  /** A staff id, or "unassigned". */
  staff: string | null;
  /** YYYY-MM-DD, Dubai day. */
  from: string | null;
  to: string | null;
  brand: string | null;
  model: string | null;
  /** A car id. */
  vehicle: string | null;
  source: string | null;
  lead: LeadLinkFilter | null;
  checkedIn: CheckInFilter | null;
}

export const EMPTY_TEST_DRIVE_FILTERS: TestDriveListFilters = {
  status: [],
  showroom: null,
  staff: null,
  from: null,
  to: null,
  brand: null,
  model: null,
  vehicle: null,
  source: null,
  lead: null,
  checkedIn: null,
};

export const TEST_DRIVE_FILTER_PARAM_KEYS = [
  "status",
  "showroom",
  "staff",
  "from",
  "to",
  "brand",
  "model",
  "vehicle",
  "source",
  "lead",
  "checkedIn",
] as const;

export interface TestDriveFilterVehicleOption {
  id: string;
  display_title: string;
  stock_id: string;
  brand_name: string | null;
}

type RawParams = Record<string, string | string[] | undefined>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** First value of a URL param, trimmed. Repeated params and junk become "". */
export function readParam(params: RawParams, key: string): string {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim() : "";
}

function asUuid(value: string): string | null {
  return UUID_RE.test(value) ? value.toLowerCase() : null;
}

function asIsoDate(value: string): string | null {
  if (!DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

/** Turns raw URL values into safe filters. Anything invalid is dropped. */
export function parseTestDriveFilters(params: RawParams): TestDriveListFilters {
  const requested = new Set(
    readParam(params, "status")
      .split(",")
      .map((value) => value.trim()),
  );
  const status = TEST_DRIVE_STATUS_OPTIONS.filter((option) => requested.has(option));

  let from = asIsoDate(readParam(params, "from"));
  let to = asIsoDate(readParam(params, "to"));
  if (from && to && from > to) [from, to] = [to, from];

  const staffRaw = readParam(params, "staff");
  const leadRaw = readParam(params, "lead");
  const checkedInRaw = readParam(params, "checkedIn");

  return {
    status,
    showroom: asUuid(readParam(params, "showroom")),
    staff: staffRaw === UNASSIGNED_STAFF ? UNASSIGNED_STAFF : asUuid(staffRaw),
    from,
    to,
    brand: asUuid(readParam(params, "brand")),
    model: asUuid(readParam(params, "model")),
    vehicle: asUuid(readParam(params, "vehicle")),
    source: asUuid(readParam(params, "source")),
    lead: leadRaw === "linked" || leadRaw === "none" ? leadRaw : null,
    checkedIn: checkedInRaw === "yes" || checkedInRaw === "no" ? checkedInRaw : null,
  };
}

/** One per status, one for the date range, one for each other filter. Matches the chips. */
export function countActiveTestDriveFilters(filters: TestDriveListFilters): number {
  return (
    filters.status.length +
    (filters.from || filters.to ? 1 : 0) +
    [
      filters.showroom,
      filters.staff,
      filters.brand,
      filters.model,
      filters.vehicle,
      filters.source,
      filters.lead,
      filters.checkedIn,
    ].filter(Boolean).length
  );
}

/** A stable string for comparing two sets of filters. */
export function testDriveFiltersKey(filters: TestDriveListFilters): string {
  return JSON.stringify([
    filters.status,
    filters.showroom,
    filters.staff,
    filters.from,
    filters.to,
    filters.brand,
    filters.model,
    filters.vehicle,
    filters.source,
    filters.lead,
    filters.checkedIn,
  ]);
}

/** Replaces every filter param in `params` with the given filters. */
export function writeTestDriveFiltersToParams(params: URLSearchParams, filters: TestDriveListFilters) {
  TEST_DRIVE_FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
  if (filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.showroom) params.set("showroom", filters.showroom);
  if (filters.staff) params.set("staff", filters.staff);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.model) params.set("model", filters.model);
  if (filters.vehicle) params.set("vehicle", filters.vehicle);
  if (filters.source) params.set("source", filters.source);
  if (filters.lead) params.set("lead", filters.lead);
  if (filters.checkedIn) params.set("checkedIn", filters.checkedIn);
}

/** The full list URL for a page, keeping search, sort and every filter. */
export function buildTestDriveListSearchParams(input: {
  page: number;
  pageSize: number;
  sort: string;
  defaultSort: string;
  search: string;
  filters: TestDriveListFilters;
  archived?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams({ page: String(input.page), pageSize: String(input.pageSize) });
  if (input.sort !== input.defaultSort) params.set("sort", input.sort);
  if (input.search) params.set("q", input.search);
  if (input.archived) params.set("archived", "true");
  writeTestDriveFiltersToParams(params, input.filters);
  return params;
}

/* ---------- Search helpers ---------- */

/** Removes characters that could break the query or act as wildcards. */
export function cleanSearchTerm(raw: string): string {
  return raw
    .replace(/[%_\\,()"*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Digits to match against customer_phone_digits, or null when the term isn't a phone number.
 * Leading zeros are dropped, so "050 123" matches "+971 50 123 4567".
 * Terms with letters (like OMC-TD-000042) are never treated as phone numbers.
 */
export function phoneDigitsForSearch(term: string): string | null {
  if (/[a-z]/i.test(term)) return null;
  const digits = term.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 3 ? digits : null;
}
