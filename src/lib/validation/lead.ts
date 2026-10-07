import { z } from "zod";

export const addLeadSchema = z
  .object({
    create_new_customer: z.boolean(),
    customer_id: z.string().uuid().nullable().optional(),

    new_first_name: z.string().optional(),
    new_last_name: z.string().optional(),
    new_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    new_phone: z.string().optional(),

    car_id: z.string().uuid().nullable().optional(),

    source_id: z.string().uuid().nullable().optional(),
    source_detail: z.string().nullable().optional(),

    stage_id: z.string().uuid("Select a stage"),
    temperature: z.enum(["Hot", "Warm", "Cold"]),
    assigned_staff_id: z.string().uuid().nullable().optional(),

    tag_ids: z.array(z.string()).default([]),

    follow_up_date: z.string().optional().or(z.literal("")),
    follow_up_time: z.string().optional().or(z.literal("")),

    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.create_new_customer) {
      if (!data.new_first_name?.trim())
        ctx.addIssue({ code: "custom", message: "First name is required", path: ["new_first_name"] });
      if (!data.new_last_name?.trim())
        ctx.addIssue({ code: "custom", message: "Last name is required", path: ["new_last_name"] });
      if (!data.new_email?.trim())
        ctx.addIssue({ code: "custom", message: "Email is required", path: ["new_email"] });
      if (!data.new_phone?.trim())
        ctx.addIssue({ code: "custom", message: "Phone is required", path: ["new_phone"] });
    } else if (!data.customer_id) {
      ctx.addIssue({ code: "custom", message: "Select an existing customer", path: ["customer_id"] });
    }
  });

export type AddLeadValues = z.infer<typeof addLeadSchema>;

export const addLeadDefaults: AddLeadValues = {
  create_new_customer: false,
  customer_id: null,
  new_first_name: "",
  new_last_name: "",
  new_email: "",
  new_phone: "",
  car_id: null,
  source_id: null,
  source_detail: "",
  stage_id: "",
  temperature: "Warm",
  assigned_staff_id: null,
  tag_ids: [],
  follow_up_date: "",
  follow_up_time: "",
  notes: "",
};
