import { z } from "zod";

const currentYear = new Date().getFullYear();

export const basicInfoSchema = z.object({
  display_title: z.string().min(3, "Enter at least 3 characters").max(120, "Keep it under 120 characters"),

  brand_id: z.string().uuid("Select a brand"),
  model_id: z.string().uuid("Select a model"),

  variant_id: z.string().uuid().nullable().optional(),
  variant_text: z.string().max(80).nullable().optional(),

  manufacturing_year: z.coerce
    .number()
    .int("Enter a valid year")
    .min(1980, "Enter a realistic year")
    .max(currentYear + 1, `Year cannot be later than ${currentYear + 1}`),

  stock_id: z.string().min(2, "Stock ID is required").max(40),

  vin: z.string().max(17, "VIN cannot be longer than 17 characters").nullable().optional().or(z.literal("")),

  location_id: z.string().uuid("Select a location"),

  collection_id: z.string().uuid().nullable().optional().or(z.literal("")),

  availability_status_id: z.string().uuid("Select a status"),

  car_condition: z
    .enum(["Brand New", "Excellent", "Very Good", "Good", "Fair"])
    .nullable()
    .optional()
    .or(z.literal("")),

  car_condition_description: z.string().max(500).nullable().optional(),

  regional_spec: z
    .enum(["GCC", "European", "American", "Japanese", "Other"])
    .nullable()
    .optional()
    .or(z.literal("")),

  registration_number: z.string().max(40).nullable().optional(),

  show_registration_number: z.boolean(),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

export const basicInfoDefaults: BasicInfoValues = {
  display_title: "",
  brand_id: "",
  model_id: "",
  variant_id: null,
  variant_text: null,
  manufacturing_year: currentYear,
  stock_id: "",
  vin: "",
  location_id: "",
  collection_id: "",
  availability_status_id: "",
  car_condition: "",
  car_condition_description: "",
  regional_spec: "",
  registration_number: "",
  show_registration_number: false,
};

// Specifications

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.coerce.number().nullable(),
);

const optionalUuid = z.string().uuid().nullable().optional().or(z.literal(""));

export const specificationsSchema = z.object({
  mileage_km: optionalNumber,
  fuel_type_id: optionalUuid,
  transmission_id: optionalUuid,
  drive_type_id: optionalUuid,
  body_type_id: optionalUuid,
  engine: z.string().max(80).nullable().optional(),
  engine_capacity_cc: optionalNumber,
  cylinders: optionalNumber,
  horsepower: optionalNumber,
  torque_nm: optionalNumber,
  doors: optionalNumber,
  seats: optionalNumber,
  number_of_keys: optionalNumber,
  total_units: z.coerce.number().int().min(0, "Cannot be negative"),
  available_units: z.coerce.number().int().min(0, "Cannot be negative"),
});

export type SpecificationsValues = z.infer<typeof specificationsSchema>;

export const specificationsDefaults: SpecificationsValues = {
  mileage_km: null,
  fuel_type_id: "",
  transmission_id: "",
  drive_type_id: "",
  body_type_id: "",
  engine: "",
  engine_capacity_cc: null,
  cylinders: null,
  horsepower: null,
  torque_nm: null,
  doors: null,
  seats: null,
  number_of_keys: null,
  total_units: 1,
  available_units: 1,
};

// Exterior & Interior

export const exteriorInteriorSchema = z.object({
  exterior_color_name: z.string().max(60).nullable().optional(),
  exterior_color_hex: z.string().max(9).nullable().optional(),
  paint_finish_id: optionalUuid,
  interior_color_name: z.string().max(60).nullable().optional(),
  interior_color_hex: z.string().max(9).nullable().optional(),
  interior_material: z.string().max(60).nullable().optional(),
});

export type ExteriorInteriorValues = z.infer<typeof exteriorInteriorSchema>;

export const exteriorInteriorDefaults: ExteriorInteriorValues = {
  exterior_color_name: "",
  exterior_color_hex: "#FFFFFF",
  paint_finish_id: "",
  interior_color_name: "",
  interior_color_hex: "#000000",
  interior_material: "",
};

// Pricing

export const pricingSchema = z.object({
  regular_price: optionalNumber,
  finance_available: z.boolean(),
  reservation_available: z.boolean(),
  reservation_token_override: optionalNumber,
  promotion_id: optionalUuid,
  trade_in_available: z.boolean(),
});

export type PricingValues = z.infer<typeof pricingSchema>;

export const pricingDefaults: PricingValues = {
  regular_price: null,
  finance_available: false,
  reservation_available: true,
  reservation_token_override: null,
  promotion_id: "",
  trade_in_available: false,
};

// Warranty & Inspection
// IMPORTANT: keep the raw object schema separate from its refined version.
// addCarDraftSchema below merges the RAW object (warrantyInspectionObjectSchema),
// never the refined one — .refine() wraps a schema in a way that isn't
// guaranteed to expose .innerType() across Zod versions, so we sidestep that
// entirely by never needing to unwrap a refined schema in the first place.

const optionalDateString = z.string().nullable().optional().or(z.literal(""));

export const warrantyInspectionObjectSchema = z.object({
  warranty_available: z.boolean(),
  warranty_type_id: optionalUuid,
  warranty_provider: z.string().max(80).nullable().optional(),
  warranty_start_date: optionalDateString,
  warranty_expiry_date: optionalDateString,
  warranty_mileage_limit: optionalNumber,
  warranty_notes: z.string().max(500).nullable().optional(),

  megatron_certified: z.boolean(),
  inspection_status: z.enum(["Not Inspected", "Scheduled", "Passed", "Failed"]),
  inspection_date: optionalDateString,
  inspection_score: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().min(0, "Must be 0–100").max(100, "Must be 0–100").nullable(),
  ),
  inspection_notes: z.string().max(500).nullable().optional(),
});

