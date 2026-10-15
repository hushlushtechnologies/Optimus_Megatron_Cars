// Every date the app shows or accepts is Dubai time. Stating that
// explicitly, instead of relying on the machine's own timezone, keeps the
// server (UTC on Vercel), the browser and your laptop in agreement.
const TIME_ZONE = "Asia/Dubai";
const DUBAI_OFFSET = "+04:00"; // Dubai has no daylight saving time

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: TIME_ZONE });
const dateInputFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
const timeInputFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateFormat.format(new Date(value));
}

/** For <input type="date"> */
export function toDubaiDateInput(value: string | Date): string {
  return dateInputFormat.format(new Date(value));
}

/** For <input type="time"> */
export function toDubaiTimeInput(value: string | Date): string {
  return timeInputFormat.format(new Date(value));
}

/** Turns a date and time typed in a form (Dubai time) into a UTC ISO string for the database. */
export function dubaiToIso(date: string, time: string): string {
  return new Date(`${date}T${time || "09:00"}:00${DUBAI_OFFSET}`).toISOString();
}
