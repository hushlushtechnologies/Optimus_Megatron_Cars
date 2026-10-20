export const TREND_DAYS = 7;

export interface TestDriveMetric {
  /** Today's value, as of now. */
  value: number;
  /** Today's value minus the value at the end of yesterday. */
  change: number;
  /** The last TREND_DAYS end-of-day values, oldest first. */
  trend: number[];
}

export interface TestDriveMetrics {
  total: TestDriveMetric;
  pending: TestDriveMetric;
  approved: TestDriveMetric;
  today: TestDriveMetric;
  completed: TestDriveMetric;
  cancelled: TestDriveMetric;
}

/** One row of public.test_drive_daily_metrics(). bigint columns may arrive as numbers or strings. */
export interface DailyMetricRow {
  day: string;
  total_requests: number | string;
  pending: number | string;
  approved: number | string;
  completed: number | string;
  cancelled: number | string;
  scheduled: number | string;
}

const EMPTY_METRIC: TestDriveMetric = {
  value: 0,
  change: 0,
  trend: Array.from({ length: TREND_DAYS }, () => 0),
};

export const EMPTY_TEST_DRIVE_METRICS: TestDriveMetrics = {
  total: EMPTY_METRIC,
  pending: EMPTY_METRIC,
  approved: EMPTY_METRIC,
  today: EMPTY_METRIC,
  completed: EMPTY_METRIC,
  cancelled: EMPTY_METRIC,
};

function metricFrom(rows: DailyMetricRow[], pick: (row: DailyMetricRow) => number | string): TestDriveMetric {
  const values = rows.map((row) => Number(pick(row)) || 0);
  const current = values[values.length - 1] ?? 0;
  // With only one day of data there's nothing to compare against, so no change.
  const previous = values.length > 1 ? values[values.length - 2] : current;

  return { value: current, change: current - previous, trend: values };
}

export function buildMetricsFromDailyRows(rows: DailyMetricRow[]): TestDriveMetrics {
  if (rows.length === 0) return EMPTY_TEST_DRIVE_METRICS;

  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day));

  return {
    total: metricFrom(sorted, (r) => r.total_requests),
    pending: metricFrom(sorted, (r) => r.pending),
    approved: metricFrom(sorted, (r) => r.approved),
    today: metricFrom(sorted, (r) => r.scheduled),
    completed: metricFrom(sorted, (r) => r.completed),
    cancelled: metricFrom(sorted, (r) => r.cancelled),
  };
}
