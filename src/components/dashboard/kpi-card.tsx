"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Car,
  DollarSign,
  Users,
  type LucideIcon,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

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

  /**
   * Example:
   * "vs last month"
   * "vs last week"
   */
  comparisonLabel?: string;
}

type KpiVisualConfig = {
  Icon: LucideIcon;

  iconContainer: string;
  iconColor: string;

  glow: string;

  chartColor: string;
};

const visualMap: Record<string, KpiVisualConfig> = {
  revenue: {
    Icon: DollarSign,

    iconContainer: "border-primary/15 bg-primary/8",

    iconColor: "text-primary",

    glow: "bg-primary/30",

    chartColor: "var(--omc-primary)",
  },

  "available-cars": {
    Icon: Car,

    iconContainer: "border-info/15 bg-info/8",

    iconColor: "text-info",

    glow: "bg-info/30",

    chartColor: "var(--omc-info)",
  },

  customers: {
    Icon: Users,

    iconContainer: "border-success/15 bg-success/8",

    iconColor: "text-success",

    glow: "bg-success/30",

    chartColor: "var(--omc-success)",
  },

  pending: {
    Icon: CalendarClock,

    iconContainer: "border-warning/15 bg-warning/8",

    iconColor: "text-warning",

    glow: "bg-warning/30",

    chartColor: "var(--omc-warning)",
  },
};

const fallbackConfig: KpiVisualConfig = {
  Icon: DollarSign,

  iconContainer: "border-primary/15 bg-primary/8",

  iconColor: "text-primary",

  glow: "bg-primary/30",

  chartColor: "var(--omc-primary)",
};

export function KpiCard({
  id,
  label,
  value,
  prefix = "",
  change,
  trend,
  comparisonLabel = "vs last month",
}: KpiCardProps) {
  const animatedValue = useCountUp(value);

  const reduceMotion = useReducedMotion();

  const isPositive = change >= 0;

  const config = visualMap[id] ?? fallbackConfig;

  const Icon = config.Icon;

  const gradientId = `kpi-spark-${id}`.replace(/[^a-zA-Z0-9-_]/g, "-");

  const chartData = trend.map((value, index) => ({
    index,
    value,
  }));

  return (
    <motion.div
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
            }
      }
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Card
        variant="flat"
        padding="sm"
        className="group bg-base hover:border-primary/20 relative h-full min-h-47.5 overflow-hidden transition-all duration-300"
      >
        {/* ===================================================
            AMBIENT ACCENT
        =================================================== */}

        <div
          aria-hidden="true"
          className={cn(
            [
              "pointer-events-none",
              "absolute",
              "-right-12",
              "-top-16",
              "size-40",
              "rounded-full",
              "blur-[70px]",
              "opacity-60",
              "transition-all",
              "duration-500",
              "group-hover:opacity-100",
            ],
            config.glow,
          )}
        />

        {/* Top highlight */}

        <div
          aria-hidden="true"
          className="via-primary/35 pointer-events-none absolute top-0 left-6 h-px w-24 bg-linear-to-r from-transparent to-transparent"
        />

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="relative z-10 flex h-full flex-col">
          {/* ---------------------------------------------------
              HEADER
          --------------------------------------------------- */}

          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            {/* Label */}

            <div className="min-w-0">
              <p className="text-text-subtle text-[11px] font-semibold tracking-widest uppercase">{label}</p>

              {/* Value */}

              <p className="text-text-primary mt-2 truncate text-[30px] leading-none font-semibold tracking-[-0.035em] tabular-nums xl:text-[32px]">
                {prefix && <span className="text-text-muted mr-1 text-[20px] font-medium">{prefix}</span>}

                {Math.round(animatedValue).toLocaleString()}
              </p>
            </div>

            {/* Icon container */}

            <motion.div
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      rotate: 4,
                      scale: 1.06,
                    }
              }
              transition={{
                duration: 0.2,
              }}
              className={cn(
                [
                  "flex",
                  "size-11",
                  "shrink-0",
                  "items-center",
                  "justify-center",
                  "rounded-[14px]",
                  "border",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                ],

                config.iconContainer,
              )}
            >
              <Icon aria-hidden="true" strokeWidth={1.8} className={cn("size-5", config.iconColor)} />
            </motion.div>
          </div>

          {/* ---------------------------------------------------
              TREND INFORMATION
          --------------------------------------------------- */}

          <div className="relative z-20 mt-4 flex items-center gap-2 px-5">
            <span
              className={cn(
                [
                  "inline-flex",
                  "items-center",
                  "gap-1",
                  "rounded-full",
                  "border",
                  "px-2",
                  "py-1",
                  "text-[11px]",
                  "font-semibold",
                  "tabular-nums",
                ],

                isPositive
                  ? ["border-success/15", "bg-success/8", "text-success"]
                  : ["border-danger/15", "bg-danger/8", "text-danger"],
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="size-3.5" aria-hidden="true" />
              )}
              {Math.abs(change)}%
            </span>

            <span className="text-text-subtle truncate text-[11px]">{comparisonLabel}</span>
          </div>

          {/* ---------------------------------------------------
              SPARKLINE
          --------------------------------------------------- */}

          <div className="relative mt-auto h-15.5 w-full overflow-hidden" aria-hidden="true">
            {/* subtle separator */}

            <div className="via-border absolute top-0 right-5 left-5 h-px bg-linear-to-r from-transparent to-transparent" />

            <div className="absolute inset-x-0 top-1 -bottom-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={config.chartColor} stopOpacity={0.28} />

                      <stop offset="60%" stopColor={config.chartColor} stopOpacity={0.08} />

                      <stop offset="100%" stopColor={config.chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={config.chartColor}
                    strokeWidth={1.8}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={!reduceMotion}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
