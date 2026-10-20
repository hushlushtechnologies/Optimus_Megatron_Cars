import { z } from "zod";
import { parseIsoDate, toIsoDate } from "@/src/lib/utils/test-drive-format";

// A real calendar date, not just something shaped like one (2026-02-31 is rejected).
const isRealDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && toIsoDate(parseIsoDate(value)) === value;

const scheduleFields = {
  locationId: z.string().uuid("Select a showroom"),
  date: z.string().refine(isRealDate, "Select a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please select an available time slot."),
  durationMinutes: z
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration can't exceed 8 hours"),
};

export const scheduleChangeSchema = z.object(scheduleFields);

export const editTestDriveSchema = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().min(1),
  customerNotes: z.string().max(1000, "Keep the customer notes under 1,000 characters"),
  internalNotes: z.string().max(1000, "Keep the internal notes under 1,000 characters"),
  requestSourceId: z.string().uuid().nullable(),
  /** Only sent when the date, time, duration or showroom changed (Pending requests only). */
  schedule: scheduleChangeSchema.nullable(),
  /** Left out entirely when the host isn't being changed. */
  staffId: z.string().uuid().nullable().optional(),
});

export const rescheduleTestDriveSchema = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().min(1),
  ...scheduleFields,
  staffId: z.string().uuid("Choose a host for this appointment."),
  reason: z
    .string()
    .trim()
    .min(3, "Please give a reason (at least 3 characters).")
    .max(500, "Keep the reason under 500 characters."),
});
