import type { BookingProblem, ShowroomScheduleInfo } from "@/src/lib/types/test-drive";
import type { ConfirmedBooking, StaffAwayBlock } from "@/src/lib/utils/test-drive-availability-logic";
import { formatTimeRange } from "@/src/lib/utils/test-drive-format";
import {
  dayOfWeekFromIso,
  dubaiLocalToDate,
  getClosedDateReason,
  rangesOverlap,
  timeToMinutes,
  trimSeconds,
} from "@/src/lib/utils/test-drive-slots";

export interface BookingCheckInput {
  info: ShowroomScheduleInfo;
  /** YYYY-MM-DD, Dubai calendar date. */
  date: string;
  /** HH:mm, Dubai wall-clock time. Does NOT have to sit on the slot grid. */
  time: string;
  durationMinutes: number;
  /** The buffer this booking carries (stored on the test drive itself). */
  bufferMinutes: number;
  carId: string;
  staffId: string | null;
  /** Other confirmed bookings that could touch this time. The test drive being checked must not be in here. */
  bookings: ConfirmedBooking[];
  away: StaffAwayBlock[];
  nowMs: number;
  /** New bookings need minimum notice. Approving an existing request doesn't. */
  enforceNotice: boolean;
}

/**
 * Every reason this exact time can't be booked: all of them, not just the
 * first, so a screen can say precisely what's wrong. An empty list means it
 * can. Overlap uses half-open ranges including the buffer, exactly like the
 * database's exclusion constraints, so this never disagrees with what the
 * database will accept.
 */
export function findBookingProblems(input: BookingCheckInput): BookingProblem[] {
  const {
    info,
    date,
    time,
    durationMinutes,
    bufferMinutes,
    carId,
    staffId,
    bookings,
    away,
    nowMs,
    enforceNotice,
  } = input;
  const problems: BookingProblem[] = [];

  const startMs = dubaiLocalToDate(date, time).getTime();
  const endMs = startMs + durationMinutes * 60_000;
  const blockedEndMs = endMs + bufferMinutes * 60_000;

  if (!info.enabled) {
    problems.push({
      kind: "unavailable",
      message: "Test drives aren't available at this showroom.",
      detail: null,
    });
  } else {
    if (startMs <= nowMs) {
      problems.push({
        kind: "passed",
        message: "This appointment time has already passed.",
        detail: "Change the time first, or reject the request.",
      });
    }

    const closedReason = getClosedDateReason(date, info);
    if (closedReason) {
      problems.push({ kind: "closed", message: closedReason, detail: null });
    } else {
      const hours = info.hours.find((h) => h.day_of_week === dayOfWeekFromIso(date));
      if (hours) {
        const startMinute = timeToMinutes(time);
        const endMinute = startMinute + durationMinutes;
        const opens = timeToMinutes(trimSeconds(hours.opens_at));
        const closes = timeToMinutes(trimSeconds(hours.closes_at));

        if (endMinute > 24 * 60 || startMinute < opens || endMinute > closes) {
          problems.push({
            kind: "hours",
            message: "This time is outside the showroom's opening hours.",
            detail: `Open ${trimSeconds(hours.opens_at)} – ${trimSeconds(hours.closes_at)}.`,
          });
        }
      }
    }

    if (enforceNotice && startMs > nowMs && startMs < nowMs + info.settings.min_notice_hours * 3_600_000) {
      problems.push({
        kind: "notice",
        message: `Bookings need ${info.settings.min_notice_hours} hours' notice.`,
        detail: null,
      });
    }
  }

  const overlaps = (b: ConfirmedBooking) =>
    rangesOverlap(startMs, blockedEndMs, Date.parse(b.scheduled_start), Date.parse(b.blocked_end));

  const vehicleClash = bookings.find((b) => b.car_id === carId && overlaps(b));
  if (vehicleClash) {
    problems.push({
      kind: "vehicle",
      message: "This vehicle is already booked for the selected time.",
      detail: `${vehicleClash.test_drive_number}, ${formatTimeRange(vehicleClash.scheduled_start, vehicleClash.scheduled_end)}`,
    });
  }

  if (staffId) {
    const staffClash = bookings.find((b) => b.assigned_staff_id === staffId && overlaps(b));
    if (staffClash) {
      problems.push({
        kind: "staff_busy",
        message: "The assigned staff member is unavailable.",
        detail: `Hosting ${staffClash.test_drive_number}, ${formatTimeRange(staffClash.scheduled_start, staffClash.scheduled_end)}`,
      });
    }

    const leave = away.find(
      (a) =>
        a.staff_id === staffId &&
        rangesOverlap(startMs, endMs, Date.parse(a.starts_at), Date.parse(a.ends_at)),
    );
    if (leave) {
      problems.push({
        kind: "staff_away",
        message: "The assigned staff member is unavailable.",
        detail: leave.reason ? `On leave: ${leave.reason}` : "On leave",
      });
    }
  }

  return problems;
}
