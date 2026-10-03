import { createClient } from "@/src/lib/supabase/server";

const CAR_DETAIL_COLUMNS = `
  *,
  brand:brands(name), model:models(name), variant:variants(name),
  location:locations(name), collection:collections(name),
  fuel_type:fuel_types(name), transmission:transmission_types(name), drive_type:drive_types(name),
  body_type:body_types(name), paint_finish:paint_finish_types(name),
  warranty_type:warranty_types(name), promotion:promotions(name, discount_type, discount_value),
  availability_status:vehicle_statuses!cars_availability_status_id_fkey(id, name, slug, color_hex),
  publishing_status:vehicle_statuses!cars_publishing_status_id_fkey(id, name, slug, color_hex),
  media:car_media(*)
`;

export interface ActivityEntry {
  id: string;
  type: "created" | "price" | "status" | "archive";
  description: string;
  changedByName: string;
  changedAt: string;
}

export async function getCarDetail(carId: string) {
  const supabase = await createClient();
  const { data: car } = await supabase.from("cars").select(CAR_DETAIL_COLUMNS).eq("id", carId).maybeSingle();

  if (!car) return null;

  const userIds = new Set<string>();
  if (car.created_by) userIds.add(car.created_by);
  if (car.updated_by) userIds.add(car.updated_by);

  const [{ data: priceHistory }, { data: statusHistory }, { data: archiveHistory }] = await Promise.all([
    supabase
      .from("car_price_history")
      .select("*")
      .eq("car_id", carId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("car_status_history")
      .select(
        "*, old_status:vehicle_statuses!car_status_history_old_status_id_fkey(name), new_status:vehicle_statuses!car_status_history_new_status_id_fkey(name)",
      )
      .eq("car_id", carId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("car_archive_log")
      .select("*")
      .eq("car_id", carId)
      .order("changed_at", { ascending: false }),
  ]);

  (priceHistory ?? []).forEach((e) => e.changed_by && userIds.add(e.changed_by));
  (statusHistory ?? []).forEach((e) => e.changed_by && userIds.add(e.changed_by));
  (archiveHistory ?? []).forEach((e) => e.changed_by && userIds.add(e.changed_by));

  const { data: profiles } = userIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds))
    : { data: [] };

  const findName = (id: string | null) => profiles?.find((p) => p.id === id)?.full_name ?? "Unknown";

  function formatAED(value: number | null) {
    return value === null ? "—" : `AED ${value.toLocaleString()}`;
  }

  // The `as const` on every `type:` literal below is required — without it,
  // TypeScript widens "price"/"status"/"archive" to the plain `string` type
  // inside .map(), which no longer matches ActivityEntry's literal union.
  const activity: ActivityEntry[] = [
    {
      id: `created-${car.id}`,
      type: "created" as const,
      description: "Vehicle created",
      changedByName: findName(car.created_by),
      changedAt: car.created_at,
    },
    ...(priceHistory ?? []).map((e) => ({
      id: e.id,
      type: "price" as const,
      description: `Price changed: ${formatAED(e.old_price)} → ${formatAED(e.new_price)}`,
      changedByName: findName(e.changed_by),
      changedAt: e.changed_at,
    })),
    ...(statusHistory ?? []).map((e) => ({
      id: e.id,
      type: "status" as const,
      description: `${e.status_category === "availability" ? "Availability" : "Publishing"} status changed: ${e.old_status?.name ?? "—"} → ${e.new_status?.name ?? "—"}`,
      changedByName: findName(e.changed_by),
      changedAt: e.changed_at,
    })),
    ...(archiveHistory ?? []).map((e) => ({
      id: e.id,
      type: "archive" as const,
      description: e.action === "archived" ? "Vehicle archived" : "Vehicle restored from archive",
      changedByName: findName(e.changed_by),
      changedAt: e.changed_at,
    })),
  ].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  return {
    car,
    createdByName: findName(car.created_by),
    updatedByName: findName(car.updated_by),
    activity,
  };
}

export async function getCustomerEditValues(customerId: string) {
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customer_profiles")
    .select(
      "id, first_name, last_name, email, phone, alternative_phone, location_id, address, preferred_language, source_id, source_detail, lifecycle_status, primary_relationship_manager_id",
    )
    .eq("id", customerId)
    .maybeSingle();

  if (!customer) return null;

  const { data: tagLinks } = await supabase
    .from("customer_tag_links")
    .select("tag_id")
    .eq("customer_id", customerId);

  return { customer, tagIds: (tagLinks ?? []).map((t) => t.tag_id) };
}
