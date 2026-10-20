import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { getDubaiToday, parseIsoDate, toDubaiIsoDate, toIsoDate } from "@/src/lib/utils/test-drive-format";
import type { TestDriveListRow } from "@/src/lib/types/test-drive";

export type TestDriveCalendarView = "month" | "week" | "day";

export const DEFAULT_CALENDAR_VIEW: TestDriveCalendarView = "week";
export const WEEK_OPTIONS = { weekStartsOn: 1 } as const; // weeks start on Monday
export const CALENDAR_ROW_CAP = 1000;
export const UNASSIGNED_STAFF_FILTER = "unassigned";

// Prefixed so they never collide with the table's page, pageSize and sort.
export const CALENDAR_PARAM_KEYS = {
  view: "calView",
  date: "calDate",
  staff: "calStaff",
  showroom: "calShowroom",
  closed: "calClosed",
} as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface TestDriveCalendarParams {
  view: TestDriveCalendarView;
  /** Any date inside the period being shown, YYYY-MM-DD (Dubai calendar date). */
  date: string;
  /** A staff id, "unassigned", or null for everyone. */
  staff: string | null;
  showroom: string | null;
  /** Include Rejected and Cancelled appointments. */
  showClosed: boolean;
}

function isValidIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value) && toIsoDate(parseIsoDate(value)) === value;
}

/** Turns raw URL values into safe ones: junk falls back to a default instead of erroring. */
export function parseCalendarParams(params: Record<string, string | undefined>): TestDriveCalendarParams {
  const rawView = params[CALENDAR_PARAM_KEYS.view];
  const view: TestDriveCalendarView =
    rawView === "month" || rawView === "week" || rawView === "day" ? rawView : DEFAULT_CALENDAR_VIEW;

  const rawDate = params[CALENDAR_PARAM_KEYS.date];
  const date = rawDate && isValidIsoDate(rawDate) ? rawDate : getDubaiToday();

  const rawStaff = params[CALENDAR_PARAM_KEYS.staff];
  const staff =
    rawStaff === UNASSIGNED_STAFF_FILTER
      ? UNASSIGNED_STAFF_FILTER
      : rawStaff && UUID_PATTERN.test(rawStaff)
        ? rawStaff
        : null;

  const rawShowroom = params[CALENDAR_PARAM_KEYS.showroom];
  const showroom = rawShowroom && UUID_PATTERN.test(rawShowroom) ? rawShowroom : null;

  return { view, date, staff, showroom, showClosed: params[CALENDAR_PARAM_KEYS.closed] === "1" };
}

export interface CalendarRange {
  start: string;
  end: string;
}

/** The first and last day shown. Month and week views include the neighbouring days that fill out the grid. */
export function getCalendarRange(view: TestDriveCalendarView, date: string): CalendarRange {
  const d = parseIsoDate(date);

  if (view === "day") return { start: date, end: date };

  if (view === "week") {
    return { start: toIsoDate(startOfWeek(d, WEEK_OPTIONS)), end: toIsoDate(endOfWeek(d, WEEK_OPTIONS)) };
  }

  return {
    start: toIsoDate(startOfWeek(startOfMonth(d), WEEK_OPTIONS)),
    end: toIsoDate(endOfWeek(endOfMonth(d), WEEK_OPTIONS)),
  };
}

export function getRangeDays(range: CalendarRange): string[] {
  return eachDayOfInterval({ start: parseIsoDate(range.start), end: parseIsoDate(range.end) }).map(toIsoDate);
}

