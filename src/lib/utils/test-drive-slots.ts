import type { ShowroomScheduleInfo } from "@/src/lib/types/test-drive";

// Dubai has no daylight saving time, so a fixed +04:00 offset is always right.
const DUBAI_OFFSET = "+04:00";

export const SLOT_REASONS = {
  passed: "This time has passed",
  vehicleBooked: "Vehicle already booked",
  staffBooked: "Staff already booked",
  staffAway: "Staff unavailable",
} as const;

/** A date and time typed in a form (Dubai time) as an absolute moment. */
export function dubaiLocalToDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${DUBAI_OFFSET}`);
}

/** 0 = Sunday ... 6 = Saturday, for a calendar date. Independent of any timezone. */
export function dayOfWeekFromIso(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDaysToIso(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${dd}`;
}

/** "10:00:00" -> "10:00" */
export function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Start times from opening to the last start that still finishes by closing time. */
export function generateCandidateTimes(
  opensAt: string,
  closesAt: string,
  intervalMinutes: number,
  durationMinutes: number,
): string[] {
  const start = timeToMinutes(trimSeconds(opensAt));
  const end = timeToMinutes(trimSeconds(closesAt));
  const times: string[] = [];

  for (let m = start; m + durationMinutes <= end; m += intervalMinutes) {
    times.push(minutesToTime(m));
  }
  return times;
}

/** Half-open ranges: touching ends don't overlap. Matches the database's '[)' ranges. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Why a whole day can't be booked at this showroom, or null when it can. */
export function getClosedDateReason(iso: string, info: ShowroomScheduleInfo): string | null {
  if (!info.enabled) return "Test drives aren't available at this showroom.";

  const hours = info.hours.find((h) => h.day_of_week === dayOfWeekFromIso(iso));
  if (!hours || hours.is_closed) return "The showroom is closed on this day.";

  const blackout = info.blackouts.find((b) => iso >= b.starts_on && iso <= b.ends_on);
  if (blackout) return `Closed: ${blackout.reason}`;

  return null;
}

/** The message shown when the chosen slot turns out to be unavailable. */
export function slotReasonToMessage(reason?: string): string {
  switch (reason) {
    case SLOT_REASONS.vehicleBooked:
      return "This vehicle is already booked for the selected time.";
    case SLOT_REASONS.staffBooked:
    case SLOT_REASONS.staffAway:
      return "The assigned staff member is unavailable.";
    default:
      return "Please select an available time slot.";
  }
}
