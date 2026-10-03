"use client";

import { useMemo } from "react";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChartNoAxesCombined,
  Crown,
  WalletCards,
} from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { revenueTrend } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

export function RevenueChart() {
  const metrics = useMemo(() => {
    if (!revenueTrend.length) {
      return {
        total: 0,
        average: 0,
        highest: 0,
        highestMonth: "-",
        change: 0,
      };
    }

    const total = revenueTrend.reduce((sum, item) => sum + item.revenue, 0);

    const average = total / revenueTrend.length;

    const highestItem = revenueTrend.reduce(
      (highest, current) => (current.revenue > highest.revenue ? current : highest),
      revenueTrend[0],
    );

    const first = revenueTrend[0]?.revenue ?? 0;

    const latest = revenueTrend[revenueTrend.length - 1]?.revenue ?? 0;

    const change = first === 0 ? 0 : ((latest - first) / first) * 100;

    return {
      total,
      average,
      highest: highestItem.revenue,
      highestMonth: highestItem.month,
      change,
    };
  }, []);

  const isPositive = metrics.change >= 0;

  return (
    <Card variant="flat" padding="sm" className="group relative h-full overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/20 pointer-events-none absolute -top-32 -right-28 size-72 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="bg-info/10 pointer-events-none absolute -bottom-28 left-[15%] size-64 rounded-full blur-[100px]"
      />

      {/* top metallic highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-52 bg-linear-to-r from-transparent to-transparent"
      />

      <div className="relative z-10">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between lg:px-6 lg:pt-6">
          <div className="flex items-start gap-3">
            {/* Icon */}

            <div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <ChartNoAxesCombined className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Revenue Overview
              </h3>

              <div className="text-text-subtle mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span>AED · Millions</span>

                <span className="bg-text-subtle/50 size-1 rounded-full" />

                <span className="inline-flex items-center gap-1">
                  <CalendarRange className="size-3" />
                  Last 12 months
                </span>
              </div>
            </div>
          </div>

          {/* Trend */}

          <div className="border-border bg-gradient-ghost flex items-center gap-2 self-start rounded-xl border px-3 py-2">
            <span
              className={cn(
                ["flex", "size-7", "items-center", "justify-center", "rounded-lg"],

                isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
              )}
            >
              {isPositive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            </span>

            <div>
              <p
                className={cn(
                  "text-[12px] font-semibold tabular-nums",

                  isPositive ? "text-success" : "text-danger",
                )}
              >
                {isPositive ? "+" : ""}
                {metrics.change.toFixed(1)}%
              </p>

              <p className="text-text-subtle text-[10px]">Period growth</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            SUMMARY METRICS
        =================================================== */}

        <div className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-3 lg:px-6">
          {/* Total */}

          <div className="group/stat border-border bg-gradient-ghost hover:border-primary/15 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
              <WalletCards className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
                Total Revenue
              </p>

              <p className="text-text-primary mt-0.5 truncate text-[15px] font-semibold tabular-nums">
                AED {metrics.total.toFixed(1)}M
              </p>
            </div>
          </div>

          {/* Average */}

          <div className="border-border bg-gradient-ghost hover:border-primary/15 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors">
            <div className="bg-info/10 text-info flex size-9 items-center justify-center rounded-xl">
              <ChartNoAxesCombined className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
                Monthly Average
              </p>

              <p className="text-text-primary mt-0.5 truncate text-[15px] font-semibold tabular-nums">
                AED {metrics.average.toFixed(1)}M
              </p>
            </div>
          </div>

          {/* Peak */}

          <div className="border-border bg-gradient-ghost hover:border-primary/15 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors">
            <div className="bg-warning/10 text-warning flex size-9 items-center justify-center rounded-xl">
              <Crown className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
                Peak Month
              </p>

              <div className="mt-0.5 flex items-baseline gap-1.5">
                <p className="text-text-primary truncate text-[15px] font-semibold">{metrics.highestMonth}</p>

                <span className="text-text-muted text-[10px] tabular-nums">
                  {metrics.highest.toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            CHART
        =================================================== */}

        <div className="border-border border-t px-3 pt-4 pb-4 sm:px-4 lg:px-5">
          <div className="h-71.25 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueTrend}
                margin={{
                  top: 16,
                  right: 14,
                  bottom: 0,
                  left: -8,
                }}
              >
                <defs>
                  {/* Main gold fill */}

                  <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--omc-primary)" stopOpacity={0.32} />

                    <stop offset="42%" stopColor="var(--omc-primary)" stopOpacity={0.1} />

                    <stop offset="100%" stopColor="var(--omc-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Grid */}

                <CartesianGrid
                  stroke="var(--omc-border)"
                  strokeOpacity={0.7}
                  strokeDasharray="4 6"
                  vertical={false}
                />

                {/* X axis */}

                <XAxis
                  dataKey="month"
                  tick={{
                    fill: "var(--omc-text-subtle)",
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />

                {/* Y axis */}

                <YAxis
                  width={44}
                  tick={{
                    fill: "var(--omc-text-subtle)",
                    fontSize: 10,
                  }}
                  tickFormatter={(value) => `${value}M`}
                  tickLine={false}
                  axisLine={false}
                />

                {/* Tooltip */}

                <Tooltip
                  cursor={{
                    stroke: "var(--omc-primary)",
                    strokeOpacity: 0.16,
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }

                    const value = Number(payload[0]?.value ?? 0);

                    return (
                      <div className="border-border bg-base min-w-37.5 rounded-xl border p-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
                        <p className="text-text-subtle text-[10px] font-medium">{label}</p>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="bg-primary size-2 rounded-full shadow-[0_0_8px_rgba(235,184,17,0.6)]" />

                          <div>
                            <p className="text-text-muted text-[10px]">Revenue</p>

                            <p className="text-text-primary text-[14px] font-semibold tabular-nums">
                              AED {value.toFixed(1)}M
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Area */}

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--omc-primary)"
                  strokeWidth={2.2}
                  fill="url(#revenue-fill)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "var(--omc-primary)",
                    stroke: "var(--omc-card)",
                    strokeWidth: 3,
                  }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
