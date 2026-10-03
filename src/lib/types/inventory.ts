export interface LookupOption {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export interface Brand extends LookupOption {
  logo_url: string | null;
}

export interface Model extends LookupOption {
  brand_id: string;
}

export interface Variant {
  id: string;
  model_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export interface Collection extends LookupOption {
  description: string | null;
  hero_image_url: string | null;
}

export interface VehicleStatus extends LookupOption {
  category: "availability" | "publishing";
  color_hex: string;
}

export type RegionalSpec = "GCC" | "European" | "American" | "Japanese" | "Other";
export type CarCondition = "Brand New" | "Excellent" | "Very Good" | "Good" | "Fair";

export interface Car {
  id: string;
  stock_id: string;
  vin: string | null;
  slug: string;
  display_title: string;

  brand_id: string | null;
  model_id: string | null;
  variant_id: string | null;
  variant_text: string | null;
  manufacturing_year: number;

  registration_number: string | null;
  show_registration_number: boolean;

  location_id: string | null;
  collection_id: string | null;

  availability_status_id: string | null;
  publishing_status_id: string | null;

  car_condition: CarCondition | null;
  car_condition_description: string | null;
  regional_spec: RegionalSpec | null;

  mileage_km: number | null;
  fuel_type_id: string | null;
  transmission_id: string | null;
  drive_type_id: string | null;
  body_type_id: string | null;
  engine: string | null;
  engine_capacity_cc: number | null;
  cylinders: number | null;
  horsepower: number | null;
  torque_nm: number | null;
  doors: number | null;
  seats: number | null;
  number_of_keys: number | null;
  total_units: number;
  available_units: number;

  exterior_color_name: string | null;
  exterior_color_hex: string | null;
  paint_finish_id: string | null;
  interior_color_name: string | null;
  interior_color_hex: string | null;
  interior_material: string | null;

  regular_price: number | null;
  finance_available: boolean;
  reservation_available: boolean;
  reservation_token_override: number | null;
  trade_in_available: boolean;

  warranty_available: boolean;

  megatron_certified: boolean;
  featured: boolean;
  new_arrival: boolean;
  coming_soon: boolean;
  show_on_homepage: boolean;

  seo_title: string | null;
  seo_description: string | null;

  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface CarMedia {
  id: string;
  car_id: string;
  media_type: "image" | "video" | "audio";
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  subtype: string | null;
  file_size_bytes: number | null;
  is_featured: boolean;
  sort_order: number;
}
