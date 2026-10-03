import { createClient } from "@/src/lib/supabase/server";
import type { InventoryFilters } from "@/src/lib/utils/inventory-filters";

export interface InventoryCarRow {
  id: string;
  stock_id: string;
  vin: string | null;
  slug: string;
  display_title: string;
  manufacturing_year: number;
  mileage_km: number | null;
  regular_price: number | null;
  exterior_color_name: string | null;
  exterior_color_hex: string | null;
  warranty_available: boolean;
  trade_in_available: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;

  brand: { name: string } | null;
  model: { name: string } | null;
  variant: { name: string } | null;
  location: { name: string } | null;
  collection: { name: string } | null;
  fuel_type: { name: string } | null;
  transmission: { name: string } | null;
  drive_type: { name: string } | null;

  availability_status: {
    name: string;
    color_hex: string;
    slug: string;
  } | null;

  publishing_status: {
    name: string;
    color_hex: string;
    slug: string;
  } | null;

  media: {
    url: string;
    is_featured: boolean;
    sort_order: number;
  }[];
}

export interface InventoryMetrics {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  comingSoon: number;
  draft: number;
  totalChange: number;
  totalTrend: number[];
}

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  "recently-updated": { column: "updated_at", ascending: false },
  "price-asc": { column: "regular_price", ascending: true },
  "price-desc": { column: "regular_price", ascending: false },
  "year-desc": { column: "manufacturing_year", ascending: false },
  "year-asc": { column: "manufacturing_year", ascending: true },
  "mileage-asc": { column: "mileage_km", ascending: true },
  "mileage-desc": { column: "mileage_km", ascending: false },
};

export async function getInventoryMetrics(): Promise<InventoryMetrics> {
  const supabase = await createClient();

  const { data: statuses } = await supabase.from("vehicle_statuses").select("id, slug, category");

  const findStatusId = (category: string, slug: string) =>
    statuses?.find((s) => s.category === category && s.slug === slug)?.id;

  const availableId = findStatusId("availability", "available");
  const reservedId = findStatusId("availability", "reserved");
  const soldId = findStatusId("availability", "sold");
  const comingSoonId = findStatusId("availability", "coming-soon");
  const draftId = findStatusId("publishing", "draft");

  const countFor = (statusId: string | undefined, column: string) =>
    statusId
      ? supabase
          .from("cars")
          .select("*", { count: "exact", head: true })
          .is("archived_at", null)
          .eq(column, statusId)
      : Promise.resolve({ count: 0 });

  const [totalRes, availableRes, reservedRes, soldRes, comingSoonRes, draftRes] = await Promise.all([
    supabase.from("cars").select("*", { count: "exact", head: true }).is("archived_at", null),
    countFor(availableId, "availability_status_id"),
    countFor(reservedId, "availability_status_id"),
    countFor(soldId, "availability_status_id"),
    countFor(comingSoonId, "availability_status_id"),
    countFor(draftId, "publishing_status_id"),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentCars } = await supabase
    .from("cars")
    .select("created_at")
    .is("archived_at", null)
    .gte("created_at", sevenDaysAgo.toISOString());

  const totalTrend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + i);
    const dayKey = day.toDateString();
    return (recentCars ?? []).filter((c) => new Date(c.created_at).toDateString() === dayKey).length;
  });

  const totalChange = (totalTrend[6] ?? 0) - (totalTrend[5] ?? 0);

  return {
    total: totalRes.count ?? 0,
    totalChange,
    totalTrend,
    available: availableRes.count ?? 0,
    reserved: reservedRes.count ?? 0,
    sold: soldRes.count ?? 0,
    comingSoon: comingSoonRes.count ?? 0,
    draft: draftRes.count ?? 0,
  };
}

interface GetInventoryCarsParams {
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  archived?: boolean;
  filters?: InventoryFilters;
}

