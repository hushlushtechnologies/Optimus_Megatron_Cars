"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Car,
  Users,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

import { useCountUp } from "@/src/hooks/use-count-up";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils/cn";

interface KpiCardProps {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  change: number;
  trend: number[];
}

const iconMap: Record<string, LucideIcon> = {
  revenue: DollarSign,
  "available-cars": Car,
  customers: Users,
  pending: CalendarClock,
};

export function KpiCard({
  id,
  label,
  value,
  prefix = "",
  change,
  trend,
}: KpiCardProps) {
  const animatedValue = useCountUp(value);

  const isPositive = change >= 0;

  const chartData = trend.map((v, i) => ({
    i,
    v,
  }));

  const Icon = iconMap[id] ?? DollarSign;

  const gradientId = `spark-${id}`;

  return (
    <Card variant="elevated" padding="md" className="relative overflow-hidden">
      <Icon
        aria-hidden="true"
        className="absolute -right-3 -top-3 size-24 text-primary/[0.06]"
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-caption">{label}</p>

          <p className="mt-1 text-display tabular-nums text-text-primary">
            {prefix}
            {Math.round(animatedValue).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-sm font-medium",
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400",
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden="true" />
          )}
          {Math.abs(change)}%
        </span>

        <div className="h-8 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--omc-primary)"
                    stopOpacity={0.35}
                  />

                  <stop
                    offset="100%"
                    stopColor="var(--omc-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--omc-primary)"
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
