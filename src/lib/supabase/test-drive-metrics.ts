import { createClient } from "@/src/lib/supabase/server";
import {
  TREND_DAYS,
  buildMetricsFromDailyRows,
  type DailyMetricRow,
  type TestDriveMetrics,
} from "@/src/lib/utils/test-drive-metrics";

/** Returns null (not zeros) when the query fails, so the page can say so instead of showing wrong numbers. */
export async function getTestDriveMetrics(): Promise<TestDriveMetrics | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("test_drive_daily_metrics", { p_days: TREND_DAYS });

  if (error) {
    console.error("getTestDriveMetrics error:", error);
    return null;
  }

  return buildMetricsFromDailyRows((data ?? []) as unknown as DailyMetricRow[]);
}
