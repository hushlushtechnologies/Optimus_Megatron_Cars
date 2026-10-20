import { z } from "zod";

export const INTEREST_LEVELS = ["Very Interested", "Interested", "Considering", "Not Interested"] as const;

export const testDriveFeedbackSchema = z.object({
  interest_level: z.enum(INTEREST_LEVELS, { message: "Select the customer's interest level" }),
  staff_feedback: z.string().max(1000, "Keep this under 1,000 characters"),
  customer_feedback: z.string().max(1000, "Keep this under 1,000 characters"),
  next_step: z.string().max(500, "Keep this under 500 characters"),
  follow_up_required: z.boolean(),
});

export type TestDriveFeedbackValues = z.infer<typeof testDriveFeedbackSchema>;
