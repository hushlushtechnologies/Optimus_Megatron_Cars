import type {
  DayAvailability,
  DayHint,
  MonthAvailability,
  ShowroomScheduleInfo,
  TestDriveTimeSlot,
} from "@/src/lib/types/test-drive";
import {
  SLOT_REASONS,
  addDaysToIso,
  dayOfWeekFromIso,
  dubaiLocalToDate,
  generateCandidateTimes,
  getClosedDateReason,
  rangesOverlap,
} from "@/src/lib/utils/test-drive-slots";

/** A day with this many free times or fewer is flagged "few left". */
export const LIMITED_THRESHOLD = 3;

export interface ConfirmedBooking {
  id: string;
  test_drive_number: string;
  car_id: string;
  assigned_staff_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  blocked_end: string;
}

export interface StaffAwayBlock {
  staff_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface DaySlotsInput {
  /** YYYY-MM-DD, Dubai calendar date. */
  date: string;
  info: ShowroomScheduleInfo;
  carId: string;
  staffId: string | null;
  durationMinutes: number;
  /** Confirmed (Approved / Rescheduled) bookings that could touch this day. */
  bookings: ConfirmedBooking[];
  away: StaffAwayBlock[];
  nowMs: number;
  todayIso: string;
}

export interface DaySlots {
  slots: TestDriveTimeSlot[];
  closedReason: string | null;
}

/**
 * Every start time on one date, each marked available or not, with the
 * reason when not. The ranges are half-open and include the buffer, exactly
 * like the exclusion constraints in the database, so this never disagrees
 * with what the database will accept.
 */
export function buildDaySlots(input: DaySlotsInput): DaySlots {
  const { date, info, carId, staffId, durationMinutes, bookings, away, nowMs, todayIso } = input;
  const { settings } = info;

  if (date < todayIso) return { slots: [], closedReason: "This date has already passed." };
  if (date > addDaysToIso(todayIso, settings.max_advance_days)) {
    return { slots: [], closedReason: `Bookings open up to ${settings.max_advance_days} days ahead.` };
  }

  const closedReason = getClosedDateReason(date, info);
  if (closedReason) return { slots: [], closedReason };

  const hours = info.hours.find((h) => h.day_of_week === dayOfWeekFromIso(date));
  if (!hours) return { slots: [], closedReason: "The showroom is closed on this day." };

  const candidates = generateCandidateTimes(
    hours.opens_at,
    hours.closes_at,
    settings.slot_interval_minutes,
    durationMinutes,
  );
  if (candidates.length === 0) {
    return { slots: [], closedReason: "The opening hours are too short for this duration." };
  }

  const bufferMs = settings.buffer_minutes * 60_000;
  const noticeMs = settings.min_notice_hours * 3_600_000;

  const slots: TestDriveTimeSlot[] = candidates.map((time) => {
    const start = dubaiLocalToDate(date, time).getTime();
    const end = start + durationMinutes * 60_000;
    const blockedEnd = end + bufferMs;

    const overlapsBooking = (b: ConfirmedBooking) =>
      rangesOverlap(start, blockedEnd, Date.parse(b.scheduled_start), Date.parse(b.blocked_end));

    let reason: string | undefined;

    if (start <= nowMs) reason = SLOT_REASONS.passed;
    else if (start < nowMs + noticeMs) reason = `Needs ${settings.min_notice_hours} hr notice`;
    else if (bookings.some((b) => b.car_id === carId && overlapsBooking(b)))
      reason = SLOT_REASONS.vehicleBooked;
    else if (staffId && bookings.some((b) => b.assigned_staff_id === staffId && overlapsBooking(b))) {
      reason = SLOT_REASONS.staffBooked;
    } else if (
      staffId &&
      away.some(
        (a) =>
          a.staff_id === staffId && rangesOverlap(start, end, Date.parse(a.starts_at), Date.parse(a.ends_at)),
      )
    ) {
      reason = SLOT_REASONS.staffAway;
    }

    return { time, available: !reason, reason };
  });

  return { slots, closedReason: null };
}

export function summarizeDay(day: DaySlots): DayAvailability {
  return {
    free: day.slots.filter((s) => s.available).length,
    total: day.slots.length,
    closedReason: day.closedReason,
  };
}

/** Turns a month's counts into the labels and markers the date picker shows. */
export function toDayHints(month: MonthAvailability): Record<string, DayHint> {
  const hints: Record<string, DayHint> = {};

  for (const [date, day] of Object.entries(month)) {
    if (day.closedReason) hints[date] = { state: "closed", label: day.closedReason };
    else if (day.free === 0) hints[date] = { state: "full", label: "No free times" };
    else if (day.free <= LIMITED_THRESHOLD) {
      hints[date] = { state: "limited", label: `Only ${day.free} free time${day.free === 1 ? "" : "s"}` };
    } else hints[date] = { state: "open", label: `${day.free} free times` };
  }

  return hints;
}