export async function getInventoryCars({
  search,
  sort = "newest",
  page = 1,
  pageSize = 25,
  archived = false,
  filters = {},
}: GetInventoryCarsParams) {
  const supabase = await createClient();

  let query = supabase.from("cars").select(
    `
    id, stock_id, vin, slug, display_title, manufacturing_year, mileage_km,
    regular_price, exterior_color_name, exterior_color_hex,
    warranty_available, trade_in_available, created_at, updated_at, archived_at,
    brand:brands(name), model:models(name), variant:variants(name),
    location:locations(name), collection:collections(name),
    fuel_type:fuel_types(name), transmission:transmission_types(name), drive_type:drive_types(name),
    availability_status:vehicle_statuses!cars_availability_status_id_fkey(name, color_hex, slug),
    publishing_status:vehicle_statuses!cars_publishing_status_id_fkey(name, color_hex, slug),
    media:car_media(url, is_featured, sort_order)
  `,
    { count: "exact" },
  );

  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  if (search) {
    query = query.or(`display_title.ilike.%${search}%,stock_id.ilike.%${search}%,vin.ilike.%${search}%`);
  }

  if (filters.brand) query = query.eq("brand_id", filters.brand);
  if (filters.model) query = query.eq("model_id", filters.model);
  if (filters.location) query = query.eq("location_id", filters.location);
  if (filters.collection) query = query.eq("collection_id", filters.collection);
  if (filters.status) query = query.eq("availability_status_id", filters.status);
  if (filters.bodyType) query = query.eq("body_type_id", filters.bodyType);
  if (filters.fuelType) query = query.eq("fuel_type_id", filters.fuelType);
  if (filters.transmission) query = query.eq("transmission_id", filters.transmission);
  if (filters.driveType) query = query.eq("drive_type_id", filters.driveType);
  if (filters.promotion) query = query.eq("promotion_id", filters.promotion);
  if (filters.warranty) query = query.eq("warranty_available", true);
  if (filters.tradeIn) query = query.eq("trade_in_available", true);
  if (filters.yearMin !== undefined) query = query.gte("manufacturing_year", filters.yearMin);
  if (filters.yearMax !== undefined) query = query.lte("manufacturing_year", filters.yearMax);
  if (filters.priceMin !== undefined) query = query.gte("regular_price", filters.priceMin);
  if (filters.priceMax !== undefined) query = query.lte("regular_price", filters.priceMax);
  if (filters.mileageMin !== undefined) query = query.gte("mileage_km", filters.mileageMin);
  if (filters.mileageMax !== undefined) query = query.lte("mileage_km", filters.mileageMax);

  const sortConfig = SORT_MAP[sort] ?? SORT_MAP.newest;
  query = query.order(sortConfig.column, {
    ascending: sortConfig.ascending,
    nullsFirst: false,
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getInventoryCars error:", error);
    return { rows: [] as InventoryCarRow[], totalCount: 0 };
  }

  return {
    rows: (data ?? []) as unknown as InventoryCarRow[],
    totalCount: count ?? 0,
  };
}

interface FilterLookupOption {
  id: string;
  name: string;
}

export interface FilterLookups {
  brands: FilterLookupOption[];
  models: (FilterLookupOption & { brand_id: string })[];
  locations: FilterLookupOption[];
  collections: FilterLookupOption[];
  availabilityStatuses: FilterLookupOption[];
  bodyTypes: FilterLookupOption[];
  fuelTypes: FilterLookupOption[];
  transmissionTypes: FilterLookupOption[];
  driveTypes: FilterLookupOption[];
  promotions: FilterLookupOption[];
}

export async function getFilterLookups(): Promise<FilterLookups> {
  const supabase = await createClient();

  const [
    brands,
    models,
    locations,
    collections,
    statuses,
    bodyTypes,
    fuelTypes,
    transmissionTypes,
    driveTypes,
    promotions,
  ] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("models").select("id, name, brand_id").eq("is_active", true).order("name"),
    supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("collections").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("vehicle_statuses")
      .select("id, name")
      .eq("category", "availability")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("body_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("fuel_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("transmission_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("drive_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("promotions").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  return {
    brands: brands.data ?? [],
    models: models.data ?? [],
    locations: locations.data ?? [],
    collections: collections.data ?? [],
    availabilityStatuses: statuses.data ?? [],
    bodyTypes: bodyTypes.data ?? [],
    fuelTypes: fuelTypes.data ?? [],
    transmissionTypes: transmissionTypes.data ?? [],
    driveTypes: driveTypes.data ?? [],
    promotions: promotions.data ?? [],
  };
}

export interface ExportRow {
  stock_id: string;
  display_title: string;
  manufacturing_year: number;
  regular_price: number | null;
  mileage_km: number | null;
  created_at: string;
  brand: string | null;
  model: string | null;
  variant: string | null;
  location: string | null;
  collection: string | null;
  status: string | null;
  fuel: string | null;
  transmission: string | null;
}

interface ExportRowFromSupabase {
  stock_id: string;
  display_title: string;
  manufacturing_year: number;
  regular_price: number | null;
  mileage_km: number | null;
  created_at: string;
  brand: { name: string } | null;
  model: { name: string } | null;
  variant: { name: string } | null;
  location: { name: string } | null;
  collection: { name: string } | null;
  fuel_type: { name: string } | null;
  transmission: { name: string } | null;
  availability_status: { name: string } | null;
}

const EXPORT_ROW_LIMIT = 2000;

interface GetExportRowsParams {
  scope: "current" | "selected";
  ids?: string[];
  search?: string;
  archived?: boolean;
  filters?: InventoryFilters;
}

export async function getExportRows({
  scope,
  ids,
  search,
  archived = false,
  filters = {},
}: GetExportRowsParams): Promise<ExportRow[]> {
  const supabase = await createClient();

  let query = supabase.from("cars").select(`
    stock_id, display_title, manufacturing_year, regular_price, mileage_km, created_at,
    brand:brands(name), model:models(name), variant:variants(name),
    location:locations(name), collection:collections(name),
    fuel_type:fuel_types(name), transmission:transmission_types(name),
    availability_status:vehicle_statuses!cars_availability_status_id_fkey(name)
  `);

  if (scope === "selected") {
    if (!ids || ids.length === 0) return [];
    query = query.in("id", ids);
  } else {
    query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

    if (search) {
      query = query.or(`display_title.ilike.%${search}%,stock_id.ilike.%${search}%,vin.ilike.%${search}%`);
    }
    if (filters.brand) query = query.eq("brand_id", filters.brand);
    if (filters.model) query = query.eq("model_id", filters.model);
    if (filters.location) query = query.eq("location_id", filters.location);
    if (filters.collection) query = query.eq("collection_id", filters.collection);
    if (filters.status) query = query.eq("availability_status_id", filters.status);
    if (filters.bodyType) query = query.eq("body_type_id", filters.bodyType);
    if (filters.fuelType) query = query.eq("fuel_type_id", filters.fuelType);
    if (filters.transmission) query = query.eq("transmission_id", filters.transmission);
    if (filters.driveType) query = query.eq("drive_type_id", filters.driveType);
    if (filters.promotion) query = query.eq("promotion_id", filters.promotion);
    if (filters.warranty) query = query.eq("warranty_available", true);
    if (filters.tradeIn) query = query.eq("trade_in_available", true);
    if (filters.yearMin !== undefined) query = query.gte("manufacturing_year", filters.yearMin);
    if (filters.yearMax !== undefined) query = query.lte("manufacturing_year", filters.yearMax);
    if (filters.priceMin !== undefined) query = query.gte("regular_price", filters.priceMin);
    if (filters.priceMax !== undefined) query = query.lte("regular_price", filters.priceMax);
    if (filters.mileageMin !== undefined) query = query.gte("mileage_km", filters.mileageMin);
    if (filters.mileageMax !== undefined) query = query.lte("mileage_km", filters.mileageMax);
  }

  query = query.order("created_at", { ascending: false }).limit(EXPORT_ROW_LIMIT);

  const { data, error } = await query;
  if (error) {
    console.error("getExportRows error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as ExportRowFromSupabase[];

  return rows.map((row) => ({
    stock_id: row.stock_id,
    display_title: row.display_title,
    manufacturing_year: row.manufacturing_year,
    regular_price: row.regular_price,
    mileage_km: row.mileage_km,
    created_at: row.created_at,
    brand: row.brand?.name ?? null,
    model: row.model?.name ?? null,
    variant: row.variant?.name ?? null,
    location: row.location?.name ?? null,
    collection: row.collection?.name ?? null,
    status: row.availability_status?.name ?? null,
    fuel: row.fuel_type?.name ?? null,
    transmission: row.transmission?.name ?? null,
  }));
}
