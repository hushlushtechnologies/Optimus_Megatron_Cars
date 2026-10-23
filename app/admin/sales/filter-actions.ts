"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getMySalesPermissions } from "@/src/lib/supabase/sales-permissions";
import { cleanSearchTerm } from "@/src/lib/utils/test-drive-list-filters";
import type { SalesFilterCustomerOption, SalesFilterVehicleOption } from "@/src/lib/utils/sales-list-filters";
import type { SearchResult } from "@/src/lib/types/test-drive";

/** Read-only searches for the filter drawer. They need signed-in staff who may view deals. */
async function begin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const permissions = await getMySalesPermissions(supabase);
  return permissions.view ? supabase : null;
}

export async function searchSalesFilterCustomersAction(
  query: string,
): Promise<SearchResult<SalesFilterCustomerOption>> {
  if (typeof query !== "string") return { results: [], failed: true };
  const supabase = await begin();
  if (!supabase) return { results: [], failed: true };

  const term = cleanSearchTerm(query);
  let request = supabase
    .from("customer_profiles")
    .select("id, full_name, customer_number")
    .order("full_name")
    .limit(20);

  if (term) {
    request = request.or(
      `full_name.ilike."%${term}%",customer_number.ilike."%${term}%",phone.ilike."%${term}%"`,
    );
  }

  const { data, error } = await request;
  if (error) {
    console.error("searchSalesFilterCustomersAction error:", error);
    return { results: [], failed: true };
  }
  return { failed: false, results: (data ?? []) as unknown as SalesFilterCustomerOption[] };
}

interface VehicleRow {
  id: string;
  display_title: string;
  stock_id: string;
  brand: { name: string } | { name: string }[] | null;
}

export async function searchSalesFilterVehiclesAction(
  query: string,
): Promise<SearchResult<SalesFilterVehicleOption>> {
  if (typeof query !== "string") return { results: [], failed: true };
  const supabase = await begin();
  if (!supabase) return { results: [], failed: true };

  const term = cleanSearchTerm(query);
  let request = supabase
    .from("cars")
    .select("id, display_title, stock_id, brand:brands(name)")
    .order("display_title")
    .limit(20);

  if (term) request = request.or(`display_title.ilike."%${term}%",stock_id.ilike."%${term}%"`);

  const { data, error } = await request;
  if (error) {
    console.error("searchSalesFilterVehiclesAction error:", error);
    return { results: [], failed: true };
  }

  return {
    failed: false,
    results: ((data ?? []) as unknown as VehicleRow[]).map((row) => {
      const brand = Array.isArray(row.brand) ? row.brand[0] : row.brand;
      return {
        id: row.id,
        display_title: row.display_title,
        stock_id: row.stock_id,
        brand_name: brand?.name ?? null,
      };
    }),
  };
}
