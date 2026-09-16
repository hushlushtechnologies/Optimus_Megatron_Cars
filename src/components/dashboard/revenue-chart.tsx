"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/src/components/ui/card";
import { revenueTrend } from "@/src/lib/mock-data/dashboard";

export function RevenueChart() {
  return (
    <Card variant="elevated" padding="lg" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-h3">Revenue Overview</h3>
          <p className="text-body-sm text-text-muted">
            AED (millions) · last 12 months
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueTrend} margin={{ left: -20, right: 8 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--omc-primary)"
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor="var(--omc-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--omc-border)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--omc-text-subtle)", fontSize: 12 }}
              axisLine={{ stroke: "var(--omc-border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--omc-text-subtle)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "var(--omc-card)",
                border: "1px solid var(--omc-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--omc-text-primary)" }}
              formatter={(value) => [`AED ${Number(value ?? 0)}M`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--omc-primary)"
              strokeWidth={2}
              fill="url(#revenue-fill)"
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
