import { createClient } from "@/src/lib/supabase/server";
import { formatTimeRange, getDubaiToday } from "@/src/lib/utils/test-drive-format";
import { addDaysToIso, dubaiLocalToDate, slotReasonToMessage } from "@/src/lib/utils/test-drive-slots";
import {
  buildDaySlots,
  summarizeDay,
  type ConfirmedBooking,
  type StaffAwayBlock,
} from "@/src/lib/utils/test-drive-availability-logic";
import type {
  MonthAvailability,
  NearestSlot,
  ShowroomScheduleInfo,
  StaffAvailabilityMap,
  TestDriveSlotCheck,
  TestDriveSlotsResult,
} from "@/src/lib/types/test-drive";

const CONFIRMED_STATUSES = ["Approved", "Rescheduled"];

const DISABLED_DEFAULTS: ShowroomScheduleInfo["settings"] = {
  slot_interval_minutes: 30,
  default_duration_minutes: 60,
  buffer_minutes: 15,
  min_notice_hours: 2,
  max_advance_days: 60,
};

/** Hours, closure dates and rules for one showroom. Returns null when the lookup fails. */
export async function getShowroomScheduleInfo(locationId: string): Promise<ShowroomScheduleInfo | null> {
  const supabase = await createClient();
  const today = getDubaiToday();

  // locationId has already been checked to be a real UUID by the caller.
  const [settings, hours, blackouts] = await Promise.all([
    supabase
      .from("test_drive_location_settings")
      .select(
        "is_enabled, slot_interval_minutes, default_duration_minutes, buffer_minutes, min_notice_hours, max_advance_days",
      )
      .eq("location_id", locationId)
      .maybeSingle(),
    supabase
      .from("showroom_hours")
      .select("day_of_week, is_closed, opens_at, closes_at")
      .eq("location_id", locationId)
      .order("day_of_week"),
    supabase
      .from("test_drive_blackouts")
      .select("starts_on, ends_on, reason")
      .or(`location_id.is.null,location_id.eq.${locationId}`)
      .gte("ends_on", today),
  ]);

  if (settings.error || hours.error || blackouts.error) {
    console.error("getShowroomScheduleInfo error:", settings.error ?? hours.error ?? blackouts.error);
    return null;
  }

  if (!settings.data) {
    return { location_id: locationId, enabled: false, hours: [], blackouts: [], settings: DISABLED_DEFAULTS };
  }

  const { is_enabled, ...rules } = settings.data;

  return {
    location_id: locationId,
    enabled: is_enabled,
    hours: hours.data ?? [],
    blackouts: blackouts.data ?? [],
    settings: rules,
  };
}

export interface LoadParams {
  carId: string;
  staffId: string | null;
  startDate: string;
  endDate: string;
  bufferMinutes: number;
  excludeTestDriveId?: string;
}

/**
 * One round of queries for a whole date range: the confirmed bookings that
 * could touch it (for this vehicle, and for this staff member if any) and the
 * staff member's leave. Only confirmed bookings block anything: a Pending
 * request holds no slot. Callers validate every id as a UUID first, so the
 * values are safe to place in the filter below.
 */
export async function loadAvailabilityData(
  p: LoadParams,
): Promise<{ bookings: ConfirmedBooking[]; away: StaffAwayBlock[] } | null> {
  const supabase = await createClient();

  const windowStartIso = dubaiLocalToDate(p.startDate, "00:00").toISOString();
  const windowEndIso = new Date(
    dubaiLocalToDate(addDaysToIso(p.endDate, 1), "00:00").getTime() + p.bufferMinutes * 60_000,
  ).toISOString();

  let bookingsQuery = supabase
    .from("test_drives")
    .select("id, test_drive_number, car_id, assigned_staff_id, scheduled_start, scheduled_end, blocked_end")
    .in("status", CONFIRMED_STATUSES)
    .lt("scheduled_start", windowEndIso)
    .gt("blocked_end", windowStartIso);

  bookingsQuery = p.staffId
    ? bookingsQuery.or(`car_id.eq.${p.carId},assigned_staff_id.eq.${p.staffId}`)
    : bookingsQuery.eq("car_id", p.carId);

  if (p.excludeTestDriveId) bookingsQuery = bookingsQuery.neq("id", p.excludeTestDriveId);

  const awayQuery = p.staffId
    ? supabase
        .from("test_drive_staff_unavailability")
        .select("staff_id, starts_at, ends_at, reason")
        .eq("staff_id", p.staffId)
        .lt("starts_at", windowEndIso)
        .gt("ends_at", windowStartIso)
    : null;

  const [bookingsResult, awayResult] = await Promise.all([bookingsQuery, awayQuery ?? Promise.resolve(null)]);

  if (bookingsResult.error) {
    console.error("loadAvailabilityData (bookings) error:", bookingsResult.error);
    return null;
  }
  if (awayResult?.error) {
    console.error("loadAvailabilityData (unavailability) error:", awayResult.error);
    return null;
  }

  return {
    bookings: (bookingsResult.data ?? []) as unknown as ConfirmedBooking[],
    away: (awayResult?.data ?? []) as unknown as StaffAwayBlock[],
  };
}

