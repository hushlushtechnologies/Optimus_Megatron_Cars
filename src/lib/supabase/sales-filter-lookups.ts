import { createClient } from "@/src/lib/supabase/server";
import type { SalesFilterCustomerOption, SalesFilterVehicleOption } from "@/src/lib/utils/sales-list-filters";

export interface SalesFilterLookups {
  brands: { id: string; name: string }[];
  showrooms: { id: string; name: string }[];
  owners: { id: string; name: string }[];
  /** The customer and vehicle named in the URL, so chips and the drawer can show their names. */
  customer: SalesFilterCustomerOption | null;
  vehicle: SalesFilterVehicleOption | null;
}

export interface SalesFilterLookupsResult {
  lookups: SalesFilterLookups;
  /** At least one lookup failed. Search and sort still work. */
  failed: boolean;
}

export const EMPTY_SALES_FILTER_LOOKUPS_RESULT: SalesFilterLookupsResult = {
  lookups: { brands: [], showrooms: [], owners: [], customer: null, vehicle: null },
  failed: false,
};

interface VehicleRow {
  id: string;
  display_title: string;
  stock_id: string;
  brand: { name: string } | { name: string }[] | null;
}

export async function getSalesFilterLookups(
  customerId: string | null,
  vehicleId: string | null,
): Promise<SalesFilterLookupsResult> {
  try {
    const supabase = await createClient();

    const [brands, showrooms, owners, customer, vehicle] = await Promise.all([
      supabase.from("brands").select("id, name").eq("is_active", true).order("sort_order"),
      supabase.from("locations").select("id, name").eq("is_active", true).order("sort_order"),
      supabase.rpc("list_sales_owners"),
      customerId
        ? supabase
            .from("customer_profiles")
            .select("id, full_name, customer_number")
            .eq("id", customerId)
            .maybeSingle()
        : Promise.resolve(null),
      vehicleId
        ? supabase
            .from("cars")
            .select("id, display_title, stock_id, brand:brands(name)")
            .eq("id", vehicleId)
            .maybeSingle()
        : Promise.resolve(null),
    ]);

    const errors = [brands.error, showrooms.error, owners.error, customer?.error, vehicle?.error];
    errors.forEach((error) => {
      if (error) console.error("getSalesFilterLookups error:", error);
    });

    const ownerRows = (owners.data ?? []) as unknown as { id: string; full_name: string | null }[];
    const vehicleRow = (vehicle?.data ?? null) as unknown as VehicleRow | null;
    const vehicleBrand = Array.isArray(vehicleRow?.brand) ? vehicleRow?.brand[0] : vehicleRow?.brand;

    return {
      failed: errors.some(Boolean),
      lookups: {
        brands: brands.data ?? [],
        showrooms: showrooms.data ?? [],
        owners: ownerRows.map((owner) => ({
          id: owner.id,
          name: owner.full_name?.trim() || "Unnamed staff",
        })),
        customer: (customer?.data ?? null) as SalesFilterCustomerOption | null,
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
    console.error("getSalesFilterLookups threw:", error);
    return { ...EMPTY_SALES_FILTER_LOOKUPS_RESULT, failed: true };
  }
}
