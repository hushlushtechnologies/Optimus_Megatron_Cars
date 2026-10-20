import { createClient } from "@/src/lib/supabase/server";
import { isUuid, sanitizeSearchTerm } from "@/src/lib/utils/search-term";
import type {
  SearchResult,
  TestDriveCustomerOption,
  TestDriveFormLookups,
  TestDriveFormPrefill,
  TestDriveLeadOption,
  TestDriveVehicleOption,
} from "@/src/lib/types/test-drive";
import { listTestDriveHosts } from "@/src/lib/supabase/test-drive-permissions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const RESULT_LIMIT = 10;

// --- Customers ---

interface RawCustomer {
  id: string;
  full_name: string;
  customer_number: string;
  phone: string;
  profile_photo_url: string | null;
}

const CUSTOMER_COLUMNS = "id, full_name, customer_number, phone, profile_photo_url";

function toCustomerOption(row: RawCustomer): TestDriveCustomerOption {
  return {
    id: row.id,
    full_name: row.full_name,
    customer_number: row.customer_number,
    phone: row.phone,
    photo_url: row.profile_photo_url,
  };
}

export async function searchCustomers(query: string): Promise<SearchResult<TestDriveCustomerOption>> {
  const supabase = await createClient();
  const term = sanitizeSearchTerm(query);

  let request = supabase.from("customer_profiles").select(CUSTOMER_COLUMNS);

  if (term) {
    const pattern = `%${term}%`;
    request = request
      .or(`full_name.ilike.${pattern},customer_number.ilike.${pattern},phone.ilike.${pattern}`)
      .order("full_name", { ascending: true });
  } else {
    // Nothing typed yet: offer the most recently added customers.
    request = request.order("created_at", { ascending: false });
  }

  const { data, error } = await request.limit(RESULT_LIMIT);

  if (error) {
    console.error("searchCustomers error:", error);
    return { results: [], failed: true };
  }

  return { results: ((data ?? []) as unknown as RawCustomer[]).map(toCustomerOption), failed: false };
}

export async function getCustomerById(id: string): Promise<TestDriveCustomerOption | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_profiles")
    .select(CUSTOMER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("getCustomerById error:", error);

  return data ? toCustomerOption(data as unknown as RawCustomer) : null;
}

// --- Vehicles ---

interface RawVehicle {
  id: string;
  display_title: string;
  stock_id: string;
  location_id: string | null;
  brand: { name: string } | null;
  location: { name: string } | null;
}

const VEHICLE_COLUMNS =
  "id, display_title, stock_id, location_id, brand:brands(name), location:locations(name)";

/**
 * Looks up the status name of each vehicle. Kept separate so that if your
 * status table is shaped differently than expected, the search still works
 * and just shows no status instead of failing.
 */
async function getVehicleStatusNames(
  supabase: SupabaseServerClient,
  ids: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (ids.length === 0) return names;

  const { data, error } = await supabase
    .from("cars")
    .select("id, status:availability_status_id(name)")
    .in("id", ids);

  if (error) {
    console.error("getVehicleStatusNames error:", error);
    return names;
  }

  ((data ?? []) as unknown as { id: string; status: { name: string } | null }[]).forEach((row) => {
    if (row.status?.name) names.set(row.id, row.status.name);
  });
  return names;
}

function toVehicleOption(row: RawVehicle, statusName: string | null): TestDriveVehicleOption {
  return {
    id: row.id,
    display_title: row.display_title,
    stock_id: row.stock_id,
    brand_name: row.brand?.name ?? null,
    location_id: row.location_id,
    location_name: row.location?.name ?? null,
    status_name: statusName,
    is_sold: !!statusName && /sold/i.test(statusName),
  };
}

export async function searchVehicles(query: string): Promise<SearchResult<TestDriveVehicleOption>> {
  const supabase = await createClient();
  const term = sanitizeSearchTerm(query);

  // Archived vehicles never appear: they can't be booked.
  let request = supabase.from("cars").select(VEHICLE_COLUMNS).is("archived_at", null);

  if (term) {
    const pattern = `%${term}%`;
    const { data: brandMatches } = await supabase.from("brands").select("id").ilike("name", pattern);
    const brandIds = (brandMatches ?? []).map((b) => b.id);

    const parts = [`display_title.ilike.${pattern}`, `stock_id.ilike.${pattern}`];
    if (brandIds.length > 0) parts.push(`brand_id.in.(${brandIds.join(",")})`);

    request = request.or(parts.join(",")).order("display_title", { ascending: true });
  } else {
    request = request.order("created_at", { ascending: false });
  }

  const { data, error } = await request.limit(RESULT_LIMIT);

  if (error) {
    console.error("searchVehicles error:", error);
    return { results: [], failed: true };
  }

  const rows = (data ?? []) as unknown as RawVehicle[];
  const statuses = await getVehicleStatusNames(
    supabase,
    rows.map((r) => r.id),
  );

  return { results: rows.map((r) => toVehicleOption(r, statuses.get(r.id) ?? null)), failed: false };
}

