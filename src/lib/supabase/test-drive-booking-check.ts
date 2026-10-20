import { getShowroomScheduleInfo, loadAvailabilityData } from "@/src/lib/supabase/test-drive-availability";
import { findBookingProblems } from "@/src/lib/utils/test-drive-booking-check";
import { formatTime, toDubaiIsoDate } from "@/src/lib/utils/test-drive-format";
import type { BookingProblem } from "@/src/lib/types/test-drive";

export interface CheckExactBookingParams {
  carId: string;
  locationId: string;
  /** The exact stored start, as an ISO timestamp. */
  startIso: string;
  durationMinutes: number;
  bufferMinutes: number;
  staffId: string | null;
  /** The test drive being checked: it mustn't be counted as its own conflict. */
  excludeTestDriveId?: string;
  enforceNotice: boolean;
}

export type ExactBookingCheck =
  { status: "ok" } | { status: "blocked"; problems: BookingProblem[] } | { status: "error" };

/**
 * "Can this exact time be booked?" for an existing request. Used by approval
 * now and by rescheduling in Phase 11. Callers must pass UUIDs they have
 * already validated. The database's own constraints remain the final guard
 * against two people booking at once.
 */
export async function checkExactBooking(params: CheckExactBookingParams): Promise<ExactBookingCheck> {
  const info = await getShowroomScheduleInfo(params.locationId);
  if (!info) return { status: "error" };

  const date = toDubaiIsoDate(params.startIso);
  const time = formatTime(params.startIso);

  const data = await loadAvailabilityData({
    carId: params.carId,
    staffId: params.staffId,
    startDate: date,
    endDate: date,
    bufferMinutes: params.bufferMinutes,
    excludeTestDriveId: params.excludeTestDriveId,
  });
  if (!data) return { status: "error" };

  const problems = findBookingProblems({
    info,
    date,
    time,
    durationMinutes: params.durationMinutes,
    bufferMinutes: params.bufferMinutes,
    carId: params.carId,
    staffId: params.staffId,
    bookings: data.bookings,
    away: data.away,
    nowMs: Date.now(),
    enforceNotice: params.enforceNotice,
  });

  return problems.length > 0 ? { status: "blocked", problems } : { status: "ok" };
}
