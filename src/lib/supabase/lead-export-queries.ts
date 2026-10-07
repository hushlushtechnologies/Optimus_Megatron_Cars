import { createClient } from "@/src/lib/supabase/server";
import type { LeadFilters } from "@/src/lib/utils/lead-filters";

export interface LeadExportRow {
  lead_number: string;
  customer_name: string;
  customer_number: string;
  vehicle_title: string | null;
  brand_name: string | null;
  source_name: string | null;
  stage_name: string;
  temperature: string;
  assigned_staff_name: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  last_activity_at: string | null;
  lost_reason_name: string | null;
}

const EXPORT_ROW_LIMIT = 2000;

interface GetLeadExportRowsParams {
  scope: "current" | "selected";
  ids?: string[];
  search?: string;
  archived?: boolean;
  filters?: LeadFilters;
}

interface RawExportRow {
  lead_number: string;
  temperature: string;
  assigned_staff_id: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  last_activity_at: string | null;
  stage: { name: string };
  customer: { full_name: string; customer_number: string };
  car: { display_title: string; brand: { name: string } | null } | null;
  source: { name: string } | null;
  lost_reason: { name: string } | null;
}

export async function getLeadExportRows({
  scope,
  ids,
  search,
  archived = false,
  filters = {},
}: GetLeadExportRowsParams): Promise<LeadExportRow[]> {
  const supabase = await createClient();

  // Local re-implementation mirrors buildFilteredLeadsQuery's id-resolution
  // logic from Phase 17 exactly, rather than importing the lead-queries.ts
  // version — importing it here would pull the Table/Kanban data-fetch code
  // path into the export route for no shared benefit, since export needs a
  // different final select shape regardless. The filter semantics stay
  // identical on purpose; only the imports differ.
  let allowedIds: string[] | null = null;

  if (scope === "current" && (search || Object.keys(filters).length > 0)) {
    let idQuery = supabase.from("leads").select("id");
    idQuery = archived ? idQuery.not("archived_at", "is", null) : idQuery.is("archived_at", null);

    if (search) {
      const [{ data: customerMatches }, { data: carMatches }] = await Promise.all([
        supabase
          .from("customer_profiles")
          .select("id")
          .or(`full_name.ilike.%${search}%,customer_number.ilike.%${search}%,phone.ilike.%${search}%`),
        supabase.from("cars").select("id").or(`display_title.ilike.%${search}%,stock_id.ilike.%${search}%`),
      ]);
      const customerIds = (customerMatches ?? []).map((c) => c.id);
      const carIds = (carMatches ?? []).map((c) => c.id);
      const orParts = [`lead_number.ilike.%${search}%`];
      if (customerIds.length) orParts.push(`customer_id.in.(${customerIds.join(",")})`);
      if (carIds.length) orParts.push(`car_id.in.(${carIds.join(",")})`);
      idQuery = idQuery.or(orParts.join(","));
    }

    if (filters.stage) idQuery = idQuery.eq("stage_id", filters.stage);
    if (filters.assignedStaff) idQuery = idQuery.eq("assigned_staff_id", filters.assignedStaff);
    if (filters.source) idQuery = idQuery.eq("source_id", filters.source);
    if (filters.temperature) idQuery = idQuery.eq("temperature", filters.temperature);
    if (filters.vehicle) idQuery = idQuery.eq("car_id", filters.vehicle);
    if (filters.lostReason) idQuery = idQuery.eq("lost_reason_id", filters.lostReason);
    if (filters.createdFrom) idQuery = idQuery.gte("created_at", filters.createdFrom);
    if (filters.createdTo) idQuery = idQuery.lte("created_at", `${filters.createdTo}T23:59:59`);

    if (filters.followUpStatus === "overdue") {
      idQuery = idQuery
        .not("next_follow_up_at", "is", null)
        .lte("next_follow_up_at", new Date().toISOString());
    } else if (filters.followUpStatus === "upcoming") {
      idQuery = idQuery
        .not("next_follow_up_at", "is", null)
        .gt("next_follow_up_at", new Date().toISOString());
    } else if (filters.followUpStatus === "none") {
      idQuery = idQuery.is("next_follow_up_at", null);
    }

    if (filters.brand || filters.location) {
      let carQuery = supabase.from("cars").select("id");
      if (filters.brand) carQuery = carQuery.eq("brand_id", filters.brand);
      if (filters.location) carQuery = carQuery.eq("location_id", filters.location);
      const { data: matchingCars } = await carQuery;
      const carIds = (matchingCars ?? []).map((c) => c.id);
      idQuery = idQuery.in("id", carIds.length ? carIds : ["00000000-0000-0000-0000-000000000000"]);
    }

    const tagIds = filters.tags ? filters.tags.split(",").filter(Boolean) : [];
    if (tagIds.length > 0) {
      const { data: tagLinks } = await supabase.from("lead_tag_links").select("lead_id").in("tag_id", tagIds);
      const leadIds = Array.from(new Set((tagLinks ?? []).map((t) => t.lead_id)));
      idQuery = idQuery.in("id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]);
    }

    const { data: idRows } = await idQuery;
    allowedIds = (idRows ?? []).map((r) => r.id);
    if (allowedIds.length === 0) return [];
  }

  let query = supabase.from("leads").select(`
    lead_number, temperature, assigned_staff_id, next_follow_up_at, created_at, last_activity_at,
    stage:lead_stages(name),
    customer:customer_profiles(full_name, customer_number),
    car:cars(display_title, brand:brands(name)),
    source:customer_sources(name),
    lost_reason:lead_lost_reasons(name)
  `);

  if (scope === "selected") {
    if (!ids || ids.length === 0) return [];
    query = query.in("id", ids);
  } else {
    query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    if (allowedIds) query = query.in("id", allowedIds);
  }

  query = query.order("created_at", { ascending: false }).limit(EXPORT_ROW_LIMIT);

  const { data, error } = await query;
  if (error) {
    console.error("getLeadExportRows error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as RawExportRow[];

  const staffIds = new Set<string>();
  rows.forEach((r) => r.assigned_staff_id && staffIds.add(r.assigned_staff_id));
  const { data: profiles } = staffIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(staffIds))
    : { data: [] };
  const staffName = (id: string | null) =>
    id ? (profiles?.find((p) => p.id === id)?.full_name ?? "Unknown") : null;

  return rows.map((r) => ({
    lead_number: r.lead_number,
    customer_name: r.customer.full_name,
    customer_number: r.customer.customer_number,
    vehicle_title: r.car?.display_title ?? null,
    brand_name: r.car?.brand?.name ?? null,
    source_name: r.source?.name ?? null,
    stage_name: r.stage.name,
    temperature: r.temperature,
    assigned_staff_name: staffName(r.assigned_staff_id),
    next_follow_up_at: r.next_follow_up_at,
    created_at: r.created_at,
    last_activity_at: r.last_activity_at,
    lost_reason_name: r.lost_reason?.name ?? null,
  }));
}
