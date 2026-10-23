"use server";

import { beginTestDriveRead } from "@/src/lib/supabase/test-drive-action-helpers";
import { cleanSearchTerm, type TestDriveFilterVehicleOption } from "@/src/lib/utils/test-drive-list-filters";
import type { SearchResult } from "@/src/lib/types/test-drive";

interface VehicleRow {
  id: string;
  display_title: string;
  stock_id: string;
  brand: { name: string } | { name: string }[] | null;
}

/** Read-only vehicle search for the filter drawer. Needs signed-in staff, nothing more. */
export async function searchTestDriveFilterVehiclesAction(
  query: string,
): Promise<SearchResult<TestDriveFilterVehicleOption>> {
  if (typeof query !== "string") return { results: [], failed: true };

  const begin = await beginTestDriveRead();
  if (!begin.ok) return { results: [], failed: true };

  const term = cleanSearchTerm(query);

  let request = begin.supabase
    .from("cars")
    .select("id, display_title, stock_id, brand:brands(name)")
    .order("display_title")
    .limit(20);

  if (term) {
    request = request.or(`display_title.ilike."%${term}%",stock_id.ilike."%${term}%"`);
  }

  const { data, error } = await request;
  if (error) {
    console.error("searchTestDriveFilterVehiclesAction error:", error);
    return { results: [], failed: true };
  }

  const rows = (data ?? []) as unknown as VehicleRow[];
  return {
    failed: false,
    results: rows.map((row) => {
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