export interface ComputeSlotsParams {
  carId: string;
  locationId: string;
  /** YYYY-MM-DD, Dubai calendar date. */
  date: string;
  durationMinutes: number;
  staffId: string | null;
  /** Ignore this test drive's own booking (used when rescheduling one in a later phase). */
  excludeTestDriveId?: string;
}

/** Every start time on one date, available or not. Returns null when the data can't be loaded. */
export async function computeTestDriveSlots(
  params: ComputeSlotsParams,
): Promise<TestDriveSlotsResult | null> {
  const info = await getShowroomScheduleInfo(params.locationId);
  if (!info) return null;

  const todayIso = getDubaiToday();
  const nowMs = Date.now();
  const base = {
    date: params.date,
    info,
    carId: params.carId,
    staffId: params.staffId,
    durationMinutes: params.durationMinutes,
    nowMs,
    todayIso,
  };

  // A closed, past or too-far-ahead day needs no booking data at all.
  const probe = buildDaySlots({ ...base, bookings: [], away: [] });
  if (probe.closedReason) {
    return { slots: [], closedReason: probe.closedReason, bufferMinutes: info.settings.buffer_minutes };
  }

  const data = await loadAvailabilityData({
    carId: params.carId,
    staffId: params.staffId,
    startDate: params.date,
    endDate: params.date,
    bufferMinutes: info.settings.buffer_minutes,
    excludeTestDriveId: params.excludeTestDriveId,
  });
  if (!data) return null;

  const day = buildDaySlots({ ...base, bookings: data.bookings, away: data.away });
  return { slots: day.slots, closedReason: day.closedReason, bufferMinutes: info.settings.buffer_minutes };
}

/**
 * The single "can this exact time be booked?" check. Creating a test drive
 * uses it now. Approving (Phase 8) and rescheduling (Phase 11) will call this
 * same function, so every path applies identical rules. The database's own
 * constraints remain the final guard against two people booking at once.
 */
export async function checkTestDriveSlot(
  params: ComputeSlotsParams & { time: string },
): Promise<TestDriveSlotCheck> {
  const result = await computeTestDriveSlots(params);
  if (!result) return { status: "error" };
  if (result.closedReason) return { status: "blocked", message: result.closedReason };

  const slot = result.slots.find((s) => s.time === params.time);
  if (!slot || !slot.available) return { status: "blocked", message: slotReasonToMessage(slot?.reason) };

  return { status: "ok", bufferMinutes: result.bufferMinutes };
}

interface RangeParams {
  carId: string;
  locationId: string;
  durationMinutes: number;
  staffId: string | null;
  startDate: string;
  endDate: string;
  excludeTestDriveId?: string;
}

/** Free-time counts for every date in a range (the date picker's month hints). One data load covers the whole range. */
export async function computeAvailabilityForRange(params: RangeParams): Promise<MonthAvailability | null> {
  const info = await getShowroomScheduleInfo(params.locationId);
  if (!info) return null;

  const data = await loadAvailabilityData({
    carId: params.carId,
    staffId: params.staffId,
    startDate: params.startDate,
    endDate: params.endDate,
    bufferMinutes: info.settings.buffer_minutes,
    excludeTestDriveId: params.excludeTestDriveId,
  });
  if (!data) return null;

  const todayIso = getDubaiToday();
  const nowMs = Date.now();
  const result: MonthAvailability = {};

  for (let date = params.startDate; date <= params.endDate; date = addDaysToIso(date, 1)) {
    result[date] = summarizeDay(
      buildDaySlots({
        date,
        info,
        carId: params.carId,
        staffId: params.staffId,
        durationMinutes: params.durationMinutes,
        bookings: data.bookings,
        away: data.away,
        nowMs,
        todayIso,
      }),
    );
  }

  return result;
}

const NEAREST_LOOKBACK_DAYS = 2;
const NEAREST_LOOKAHEAD_DAYS = 14;

interface NearestParams {
  carId: string;
  locationId: string;
  date: string;
  /** The time that was wanted, or null when only the date is known. */
  time: string | null;
  durationMinutes: number;
  staffId: string | null;
  limit?: number;
  excludeTestDriveId?: string;
}

