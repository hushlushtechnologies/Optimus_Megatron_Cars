"use client";

import { cloneElement, isValidElement, type KeyboardEvent, type ReactElement } from "react";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { useCountUp } from "@/src/hooks/use-count-up";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils/cn";

/* =========================================================
   TYPES
========================================================= */

type IconProps = {
  className?: string;
  "aria-hidden"?: string;
};

interface MetricCardProps {
  label: string;
  value: number;

  prefix?: string;
  suffix?: string;

  /**
   * Pass a rendered icon element:
   *
   * icon={<Car />}
   *
   * Do not pass:
   *
   * icon={Car}
   *
   * This component can be rendered from a Server Component,
   * so we pass the rendered JSX element across the boundary.
   */
  icon?: ReactElement<IconProps>;

  change?: number;
  comparisonLabel?: string;
  trend?: number[];

  isLoading?: boolean;

  onClick?: () => void;
}

/* =========================================================
   METRIC ACCENT
========================================================= */

function getMetricAccent(label: string) {
  const normalized = label.toLowerCase();

  /* Available */

  if (normalized.includes("available")) {
    return {
      icon: "text-success",
      iconBackground: "bg-success/[0.07]",
      iconBorder: "border-success/15",

      spotlight: "bg-success/[0.08]",

      topLine: "bg-gradient-to-r from-success/45 to-transparent",

      spark: "var(--omc-success)",
    };
  }

  /* Reserved */

  if (normalized.includes("reserved")) {
    return {
      icon: "text-warning",
      iconBackground: "bg-warning/[0.07]",
      iconBorder: "border-warning/15",

      spotlight: "bg-warning/[0.07]",

      topLine: "bg-gradient-to-r from-warning/45 to-transparent",

      spark: "var(--omc-warning)",
    };
  }

  /* Sold */

  if (normalized.includes("sold")) {
    return {
      icon: "text-primary",
      iconBackground: "bg-primary/[0.07]",
      iconBorder: "border-primary/15",

      spotlight: "bg-primary/[0.07]",

      topLine: "bg-gradient-to-r from-primary/45 to-transparent",

      spark: "var(--omc-primary)",
    };
  }

  /* Coming Soon */

  if (normalized.includes("coming") || normalized.includes("soon")) {
    return {
      icon: "text-blue-400",
      iconBackground: "bg-blue-400/[0.07]",
      iconBorder: "border-blue-400/15",

      spotlight: "bg-blue-400/[0.07]",

      topLine: "bg-gradient-to-r from-blue-400/40 to-transparent",

      spark: "#60a5fa",
    };
  }

  /* Draft */

  if (normalized.includes("draft")) {
    return {
      icon: "text-text-muted",
      iconBackground: "bg-card-hover",
      iconBorder: "border-border",

      spotlight: "bg-white/[0.035]",

      topLine: "bg-gradient-to-r from-text-subtle/30 to-transparent",

      spark: "var(--omc-text-muted)",
    };
  }

  /* Total Cars / Default */

  return {
    icon: "text-primary",
    iconBackground: "bg-primary/[0.07]",
    iconBorder: "border-primary/15",

    spotlight: "bg-primary/[0.07]",

    topLine: "bg-gradient-to-r from-primary/45 to-transparent",

    spark: "var(--omc-primary)",
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export function MetricCard({
  label,
  value,

  prefix = "",
  suffix = "",

  icon,

  change,
  comparisonLabel = "vs yesterday",

  trend,

  isLoading,
  onClick,
}: MetricCardProps) {
  const animatedValue = useCountUp(value);

  const prefersReducedMotion = useReducedMotion();

  const accent = getMetricAccent(label);

  /* =======================================================
     CHANGE
  ======================================================= */

  const isPositive = (change ?? 0) >= 0;

  /* =======================================================
     CHART
  ======================================================= */

  const chartData = trend?.map((trendValue, index) => ({
    index,
    value: trendValue,
  }));

  const hasTrend = chartData !== undefined && chartData.length > 1;

  const sparklineId = `metric-spark-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  /* =======================================================
     KEYBOARD INTERACTION
  ======================================================= */

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      onClick();
    }
  }

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (isLoading) {
    return (
      <div className="border-border bg-card relative min-w-0 overflow-hidden border-r border-b px-4 py-4 xl:border-b-0">
        {/* Header */}

        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 shrink-0 rounded-md" />

          <Skeleton className="h-2.5 w-20" />
        </div>

        {/* Value */}

        <div className="mt-3 flex items-end justify-between gap-3">
          <Skeleton className="h-6 w-16" />

          <Skeleton className="h-6 w-14" />
        </div>

        {/* Meta */}

        <Skeleton className="mt-2 h-2.5 w-24" />
      </div>
    );
  }

  /* =======================================================
     CARD
  ======================================================= */

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        `group border-border bg-card relative min-w-0 overflow-hidden rounded-lg border-r border-b px-4 py-4 transition-[background-color,border-color] duration-150 xl:border-b-0`,

        onClick && `hover:bg-card-hover/30 cursor-pointer`,
      )}
    >
      {/* ===================================================
          SPOTLIGHT
      =================================================== */}

      <div
        aria-hidden="true"
        className={cn(
          `pointer-events-none absolute -top-12 -left-10 size-32 rounded-full blur-[45px]`,
          accent.spotlight,
        )}
      />

      {/* Secondary softer spotlight */}

      <div
        aria-hidden="true"
        className={cn(
          `pointer-events-none absolute -top-8 -left-5 size-16 rounded-full opacity-40 blur-[28px]`,
          accent.spotlight,
        )}
      />

      {/* ===================================================
          TOP ACCENT
      =================================================== */}

      <div
        aria-hidden="true"
        className={cn(`pointer-events-none absolute top-0 left-4 h-px w-14`, accent.topLine)}
      />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="relative z-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex min-w-0 items-center gap-2.5">
          {/* Icon */}

          {icon && isValidElement(icon) && (
            <div
              className={cn(
                `flex size-8 shrink-0 items-center justify-center rounded-md border`,

                accent.iconBackground,
                accent.iconBorder,
                accent.icon,
              )}
            >
              {cloneElement(icon, {
                className: cn("size-3.5", icon.props.className),

                "aria-hidden": "true",
              })}
            </div>
          )}

          {/* Label */}

          <p className="text-text-subtle min-w-0 truncate text-[10px] leading-4 font-semibold tracking-[0.055em] uppercase">
            {label}
          </p>
        </div>

        {/* =================================================
            VALUE + SPARKLINE
        ================================================= */}

        <div className="mt-3 flex min-w-0 items-end justify-between gap-3">
          {/* Value */}

          <p className="text-text-primary min-w-0 truncate text-[22px] leading-none font-semibold tracking-[-0.025em] tabular-nums sm:text-[23px]">
            {prefix}

            {Math.round(animatedValue).toLocaleString()}

            {suffix}
          </p>

          {/* Sparkline */}

          {hasTrend && (
            <div className="h-7 w-[58px] shrink-0 opacity-80" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 2,
                    right: 1,
                    bottom: 1,
                    left: 1,
                  }}
                >
                  <defs>
                    <linearGradient id={sparklineId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent.spark} stopOpacity={0.2} />

                      <stop offset="100%" stopColor={accent.spark} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={accent.spark}
                    strokeWidth={1.25}
                    fill={`url(#${sparklineId})`}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={!prefersReducedMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* =================================================
            META / CHANGE
        ================================================= */}

        <div className="mt-2 flex min-h-4 min-w-0 items-center gap-1.5">
          {change !== undefined ? (
            <>
              {/* Change */}

              <span
                className={cn(
                  `inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold tabular-nums`,

                  isPositive ? "text-success" : "text-danger",
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="size-3" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="size-3" strokeWidth={2} aria-hidden="true" />
                )}
                {Math.abs(change)}%
              </span>

              {/* Comparison */}

              <span className="text-text-subtle min-w-0 truncate text-[10px]">{comparisonLabel}</span>
            </>
          ) : (
            <span className="text-text-subtle truncate text-[10px]">Current inventory</span>
          )}
        </div>
      </div>
    </div>
  );
}
