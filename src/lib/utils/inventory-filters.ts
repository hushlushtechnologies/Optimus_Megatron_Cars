export interface InventoryFilters {
  brand?: string;
  model?: string;
  location?: string;
  collection?: string;
  status?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  driveType?: string;
  warranty?: boolean;
  tradeIn?: boolean;
  promotion?: string;
}

const NUMBER_KEYS: (keyof InventoryFilters)[] = [
  "yearMin",
  "yearMax",
  "priceMin",
  "priceMax",
  "mileageMin",
  "mileageMax",
];
const BOOLEAN_KEYS: (keyof InventoryFilters)[] = ["warranty", "tradeIn"];

const ALL_FILTER_KEYS: (keyof InventoryFilters)[] = [
  "brand",
  "model",
  "location",
  "collection",
  "status",
  "yearMin",
  "yearMax",
  "priceMin",
  "priceMax",
  "mileageMin",
  "mileageMax",
  "bodyType",
  "fuelType",
  "transmission",
  "driveType",
  "warranty",
  "tradeIn",
  "promotion",
];

export function parseInventoryFilters(searchParams: Record<string, string | undefined>): InventoryFilters {
  const filters: Record<string, string | number | boolean> = {};

  for (const key of ALL_FILTER_KEYS) {
    const raw = searchParams[key];
    if (!raw) continue;

    if (NUMBER_KEYS.includes(key)) {
      const num = Number(raw);
      if (!Number.isNaN(num)) filters[key] = num;
    } else if (BOOLEAN_KEYS.includes(key)) {
      filters[key] = raw === "true";
    } else {
      filters[key] = raw;
    }
  }

  return filters as InventoryFilters;
}

export function countActiveFilters(filters: InventoryFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== "").length;
}
