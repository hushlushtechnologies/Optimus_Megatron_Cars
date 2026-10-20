import { z } from "zod";
import { parseIsoDate, toIsoDate } from "@/src/lib/utils/test-drive-format";

// The same types the Leads module offers for a follow-up.
export const FOLLOW_UP_TYPES = [
  "Phone Call",
  "WhatsApp",
  "Email",
  "Showroom Visit",
  "Test Drive",
  "General Follow-Up",
] as const;

// A real calendar date, not just something shaped like one (2026-02-31 is rejected).
const isRealDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && toIsoDate(parseIsoDate(value)) === value;

const leadChoiceSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("keep") }),
  z.object({ mode: z.literal("existing"), leadId: z.string().uuid() }),
  z.object({ mode: z.literal("create") }),
]);

export const createFollowUpFromTestDriveSchema = z.object({
  id: z.string().uuid(),
  lead: leadChoiceSchema,
  type: z.enum(FOLLOW_UP_TYPES, { message: "Choose a follow-up type." }),
  date: z.string().refine(isRealDate, "Choose a date for the follow-up."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time for the follow-up."),
  notes: z.string().max(1000, "Keep the notes under 1,000 characters."),
});
