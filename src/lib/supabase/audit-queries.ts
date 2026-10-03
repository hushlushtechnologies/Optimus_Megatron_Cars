import { createClient } from "@/src/lib/supabase/server";

export interface InventoryActivityEntry {
  id: string;
  carId: string;
  carDisplayTitle: string;
  type: "price" | "status" | "archive";
  description: string;
  changedByName: string;
  changedAt: string;
}

interface CarRef {
  display_title: string;
}

interface PriceHistoryRow {
  id: string;
  car_id: string;
  old_price: number | null;
  new_price: number | null;
  changed_by: string | null;
  changed_at: string;
  cars: CarRef | CarRef[] | null;
}

interface StatusHistoryRow {
  id: string;
  car_id: string;
  status_category: string;
  changed_by: string | null;
  changed_at: string;
  cars: CarRef | CarRef[] | null;
  old_status: { name: string } | null;
  new_status: { name: string } | null;
}

interface ArchiveLogRow {
  id: string;
  car_id: string;
  action: "archived" | "restored";
  changed_by: string | null;
  changed_at: string;
  cars: CarRef | CarRef[] | null;
}

/**
 * Recent activity across ALL inventory — not scoped to one car.
 * Built in Sprint 2 Phase 18 as groundwork for a future Audit Logs
 * module; not called by any page yet.
 */
export async function getRecentInventoryActivity(limit = 20): Promise<InventoryActivityEntry[]> {
  const supabase = await createClient();

  const [{ data: priceHistory }, { data: statusHistory }, { data: archiveHistory }] = await Promise.all([
    supabase
      .from("car_price_history")
      .select("id, car_id, old_price, new_price, changed_by, changed_at, cars(display_title)")
      .order("changed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("car_status_history")
      .select(
        "id, car_id, status_category, changed_by, changed_at, cars(display_title), old_status:vehicle_statuses!car_status_history_old_status_id_fkey(name), new_status:vehicle_statuses!car_status_history_new_status_id_fkey(name)",
      )
      .order("changed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("car_archive_log")
      .select("id, car_id, action, changed_by, changed_at, cars(display_title)")
      .order("changed_at", { ascending: false })
      .limit(limit),
  ]);

  const priceRows = (priceHistory ?? []) as unknown as PriceHistoryRow[];
  const statusRows = (statusHistory ?? []) as unknown as StatusHistoryRow[];
  const archiveRows = (archiveHistory ?? []) as unknown as ArchiveLogRow[];

  const carTitle = (row: { cars: CarRef | CarRef[] | null }) =>
    (Array.isArray(row.cars) ? row.cars[0]?.display_title : row.cars?.display_title) ?? "Unknown vehicle";

  const userIds = new Set<string>();
  [...priceRows, ...statusRows, ...archiveRows].forEach((e) => {
    if (e.changed_by) userIds.add(e.changed_by);
  });

  const { data: profiles } = userIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds))
    : { data: [] };

  const findName = (id: string | null) =>
    id ? (profiles?.find((p) => p.id === id)?.full_name ?? "Unknown") : "System";

  function formatAED(value: number | null) {
    return value === null ? "—" : `AED ${value.toLocaleString()}`;
  }

  const merged: InventoryActivityEntry[] = [
    ...priceRows.map((e) => ({
      id: e.id,
      carId: e.car_id,
      carDisplayTitle: carTitle(e),
      type: "price" as const,
      description: `Price changed: ${formatAED(e.old_price)} → ${formatAED(e.new_price)}`,
      changedByName: findName(e.changed_by),
      changedAt: e.changed_at,
    })),
    ...statusRows.map((e) => ({
      id: e.id,
      carId: e.car_id,
      carDisplayTitle: carTitle(e),
      type: "status" as const,
      description: `${e.status_category === "availability" ? "Availability" : "Publishing"} status changed: ${e.old_status?.name ?? "—"} → ${e.new_status?.name ?? "—"}`,
      changedByName: findName(e.changed_by),
      changedAt: e.changed_at,
    })),
    ...archiveRows.map((e) => ({
      id: e.id,
      carId: e.car_id,
      carDisplayTitle: carTitle(e),
      type: "archive" as const,
      description: e.action === "archived" ? "Vehicle archived" : "Vehicle restored from archive",
      changedByName: findName(e.changed_by),
      changedAt: e.changed_at,
    })),
  ]
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .slice(0, limit);

  return merged;
}
