import { z } from "zod";
import { testDriveFeedbackSchema } from "@/src/lib/validation/test-drive-feedback";

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter the time in hours and minutes.");

export const completeTestDriveSchema = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().min(1),
  /** Dubai time. The date is always the appointment's own date, decided by the server. */
  actualStartTime: timeOfDay,
  actualEndTime: timeOfDay,
  feedback: testDriveFeedbackSchema,
});

export const saveFeedbackSchema = z.object({
  id: z.string().uuid(),
  feedback: testDriveFeedbackSchema,
});
