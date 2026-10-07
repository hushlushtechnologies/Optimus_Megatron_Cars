export interface LeadFilters {
  stage?: string;
  assignedStaff?: string;
  source?: string;
  temperature?: string;
  tags?: string; // comma-separated tag ids
  brand?: string;
  vehicle?: string; // a specific car id
  location?: string;
  followUpStatus?: "overdue" | "upcoming" | "none";
  createdFrom?: string;
  createdTo?: string;
  lostReason?: string;
}

const ALL_LEAD_FILTER_KEYS: (keyof LeadFilters)[] = [
  "stage",
  "assignedStaff",
  "source",
  "temperature",
  "tags",
  "brand",
  "vehicle",
  "location",
  "followUpStatus",
  "createdFrom",
  "createdTo",
  "lostReason",
];

export function parseLeadFilters(searchParams: Record<string, string | undefined>): LeadFilters {
  const filters: Record<string, string> = {};
  for (const key of ALL_LEAD_FILTER_KEYS) {
    const raw = searchParams[key];
    if (raw) filters[key] = raw;
  }
  return filters as LeadFilters;
}

export function countActiveLeadFilters(filters: LeadFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== "").length;
}

export function parseLeadTagIds(filters: LeadFilters): string[] {
  return filters.tags ? filters.tags.split(",").filter(Boolean) : [];
}