/** The free times closest to what was wanted, a couple of days before to two weeks after. Returns null when the data can't be loaded. */
export async function findNearestSlots(params: NearestParams): Promise<NearestSlot[] | null> {
  const info = await getShowroomScheduleInfo(params.locationId);
  if (!info) return null;
  if (!info.enabled) return [];

  const todayIso = getDubaiToday();
  const desiredDate = params.date < todayIso ? todayIso : params.date;
  const rawStart = addDaysToIso(desiredDate, -NEAREST_LOOKBACK_DAYS);
  const startDate = rawStart < todayIso ? todayIso : rawStart;
  const endDate = addDaysToIso(desiredDate, NEAREST_LOOKAHEAD_DAYS);

  const data = await loadAvailabilityData({
    carId: params.carId,
    staffId: params.staffId,
    startDate,
    endDate,
    bufferMinutes: info.settings.buffer_minutes,
    excludeTestDriveId: params.excludeTestDriveId,
  });
  if (!data) return null;

  const nowMs = Date.now();
  const desiredMs = dubaiLocalToDate(desiredDate, params.time ?? "10:00").getTime();
  const candidates: { date: string; time: string; startMs: number }[] = [];

  for (let date = startDate; date <= endDate; date = addDaysToIso(date, 1)) {
    const day = buildDaySlots({
      date,
      info,
      carId: params.carId,
      staffId: params.staffId,
      durationMinutes: params.durationMinutes,
      bookings: data.bookings,
      away: data.away,
      nowMs,
      todayIso,
    });

    day.slots.forEach((slot) => {
      if (!slot.available) return;
      // The exact time that was just taken is never offered back.
      if (params.time && date === desiredDate && slot.time === params.time) return;
      candidates.push({ date, time: slot.time, startMs: dubaiLocalToDate(date, slot.time).getTime() });
    });
  }

  candidates.sort(
    (a, b) => Math.abs(a.startMs - desiredMs) - Math.abs(b.startMs - desiredMs) || a.startMs - b.startMs,
  );

  return candidates
    .slice(0, params.limit ?? 4)
    .sort((a, b) => a.startMs - b.startMs)
    .map(({ date, time }) => ({ date, time }));
}

interface StaffAvailabilityParams {
  locationId: string;
  date: string;
  time: string;
  durationMinutes: number;
  excludeTestDriveId?: string;
}

/** For one exact date and time: which staff are free, busy with another confirmed drive, or on leave. */
export async function getStaffAvailabilityForSlot(
  params: StaffAvailabilityParams,
): Promise<StaffAvailabilityMap | null> {
  const info = await getShowroomScheduleInfo(params.locationId);
  if (!info) return null;

  const supabase = await createClient();

  const start = dubaiLocalToDate(params.date, params.time);
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);
  const blockedEnd = new Date(end.getTime() + info.settings.buffer_minutes * 60_000);

  let bookingsQuery = supabase
    .from("test_drives")
    .select("test_drive_number, assigned_staff_id, scheduled_start, scheduled_end")
    .in("status", CONFIRMED_STATUSES)
    .not("assigned_staff_id", "is", null)
    .lt("scheduled_start", blockedEnd.toISOString())
    .gt("blocked_end", start.toISOString());

  if (params.excludeTestDriveId) bookingsQuery = bookingsQuery.neq("id", params.excludeTestDriveId);

  const [staffResult, bookingsResult, awayResult] = await Promise.all([
    supabase.from("profiles").select("id").limit(500),
    bookingsQuery,
    supabase
      .from("test_drive_staff_unavailability")
      .select("staff_id, starts_at, ends_at, reason")
      .lt("starts_at", end.toISOString())
      .gt("ends_at", start.toISOString()),
  ]);

  if (staffResult.error || bookingsResult.error || awayResult.error) {
    console.error(
      "getStaffAvailabilityForSlot error:",
      staffResult.error ?? bookingsResult.error ?? awayResult.error,
    );
    return null;
  }

  const busy = new Map<string, string>();
  (bookingsResult.data ?? []).forEach((b) => {
    if (b.assigned_staff_id && !busy.has(b.assigned_staff_id)) {
      busy.set(
        b.assigned_staff_id,
        `Hosting ${b.test_drive_number}, ${formatTimeRange(b.scheduled_start, b.scheduled_end)}`,
      );
    }
  });

  const away = new Map<string, string>();
  (awayResult.data ?? []).forEach((a) => {
    if (!away.has(a.staff_id)) away.set(a.staff_id, a.reason ? `On leave: ${a.reason}` : "On leave");
  });

  const map: StaffAvailabilityMap = {};
  (staffResult.data ?? []).forEach((s) => {
    const busyDetail = busy.get(s.id);
    const awayDetail = away.get(s.id);

    if (busyDetail) map[s.id] = { state: "busy", detail: busyDetail };
    else if (awayDetail) map[s.id] = { state: "away", detail: awayDetail };
    else map[s.id] = { state: "available", detail: null };
  });

  return map;
}
