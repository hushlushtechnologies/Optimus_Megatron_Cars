"use server";

import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { getMyTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import {
  loadTestDriveForAction,
  type TestDriveActionRow,
} from "@/src/lib/supabase/test-drive-action-helpers";
import {
  computeTestDriveSlots,
  findNearestSlots,
  getShowroomScheduleInfo,
  getStaffAvailabilityForSlot,
} from "@/src/lib/supabase/test-drive-availability";
import type {
  NearestSlot,
  ShowroomScheduleInfo,
  StaffAvailabilityMap,
  TestDriveSlotsResult,
} from "@/src/lib/types/test-drive";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const duration = z.number().int().min(15).max(480);
const ids = { testDriveId: z.string().uuid(), locationId: z.string().uuid() };

/** These are read-only, but they reveal bookings, so they need a reason to be looking: edit or reschedule rights. */
async function loadDriveForScheduleRead(testDriveId: string): Promise<TestDriveActionRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const permissions = await getMyTestDrivePermissions(supabase);
  if (!permissions.edit && !permissions.reschedule) return null;

  return loadTestDriveForAction(supabase, testDriveId);
}

export async function getScheduleInfoForDriveAction(input: unknown): Promise<ShowroomScheduleInfo | null> {
  const parsed = z.object(ids).safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadDriveForScheduleRead(parsed.data.testDriveId);
  if (!drive) return null;

  return getShowroomScheduleInfo(parsed.data.locationId);
}

const slotsSchema = z.object({
  ...ids,
  date: isoDate,
  durationMinutes: duration,
  staffId: z.string().uuid().nullable(),
});

export async function getSlotsForDriveAction(input: unknown): Promise<TestDriveSlotsResult | null> {
  const parsed = slotsSchema.safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadDriveForScheduleRead(parsed.data.testDriveId);
  if (!drive) return null;

  return computeTestDriveSlots({
    carId: drive.car_id,
    locationId: parsed.data.locationId,
    date: parsed.data.date,
    durationMinutes: parsed.data.durationMinutes,
    staffId: parsed.data.staffId,
    excludeTestDriveId: drive.id,
  });
}

const nearestSchema = z.object({
  ...ids,
  date: isoDate,
  time: timeOfDay.nullable(),
  durationMinutes: duration,
  staffId: z.string().uuid().nullable(),
});

export async function getNearestForDriveAction(input: unknown): Promise<NearestSlot[] | null> {
  const parsed = nearestSchema.safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadDriveForScheduleRead(parsed.data.testDriveId);
  if (!drive) return null;

  return findNearestSlots({
    carId: drive.car_id,
    locationId: parsed.data.locationId,
    date: parsed.data.date,
    time: parsed.data.time,
    durationMinutes: parsed.data.durationMinutes,
    staffId: parsed.data.staffId,
    excludeTestDriveId: drive.id,
  });
}

const staffSchema = z.object({
  ...ids,
  date: isoDate,
  time: timeOfDay,
  durationMinutes: duration,
});

export async function getStaffAvailabilityForDriveAction(
  input: unknown,
): Promise<StaffAvailabilityMap | null> {
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) return null;

  const drive = await loadDriveForScheduleRead(parsed.data.testDriveId);
  if (!drive) return null;

  return getStaffAvailabilityForSlot({
    locationId: parsed.data.locationId,
    date: parsed.data.date,
    time: parsed.data.time,
    durationMinutes: parsed.data.durationMinutes,
    excludeTestDriveId: drive.id,
  });
}
