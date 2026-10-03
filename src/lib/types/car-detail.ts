export interface CarDetailLookupRef {
  name: string;
}

export interface CarDetailStatus {
  id: string;
  name: string;
  slug: string;
  color_hex: string;
}

export interface CarDetailPromotion {
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

export interface CarDetailMedia {
  url: string;
  is_featured: boolean;
  sort_order: number;
}

export interface CarDetail {
  id: string;
  stock_id: string;
  vin: string | null;
  slug: string;
  display_title: string;
  manufacturing_year: number;

  brand: CarDetailLookupRef | null;
  model: CarDetailLookupRef | null;
  variant: CarDetailLookupRef | null;
  variant_text: string | null;

  registration_number: string | null;
  show_registration_number: boolean;

  location: CarDetailLookupRef | null;
  collection: CarDetailLookupRef | null;

  availability_status: CarDetailStatus | null;
  publishing_status: CarDetailStatus | null;

  car_condition: string | null;
  car_condition_description: string | null;
  regional_spec: string | null;

  mileage_km: number | null;
  fuel_type: CarDetailLookupRef | null;
  transmission: CarDetailLookupRef | null;
  drive_type: CarDetailLookupRef | null;
  body_type: CarDetailLookupRef | null;
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
  paint_finish: CarDetailLookupRef | null;
  interior_color_name: string | null;
  interior_color_hex: string | null;
  interior_material: string | null;

  regular_price: number | null;
  promotion: CarDetailPromotion | null;
  finance_available: boolean;
  reservation_available: boolean;
  reservation_token_override: number | null;
  trade_in_available: boolean;

  warranty_available: boolean;
  warranty_type: CarDetailLookupRef | null;
  warranty_provider: string | null;
  warranty_start_date: string | null;
  warranty_expiry_date: string | null;
  warranty_mileage_limit: number | null;
  warranty_notes: string | null;

  megatron_certified: boolean;
  inspection_status: string;
  inspection_date: string | null;
  inspection_score: number | null;
  inspection_notes: string | null;
  inspection_certificate_url: string | null;

  featured: boolean;
  new_arrival: boolean;
  coming_soon: boolean;
  show_on_homepage: boolean;
  publish_date: string | null;
  seo_title: string | null;
  seo_description: string | null;

  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;

  media: CarDetailMedia[];
}
