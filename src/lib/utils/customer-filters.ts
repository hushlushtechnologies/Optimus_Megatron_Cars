export interface CustomerFilters {
  status?: string;
  accountStatus?: string;
  source?: string;
  location?: string;
  joinedFrom?: string;
  joinedTo?: string;
  tags?: string;
  prm?: string;
  hasActiveDeals?: boolean;
  hasPurchased?: boolean;
}

const ALL_CUSTOMER_FILTER_KEYS: (keyof CustomerFilters)[] = [
  "status",
  "accountStatus",
  "source",
  "location",
  "joinedFrom",
  "joinedTo",
  "tags",
  "prm",
  "hasActiveDeals",
  "hasPurchased",
];

const BOOLEAN_KEYS: (keyof CustomerFilters)[] = ["hasActiveDeals", "hasPurchased"];

export function parseCustomerFilters(searchParams: Record<string, string | undefined>): CustomerFilters {
  const filters: Record<string, string | boolean> = {};

  for (const key of ALL_CUSTOMER_FILTER_KEYS) {
    const raw = searchParams[key];
    if (!raw) continue;

    if (BOOLEAN_KEYS.includes(key)) {
      filters[key] = raw === "true";
    } else {
      filters[key] = raw;
    }
  }

  return filters as CustomerFilters;
}

export function countActiveCustomerFilters(filters: CustomerFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== "").length;
}

export function parseTagIds(filters: CustomerFilters): string[] {
  return filters.tags ? filters.tags.split(",").filter(Boolean) : [];
}