export const warrantyInspectionSchema = warrantyInspectionObjectSchema.refine(
  (data) =>
    !data.warranty_start_date ||
    !data.warranty_expiry_date ||
    data.warranty_expiry_date >= data.warranty_start_date,
  {
    message: "Expiry date must be on or after the start date",
    path: ["warranty_expiry_date"],
  },
);

export type WarrantyInspectionValues = z.infer<typeof warrantyInspectionObjectSchema>;

export const warrantyInspectionDefaults: WarrantyInspectionValues = {
  warranty_available: false,
  warranty_type_id: "",
  warranty_provider: "",
  warranty_start_date: "",
  warranty_expiry_date: "",
  warranty_mileage_limit: null,
  warranty_notes: "",
  megatron_certified: false,
  inspection_status: "Not Inspected",
  inspection_date: "",
  inspection_score: null,
  inspection_notes: "",
};

// Publishing

export const publishingSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug is required")
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  featured: z.boolean(),
  new_arrival: z.boolean(),
  coming_soon: z.boolean(),
  show_on_homepage: z.boolean(),
  publish_date: optionalDateString,
  seo_title: z.string().max(70, "Keep under 70 characters for best search results").nullable().optional(),
  seo_description: z
    .string()
    .max(160, "Keep under 160 characters for best search results")
    .nullable()
    .optional(),
});

export type PublishingValues = z.infer<typeof publishingSchema>;

export const publishingDefaults: PublishingValues = {
  slug: "",
  featured: false,
  new_arrival: false,
  coming_soon: false,
  show_on_homepage: false,
  publish_date: "",
  seo_title: "",
  seo_description: "",
};

// Combined Add Car Draft

export const addCarDraftSchema = basicInfoSchema
  .merge(specificationsSchema)
  .merge(exteriorInteriorSchema)
  .merge(pricingSchema)
  .merge(warrantyInspectionObjectSchema)
  .merge(publishingSchema)
  .refine((data) => data.available_units <= data.total_units, {
    message: "Available Units cannot exceed Total Units",
    path: ["available_units"],
  })
  .refine(
    (data) =>
      !data.warranty_start_date ||
      !data.warranty_expiry_date ||
      data.warranty_expiry_date >= data.warranty_start_date,
    {
      message: "Expiry date must be on or after the start date",
      path: ["warranty_expiry_date"],
    },
  );

export type AddCarDraftValues = z.infer<typeof addCarDraftSchema>;

export const addCarDraftDefaults: AddCarDraftValues = {
  ...basicInfoDefaults,
  ...specificationsDefaults,
  ...exteriorInteriorDefaults,
  ...pricingDefaults,
  ...warrantyInspectionDefaults,
  ...publishingDefaults,
};

// A stricter check run only before Publish — Draft saves never require these.
export function getPublishBlockers(values: AddCarDraftValues, hasImages: boolean): string[] {
  const blockers: string[] = [];
  if (!values.regular_price || values.regular_price <= 0) blockers.push("Set a Regular Price");
  if (!hasImages) blockers.push("Upload at least one image");
  return blockers;
}