// Dubai has no daylight saving time, so a fixed +04:00 offset marks the exact
// moment a Dubai day begins.
function dubaiDayStartIso(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00+04:00`).toISOString();
}

/** Absolute timestamps for a range: from is inclusive, to is exclusive. Filtering on the real column lets the database use its index. */
export function getRangeBounds(range: CalendarRange): { from: string; to: string } {
  return {
    from: dubaiDayStartIso(range.start),
    to: dubaiDayStartIso(toIsoDate(addDays(parseIsoDate(range.end), 1))),
  };
}

export function shiftCalendarDate(view: TestDriveCalendarView, date: string, direction: 1 | -1): string {
  const d = parseIsoDate(date);
  if (view === "day") return toIsoDate(addDays(d, direction));
  if (view === "week") return toIsoDate(addDays(d, direction * 7));
  return toIsoDate(addMonths(d, direction));
}

export function formatCalendarRangeLabel(view: TestDriveCalendarView, date: string): string {
  const d = parseIsoDate(date);

  if (view === "day") return format(d, "EEEE, d MMMM yyyy");
  if (view === "month") return format(d, "MMMM yyyy");

  const start = startOfWeek(d, WEEK_OPTIONS);
  const end = endOfWeek(d, WEEK_OPTIONS);
  if (start.getFullYear() !== end.getFullYear())
    return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
  if (start.getMonth() !== end.getMonth()) return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  return `${format(start, "d")} – ${format(end, "d MMMM yyyy")}`;
}

export function groupEventsByDay(rows: TestDriveListRow[]): Map<string, TestDriveListRow[]> {
  const map = new Map<string, TestDriveListRow[]>();

  [...rows]
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start))
    .forEach((row) => {
      const key = toDubaiIsoDate(row.scheduled_start);
      const list = map.get(key);
      if (list) list.push(row);
      else map.set(key, [row]);
    });

  return map;
}

const minuteParts = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Dubai",
});

/** Minutes after midnight, Dubai time. */
export function dubaiMinutesOfDay(value: string | Date): number {
  const parts = minuteParts.formatToParts(new Date(value));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function getNowInDubai(minuteSinceEpoch: number | null): { iso: string; minutes: number } | null {
  if (minuteSinceEpoch === null) return null;
  const date = new Date(minuteSinceEpoch * 60_000);
  return { iso: toDubaiIsoDate(date), minutes: dubaiMinutesOfDay(date) };
}

// --- Time-grid layout ---

export const HOUR_HEIGHT_PX = 64;
const DEFAULT_GRID_START_HOUR = 8;
const DEFAULT_GRID_END_HOUR = 21;
// A very short appointment still takes up this much room on screen, so it
// has to count as that long when deciding what overlaps.
const MIN_VISUAL_MINUTES = 30;

export interface PositionedEvent {
  event: TestDriveListRow;
  startMinutes: number;
  /** The end as drawn on screen (never shorter than MIN_VISUAL_MINUTES). */
  endMinutes: number;
  column: number;
  columns: number;
}

/**
 * Places a day's appointments so overlapping ones sit side by side.
 * Appointments that overlap (directly or through a chain) share a cluster,
 * and each gets the first free column in it. The cluster's width is divided
 * by its number of columns.
 */
export function layoutDayEvents(events: TestDriveListRow[]): PositionedEvent[] {
  const items = events
    .map((event) => {
      const startMinutes = dubaiMinutesOfDay(event.scheduled_start);
      const rawEnd = Math.min(startMinutes + event.duration_minutes, 24 * 60);
      return { event, startMinutes, endMinutes: Math.max(rawEnd, startMinutes + MIN_VISUAL_MINUTES) };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

  const result: PositionedEvent[] = [];
  let cluster: { item: (typeof items)[number]; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const columns = columnEnds.length;
    cluster.forEach(({ item, column }) => result.push({ ...item, column, columns }));
    cluster = [];
    columnEnds = [];
    clusterEnd = -1;
  };

  for (const item of items) {
    if (cluster.length > 0 && item.startMinutes >= clusterEnd) flush();

    let column = columnEnds.findIndex((end) => end <= item.startMinutes);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMinutes);
    } else {
      columnEnds[column] = item.endMinutes;
    }

    cluster.push({ item, column });
    clusterEnd = Math.max(clusterEnd, item.endMinutes);
  }
  flush();

  return result;
}

/** The hours shown on the grid: 08:00 to 21:00, widened if any appointment falls outside that. */
export function getGridHourRange(positioned: PositionedEvent[]): { startHour: number; endHour: number } {
  let startHour = DEFAULT_GRID_START_HOUR;
  let endHour = DEFAULT_GRID_END_HOUR;

  positioned.forEach((p) => {
    startHour = Math.min(startHour, Math.floor(p.startMinutes / 60));
    endHour = Math.max(endHour, Math.ceil(p.endMinutes / 60));
  });

  return { startHour, endHour: Math.min(endHour, 24) };
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
