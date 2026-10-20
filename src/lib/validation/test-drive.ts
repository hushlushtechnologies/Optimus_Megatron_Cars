import { z } from "zod";
import { parseIsoDate, toIsoDate } from "@/src/lib/utils/test-drive-format";

// A real calendar date, not just something shaped like one (2026-02-31 is rejected).
const isRealDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && toIsoDate(parseIsoDate(value)) === value;

export const createTestDriveSchema = z
  .object({
    customerId: z.string().uuid("Select a customer"),
    carId: z.string().uuid("Select a vehicle"),
    locationId: z.string().uuid("Select a showroom"),
    leadId: z.string().uuid().nullable(),
    createLead: z.boolean(),
    requestSourceId: z.string().uuid().nullable(),
    date: z.string().refine(isRealDate, "Select a date"),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please select an available time slot."),
    durationMinutes: z
      .number()
      .int()
      .min(15, "Duration must be at least 15 minutes")
      .max(480, "Duration can't exceed 8 hours"),
    staffId: z.string().uuid().nullable(),
    customerNotes: z.string().max(1000, "Keep this under 1,000 characters"),
    internalNotes: z.string().max(1000, "Keep this under 1,000 characters"),
  })
  .refine((values) => !(values.leadId && values.createLead), {
    message: "Choose either an existing lead or a new one, not both.",
    path: ["leadId"],
  });

export type CreateTestDriveValues = z.infer<typeof createTestDriveSchema>;
