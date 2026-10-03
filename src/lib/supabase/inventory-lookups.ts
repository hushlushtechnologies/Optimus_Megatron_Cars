import { createClient } from "@/src/lib/supabase/server";

export interface PromotionLookup {
  id: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

export interface AddCarLookups {
  brands: { id: string; name: string }[];
  models: { id: string; name: string; brand_id: string }[];
  variants: { id: string; name: string; model_id: string }[];
  locations: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  availabilityStatuses: { id: string; name: string }[];
  fuelTypes: { id: string; name: string }[];
  transmissionTypes: { id: string; name: string }[];
  driveTypes: { id: string; name: string }[];
  bodyTypes: { id: string; name: string }[];
  paintFinishes: { id: string; name: string }[];
  promotions: PromotionLookup[];
  warrantyTypes: { id: string; name: string }[];
}

export async function getAddCarLookups(): Promise<AddCarLookups> {
  const supabase = await createClient();

  const [
    brands,
    models,
    variants,
    locations,
    collections,
    statuses,
    fuelTypes,
    transmissionTypes,
    driveTypes,
    bodyTypes,
    paintFinishes,
    promotions,
    warrantyTypes,
  ] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("models").select("id, name, brand_id").eq("is_active", true).order("name"),
    supabase.from("variants").select("id, name, model_id").eq("is_active", true).order("name"),
    supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("collections").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("vehicle_statuses")
      .select("id, name")
      .eq("category", "availability")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("fuel_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("transmission_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("drive_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("body_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("paint_finish_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("promotions")
      .select("id, name, discount_type, discount_value")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("warranty_types").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  return {
    brands: brands.data ?? [],
    models: models.data ?? [],
    variants: variants.data ?? [],
    locations: locations.data ?? [],
    collections: collections.data ?? [],
    availabilityStatuses: statuses.data ?? [],
    fuelTypes: fuelTypes.data ?? [],
    transmissionTypes: transmissionTypes.data ?? [],
    driveTypes: driveTypes.data ?? [],
    bodyTypes: bodyTypes.data ?? [],
    paintFinishes: paintFinishes.data ?? [],
    promotions: (promotions.data ?? []) as PromotionLookup[],
    warrantyTypes: warrantyTypes.data ?? [],
  };
}

const CAR_DRAFT_COLUMNS = `
  id, display_title, brand_id, model_id, variant_id, variant_text, manufacturing_year,
  stock_id, vin, location_id, collection_id, availability_status_id,
  car_condition, car_condition_description, regional_spec,
  registration_number, show_registration_number,
  mileage_km, fuel_type_id, transmission_id, drive_type_id, body_type_id,
  engine, engine_capacity_cc, cylinders, horsepower, torque_nm,
  doors, seats, number_of_keys, total_units, available_units,
  exterior_color_name, exterior_color_hex, paint_finish_id,
  interior_color_name, interior_color_hex, interior_material,
  regular_price, finance_available, reservation_available, reservation_token_override,
  promotion_id, trade_in_available,
  warranty_available, warranty_type_id, warranty_provider, warranty_start_date,
  warranty_expiry_date, warranty_mileage_limit, warranty_notes,
  megatron_certified, inspection_status, inspection_date, inspection_score, inspection_notes,
  slug, featured, new_arrival, coming_soon, show_on_homepage, publish_date, seo_title, seo_description,
  publishing_status:vehicle_statuses!cars_publishing_status_id_fkey(slug)
`;

export async function getCarDraft(carId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("cars").select(CAR_DRAFT_COLUMNS).eq("id", carId).maybeSingle();
  return data;
}

export async function getCarBasicInfo(carId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cars")
    .select(
      "id, display_title, brand_id, model_id, variant_id, variant_text, manufacturing_year, stock_id, vin, location_id, collection_id, availability_status_id, car_condition, car_condition_description, regional_spec, registration_number, show_registration_number",
    )
    .eq("id", carId)
    .maybeSingle();

  return data;
}
