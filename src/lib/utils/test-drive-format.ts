// Every appointment is shown in Dubai time, stated explicitly so the server
// (UTC on Vercel), the browser and your laptop always agree.
const TIME_ZONE = "Asia/Dubai";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const dayLongFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

const isoDateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD

export const formatDay = (value: string | Date) => dayFormat.format(new Date(value));
export const formatDayLong = (value: string | Date) => dayLongFormat.format(new Date(value));
export const formatTime = (value: string | Date) => timeFormat.format(new Date(value));
export const formatDateTimeFull = (value: string | Date) => dateTimeFormat.format(new Date(value));

export function formatTimeRange(start: string | Date, end: string | Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** The calendar date in Dubai, as YYYY-MM-DD. */
export function toDubaiIsoDate(value: string | Date): string {
  return isoDateFormat.format(new Date(value));
}

export function getDubaiToday(): string {
  return toDubaiIsoDate(new Date());
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

/** "11:00" + 60 -> "12:00". Wraps at midnight. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// Calendar-grid helpers: pure date math on "YYYY-MM-DD" strings, using the
// runtime's own local calendar on both the way in and the way out, so the
// result is the same in any timezone.
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
