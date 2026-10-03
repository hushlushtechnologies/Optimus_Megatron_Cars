import { z } from "zod";

// Accepts 05XXXXXXXX, +9715XXXXXXXX, or 009715XXXXXXXX — normalized to +971 on save.
const UAE_MOBILE_PATTERN = /^(?:\+971|00971|0)?5\d{8}$/;

export const addCustomerSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(60),
  last_name: z.string().min(1, "Last name is required").max(60),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().regex(UAE_MOBILE_PATTERN, "Enter a valid UAE mobile number (e.g. 05XXXXXXXX)"),
  alternative_phone: z.string().max(20).nullable().optional(),
  location_id: z.string().uuid().nullable().optional().or(z.literal("")),
  address: z.string().max(300).nullable().optional(),
  preferred_language: z.enum(["English", "Arabic", "Other"]),
  source_id: z.string().uuid("Select a source"),
  source_detail: z.string().max(120).nullable().optional(),
  lifecycle_status: z.enum(["Prospect", "Active", "VIP", "Inactive", "Do Not Contact"]),
  primary_relationship_manager_id: z.string().uuid().nullable().optional().or(z.literal("")),
  internal_notes: z.string().max(1000).nullable().optional(),
  create_login: z.boolean(),
});

export type AddCustomerValues = z.infer<typeof addCustomerSchema>;

export const addCustomerDefaults: AddCustomerValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  alternative_phone: "",
  location_id: "",
  address: "",
  preferred_language: "English",
  source_id: "",
  source_detail: "",
  lifecycle_status: "Prospect",
  primary_relationship_manager_id: "",
  internal_notes: "",
  create_login: false,
};

export function normalizeUaePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^00971|^971|^0/, "");
  return `+971${local}`;
}