export async function getVehicleById(id: string): Promise<TestDriveVehicleOption | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cars")
    .select(VEHICLE_COLUMNS)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (error) console.error("getVehicleById error:", error);
  if (!data) return null;

  const row = data as unknown as RawVehicle;
  const statuses = await getVehicleStatusNames(supabase, [row.id]);
  return toVehicleOption(row, statuses.get(row.id) ?? null);
}

// --- Leads ---

interface RawLead {
  id: string;
  lead_number: string;
  customer_id: string;
  car_id: string | null;
  created_at: string;
  stage: { name: string; stage_type: string } | null;
  car: { display_title: string } | null;
}

const LEAD_COLUMNS =
  "id, lead_number, customer_id, car_id, created_at, stage:lead_stages(name, stage_type), car:cars(display_title)";

function toLeadOption(row: RawLead): TestDriveLeadOption {
  return {
    id: row.id,
    lead_number: row.lead_number,
    customer_id: row.customer_id,
    car_id: row.car_id,
    vehicle_title: row.car?.display_title ?? null,
    stage_name: row.stage?.name ?? "Unknown",
    stage_type: row.stage?.stage_type ?? "open",
    created_at: row.created_at,
  };
}

export async function getLeadById(id: string): Promise<TestDriveLeadOption | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();
  if (error) console.error("getLeadById error:", error);

  return data ? toLeadOption(data as unknown as RawLead) : null;
}

/** The customer's open, non-archived leads: the ones a test drive can sensibly attach to. */
export async function getOpenLeadsForCustomer(
  customerId: string,
): Promise<SearchResult<TestDriveLeadOption>> {
  if (!isUuid(customerId)) return { results: [], failed: true };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("customer_id", customerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("getOpenLeadsForCustomer error:", error);
    return { results: [], failed: true };
  }

  const open = ((data ?? []) as unknown as RawLead[])
    .map(toLeadOption)
    .filter((l) => l.stage_type === "open");
  return { results: open, failed: false };
}

// --- Page data ---

/** Returns null (not empty lists) when a lookup fails, so the page can say so. */
/** Returns null (not empty lists) when a lookup fails, so the page can say so. */
export async function getTestDriveFormLookups(): Promise<TestDriveFormLookups | null> {
  const supabase = await createClient();

  const [locations, settings, staff, sources] = await Promise.all([
    supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("test_drive_location_settings").select("location_id").eq("is_enabled", true),
    listTestDriveHosts(supabase),
    supabase
      .from("test_drive_request_sources")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (locations.error || settings.error || !staff || sources.error) {
    console.error("getTestDriveFormLookups error:", locations.error ?? settings.error ?? sources.error);
    return null;
  }

  const enabled = new Set((settings.data ?? []).map((s) => s.location_id));

  return {
    showrooms: (locations.data ?? []).filter((l) => enabled.has(l.id)),
    staff,
    requestSources: sources.data ?? [],
  };
}

/** Reads ?customerId=, ?carId= and ?leadId= so other screens can link straight into this form. */
export async function getTestDriveFormPrefill(
  params: Record<string, string | undefined>,
): Promise<TestDriveFormPrefill> {
  const lead = params.leadId ? await getLeadById(params.leadId) : null;

  const customerId = isUuid(params.customerId) ? params.customerId : lead?.customer_id;
  const carId = isUuid(params.carId) ? params.carId : lead?.car_id;

  const [customer, vehicle] = await Promise.all([
    customerId ? getCustomerById(customerId) : Promise.resolve(null),
    carId ? getVehicleById(carId) : Promise.resolve(null),
  ]);

  // A lead only makes sense with its own customer.
  const usableLead = lead && customer && lead.customer_id === customer.id ? lead : null;

  return { customer, vehicle, lead: usableLead };
}
