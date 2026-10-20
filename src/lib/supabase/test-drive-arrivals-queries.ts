import { createClient } from "@/src/lib/supabase/server";
import { LIST_COLUMNS } from "@/src/lib/supabase/test-drive-queries";
import { isUuid, sanitizeSearchTerm } from "@/src/lib/utils/search-term";
import { getDubaiToday } from "@/src/lib/utils/test-drive-format";
import { dubaiLocalToDate } from "@/src/lib/utils/test-drive-slots";
import type { TestDriveArrival } from "@/src/lib/types/test-drive";

interface ArrivalsResult {
  arrivals: TestDriveArrival[];
  /** location id -> minutes before the start that check-in opens. Missing means the default. */
  opensBefore: Record<string, number>;
}

/**
 * Today's confirmed appointments (and the ones already completed), for the
 * check-in desk. Returns null (not an empty list) when the lookup fails, so
 * the desk can say so instead of looking like nobody is expected.
 */
export async function getTodaysArrivals(params: {
  search?: string;
  showroomId?: string | null;
}): Promise<ArrivalsResult | null> {
  const supabase = await createClient();

  const dayStartMs = dubaiLocalToDate(getDubaiToday(), "00:00").getTime();
  const fromIso = new Date(dayStartMs).toISOString();
  const toIso = new Date(dayStartMs + 24 * 60 * 60_000).toISOString();

  let query = supabase
    .from("test_drive_list")
    .select(`${LIST_COLUMNS}, customer_phone`)
    .is("archived_at", null)
    .in("status", ["Approved", "Rescheduled", "Completed"])
    .gte("scheduled_start", fromIso)
    .lt("scheduled_start", toIso);

  const term = sanitizeSearchTerm(params.search);
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      [
        `test_drive_number.ilike.${pattern}`,
        `customer_name.ilike.${pattern}`,
        `customer_number.ilike.${pattern}`,
        `customer_phone.ilike.${pattern}`,
        `vehicle_title.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (params.showroomId && isUuid(params.showroomId)) query = query.eq("location_id", params.showroomId);

  const [rowsResult, settingsResult] = await Promise.all([
    query.order("scheduled_start", { ascending: true }).order("id", { ascending: true }).limit(200),
    supabase.from("test_drive_location_settings").select("location_id, check_in_opens_minutes_before"),
  ]);

  if (rowsResult.error) {
    console.error("getTodaysArrivals error:", rowsResult.error);
    return null;
  }

  // If the settings can't be read, the desk falls back to the default. The server checks again at check-in anyway.
  if (settingsResult.error) console.error("getTodaysArrivals settings error:", settingsResult.error);

  const opensBefore: Record<string, number> = {};
  ((settingsResult.data ?? []) as { location_id: string; check_in_opens_minutes_before: number }[]).forEach(
    (s) => {
      opensBefore[s.location_id] = s.check_in_opens_minutes_before;
    },
  );

  return { arrivals: (rowsResult.data ?? []) as unknown as TestDriveArrival[], opensBefore };
}
