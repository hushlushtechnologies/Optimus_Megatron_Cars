import { createClient } from "@/src/lib/supabase/server";
import type { TestDriveFilterVehicleOption } from "@/src/lib/utils/test-drive-list-filters";

export interface TestDriveFilterLookups {
  brands: { id: string; name: string }[];
  models: { id: string; name: string; brand_id: string }[];
  showrooms: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  sources: { id: string; name: string }[];
  /** The vehicle named in the URL, so the chip and drawer can show its name. */
  vehicle: TestDriveFilterVehicleOption | null;
}

export interface TestDriveFilterLookupsResult {
  lookups: TestDriveFilterLookups;
  /** At least one lookup failed. Search and sort still work. */
  failed: boolean;
}

export const EMPTY_TEST_DRIVE_FILTER_LOOKUPS: TestDriveFilterLookups = {
  brands: [],
  models: [],
  showrooms: [],
  staff: [],
  sources: [],
  vehicle: null,
};

export const EMPTY_TEST_DRIVE_FILTER_LOOKUPS_RESULT: TestDriveFilterLookupsResult = {
  lookups: EMPTY_TEST_DRIVE_FILTER_LOOKUPS,
  failed: false,
};

interface VehicleRow {
  id: string;
  display_title: string;
  stock_id: string;
  brand: { name: string } | { name: string }[] | null;
}

export async function getTestDriveFilterLookups(
  vehicleId: string | null,
): Promise<TestDriveFilterLookupsResult> {
  try {
    const supabase = await createClient();

    const [brands, models, showrooms, hosts, sources, vehicle] = await Promise.all([
      supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order"),
      supabase.from("models").select("id, name, brand_id").eq("is_active", true).order("name"),
      supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
      supabase.rpc("list_test_drive_hosts"),
      supabase
        .from("test_drive_request_sources")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order"),
      vehicleId
        ? supabase
            .from("cars")
            .select("id, display_title, stock_id, brand:brands(name)")
            .eq("id", vehicleId)
            .maybeSingle()
        : Promise.resolve(null),
    ]);

    const errors = [brands.error, models.error, showrooms.error, hosts.error, sources.error, vehicle?.error];
    errors.forEach((error) => {
      if (error) console.error("getTestDriveFilterLookups error:", error);
    });

    const hostRows = (hosts.data ?? []) as unknown as { id: string; full_name: string | null }[];
    const vehicleRow = (vehicle?.data ?? null) as unknown as VehicleRow | null;
    const vehicleBrand = Array.isArray(vehicleRow?.brand) ? vehicleRow?.brand[0] : vehicleRow?.brand;

    return {
      failed: errors.some(Boolean),
      lookups: {
        brands: brands.data ?? [],
        models: models.data ?? [],
        showrooms: showrooms.data ?? [],
        staff: hostRows.map((host) => ({ id: host.id, name: host.full_name?.trim() || "Unnamed staff" })),
        sources: sources.data ?? [],
        vehicle: vehicleRow
          ? {
              id: vehicleRow.id,
              display_title: vehicleRow.display_title,
              stock_id: vehicleRow.stock_id,
              brand_name: vehicleBrand?.name ?? null,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("getTestDriveFilterLookups threw:", error);
    return { lookups: EMPTY_TEST_DRIVE_FILTER_LOOKUPS, failed: true };
  }
}
