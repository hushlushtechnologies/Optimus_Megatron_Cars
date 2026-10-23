"use client";

import { cloneElement, isValidElement, useId, type KeyboardEvent, type ReactElement } from "react";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

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

export type MetricChangeTone = "positive" | "negative" | "neutral";

export interface MetricCardProps {
  label: string;
  value: number;

  prefix?: string;
  suffix?: string;
  /** Text shown when there is no change figure. Defaults to the inventory wording. */
  caption?: string;
  /**
   * Pass a rendered icon element.
   *
   * Correct:
   * icon={<Car />}
   *
   * Incorrect:
   * icon={Car}
   *
   * This allows the element to cross the
   * Server Component / Client Component boundary.
   */
  icon?: ReactElement<IconProps>;

  /**
   * Numeric change.
   *
   * Positive number = increase.
   * Negative number = decrease.
   * Zero = unchanged.
   */
  change?: number;

  /**
   * Controls the semantic color of the change.
   *
   * positive -> green
   * negative -> red
   * neutral  -> muted
   *
   * If omitted, the color is determined
   * automatically from the change direction.
   */
  changeTone?: MetricChangeTone;

  /**
   * Comparison description.
   */
  comparisonLabel?: string;

  /**
   * Set to true only when change is a percentage.
   */
  changeIsPercentage?: boolean;

  /**
   * Historical data for the sparkline.
   */
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
      spotlight: "bg-text-muted/[0.06]",
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
   CHANGE TONE
========================================================= */

function getChangeToneClass(tone: MetricChangeTone) {
  switch (tone) {
    case "positive":
      return "text-success";

    case "negative":
      return "text-danger";

    case "neutral":
    default:
      return "text-text-muted";
  }
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
  changeTone,
  comparisonLabel = "vs yesterday",
  caption = "Current inventory",
  changeIsPercentage = true,

  trend,

  isLoading = false,
  onClick,
}: MetricCardProps) {
  const animatedValue = useCountUp(value);

  const prefersReducedMotion = useReducedMotion();

  const accent = getMetricAccent(label);

  const generatedId = useId();

  /* =======================================================
     CHANGE
  ======================================================= */

  const isIncrease = (change ?? 0) > 0;
  const isDecrease = (change ?? 0) < 0;
  const isUnchanged = change === 0;

  const resolvedChangeTone: MetricChangeTone =
    changeTone ?? (isIncrease ? "positive" : isDecrease ? "negative" : "neutral");

  const changeColorClass = getChangeToneClass(resolvedChangeTone);

  /* =======================================================
     CHART
  ======================================================= */

  const chartData = trend?.map((trendValue, index) => ({
    index,
    value: trendValue,
  }));

  const hasTrend = chartData !== undefined && chartData.length > 1;

  const sparklineId = `metric-spark-${generatedId.replace(/:/g, "")}`;

  /* =======================================================
     KEYBOARD INTERACTION
  ======================================================= */

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick || isLoading) return;

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
      <div
        className="border-border bg-card relative min-w-0 overflow-hidden rounded-2xl border px-4 py-4"
        aria-busy="true"
        aria-label={`Loading ${label}`}
      >
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <Skeleton className="h-2.5 w-20" />
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-14" />
        </div>

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
        `group border-border bg-card relative min-w-0 overflow-hidden rounded-2xl border px-4 py-4 transition-[background-color,border-color] duration-150`,
        onClick && `hover:bg-card-hover/30 cursor-pointer`,
      )}
    >
      {/* ===================================================
          PRIMARY SPOTLIGHT
      =================================================== */}

      <div
        aria-hidden="true"
        className={cn(
          `pointer-events-none absolute -top-12 -left-10 size-32 rounded-full blur-[45px]`,
          accent.spotlight,
        )}
      />

      {/* ===================================================
          SECONDARY SPOTLIGHT
      =================================================== */}

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

          <p className="text-text-primary min-w-0 truncate text-[12px] leading-4 font-semibold">{label}</p>
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
            CHANGE / COMPARISON
        ================================================= */}

        <div className="mt-2 flex min-h-4 min-w-0 items-center gap-1.5">
          {change !== undefined ? (
            <>
              {/* Change indicator */}

              <span
                className={cn(
                  `inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold tabular-nums`,
                  changeColorClass,
                )}
              >
                {isIncrease ? (
                  <ArrowUpRight className="size-3" strokeWidth={2} aria-hidden="true" />
                ) : isDecrease ? (
                  <ArrowDownRight className="size-3" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Minus className="size-3" strokeWidth={2} aria-hidden="true" />
                )}

                {Math.abs(change).toLocaleString()}
                {changeIsPercentage ? "%" : ""}
              </span>

              {/* Comparison label */}

              <span className="text-text-subtle min-w-0 truncate text-[10px]">
                {isUnchanged ? comparisonLabel : comparisonLabel}
              </span>
            </>
          ) : (
            <span className="text-text-subtle truncate text-[10px]">{caption}</span>
          )}
        </div>
      </div>
    </div>
  );
}
