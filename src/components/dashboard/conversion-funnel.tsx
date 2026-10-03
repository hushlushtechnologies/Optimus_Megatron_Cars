import {
  BadgeCheck,
  BookmarkCheck,
  CarFront,
  Target,
  TrendingDown,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { conversion } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

type ConversionKey = "leads" | "testDrives" | "reservations" | "sold";

interface StageConfig {
  key: ConversionKey;
  label: string;
  shortLabel: string;
  Icon: LucideIcon;

  iconClass: string;
  iconBackground: string;

  progressClass: string;
}

const stages: StageConfig[] = [
  {
    key: "leads",
    label: "Leads",
    shortLabel: "Leads",
    Icon: Users,

    iconClass: "text-blue-300",
    iconBackground: "border-blue-400/15 bg-blue-400/[0.07]",

    progressClass: "bg-gradient-to-r from-blue-400 to-blue-300",
  },

  {
    key: "testDrives",
    label: "Test Drives",
    shortLabel: "Test Drive",
    Icon: CarFront,

    iconClass: "text-primary",
    iconBackground: "border-primary/15 bg-primary/[0.07]",

    progressClass: "bg-gradient-primary",
  },

  {
    key: "reservations",
    label: "Reservations",
    shortLabel: "Reserved",
    Icon: BookmarkCheck,

    iconClass: "text-warning",
    iconBackground: "border-warning/15 bg-warning/[0.07]",

    progressClass: "bg-gradient-to-r from-warning to-primary",
  },

  {
    key: "sold",
    label: "Sold",
    shortLabel: "Sold",
    Icon: BadgeCheck,

    iconClass: "text-success",
    iconBackground: "border-success/15 bg-success/[0.07]",

    progressClass: "bg-gradient-to-r from-success to-emerald-300",
  },
];

export function ConversionFunnel() {
  const totalLeads = conversion.leads ?? 0;
  const sold = conversion.sold ?? 0;

  const overallConversion = totalLeads > 0 ? (sold / totalLeads) * 100 : 0;

  return (
    <Card variant="elevated" padding="sm" className="group relative flex h-full flex-col overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="bg-info/20 pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full blur-[100px]"
      />

      {/* Top gold highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-40 bg-linear-to-r from-transparent to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <Target className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Conversion Funnel
              </h3>

              <p className="text-text-subtle mt-1 text-[11px]">Lead → Test Drive → Reservation → Sale</p>
            </div>
          </div>

          {/* Overall conversion */}

          <div className="border-success/15 bg-success/10 flex items-center gap-2 self-start rounded-xl border px-3 py-2">
            <BadgeCheck className="text-success size-4" />

            <div>
              <p className="text-success text-[12px] font-semibold tabular-nums">
                {overallConversion.toFixed(1)}%
              </p>

              <p className="text-text-subtle text-[9px]">Lead to sale</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            SUMMARY METRICS
        =================================================== */}

        <div className="grid grid-cols-2 gap-2 px-4 pb-5 sm:grid-cols-3">
          {/* Leads */}

          <div className="bg-gradient-ghost rounded-xl border border-white/6 px-5 py-3">
            <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
              Total Leads
            </p>

            <p className="text-text-primary mt-1 text-[18px] font-semibold tabular-nums">
              {totalLeads.toLocaleString()}
            </p>
          </div>

          {/* Sold */}

          <div className="bg-gradient-ghost rounded-xl border border-white/[0.06] px-5 py-3">
            <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">Converted</p>

            <p className="text-success mt-1 text-[18px] font-semibold tabular-nums">
              {sold.toLocaleString()}
            </p>
          </div>

          {/* Conversion */}

          <div className="bg-gradient-ghost col-span-2 rounded-xl border border-white/[0.06] px-5 py-3 sm:col-span-1">
            <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
              Conversion
            </p>

            <p className="text-gradient-primary mt-1 text-[18px] font-semibold tabular-nums">
              {overallConversion.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* ===================================================
            FUNNEL
        =================================================== */}

        <div className="flex-1 border-t border-white/[0.05] px-4 pt-5 pb-5 sm:px-5 lg:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-text-primary text-[11px] font-semibold">Funnel Performance</p>

              <p className="text-text-subtle mt-0.5 text-[10px]">Conversion and drop-off by stage</p>
            </div>

            <span className="bg-gradient-ghost text-text-muted hidden rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] sm:inline-flex">
              {stages.length} stages
            </span>
          </div>

          <div className="flex flex-col">
            {stages.map((stage, index) => {
              const value = conversion[stage.key] ?? 0;

              const overallPercentage = totalLeads > 0 ? (value / totalLeads) * 100 : 0;

              const previousStage = index > 0 ? stages[index - 1] : null;

              const previousValue = previousStage ? (conversion[previousStage.key] ?? 0) : value;

              const stageConversion =
                index === 0 ? 100 : previousValue > 0 ? (value / previousValue) * 100 : 0;

              const dropOff = index === 0 ? 0 : Math.max(previousValue - value, 0);

              const dropOffPercentage =
                index === 0 || previousValue === 0 ? 0 : (dropOff / previousValue) * 100;

              const Icon = stage.Icon;

              return (
                <div key={stage.key} className="relative">
                  {/* -----------------------------------------
                        STAGE
                    ----------------------------------------- */}

                  <div className="group/stage bg-gradient-ghost hover:border-primary/10 relative overflow-hidden rounded-[16px] border border-white/5 p-3 transition-all duration-200 sm:p-4">
                    {/* Main row */}

                    <div className="flex items-center gap-3">
                      {/* Icon */}

                      <div
                        className={cn(
                          [
                            "flex",
                            "size-10",
                            "shrink-0",
                            "items-center",
                            "justify-center",
                            "rounded-xl",
                            "border",
                          ],

                          stage.iconBackground,
                        )}
                      >
                        <Icon className={cn("size-[18px]", stage.iconClass)} strokeWidth={1.8} />
                      </div>

                      {/* Label */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-text-primary truncate text-[12px] font-semibold">
                                {stage.label}
                              </p>

                              <span className="text-text-subtle text-[9px] tabular-nums">
                                {overallPercentage.toFixed(0)}% of leads
                              </span>
                            </div>

                            {index > 0 && (
                              <p className="text-text-subtle mt-1 text-[9px]">
                                {stageConversion.toFixed(1)}% converted from {previousStage?.shortLabel}
                              </p>
                            )}
                          </div>

                          {/* Count */}

                          <div className="shrink-0 text-right">
                            <p className="text-text-primary text-[17px] leading-none font-semibold tabular-nums">
                              {value.toLocaleString()}
                            </p>

                            <p className="text-text-subtle mt-1 text-[9px]">records</p>
                          </div>
                        </div>

                        {/* Progress */}

                        <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className={cn(
                              ["h-full", "rounded-full", "transition-[width]", "duration-700", "ease-out"],

                              stage.progressClass,
                            )}
                            style={{
                              width: `${Math.max(overallPercentage, value > 0 ? 3 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* -----------------------------------------
                        DROP-OFF CONNECTOR
                    ----------------------------------------- */}

                  {index < stages.length - 1 && (
                    <div className="relative flex min-h-[42px] items-center pl-[31px] sm:pl-[35px]">
                      {/* Vertical connection */}

                      <div
                        aria-hidden="true"
                        className="from-border via-primary/20 to-border absolute top-0 bottom-0 left-[31px] w-px bg-gradient-to-b sm:left-[35px]"
                      />

                      {/* Next stage drop-off */}

                      {(() => {
                        const currentValue = conversion[stage.key] ?? 0;

                        const nextStage = stages[index + 1];

                        const nextValue = conversion[nextStage.key] ?? 0;

                        const stageDrop = Math.max(currentValue - nextValue, 0);

                        const stageDropPercentage = currentValue > 0 ? (stageDrop / currentValue) * 100 : 0;

                        return (
                          <div className="border-danger/10 bg-danger/[0.04] ml-5 inline-flex items-center gap-1.5 rounded-full border px-2 py-1">
                            <TrendingDown className="text-danger size-3" />

                            <span className="text-text-subtle text-[9px] tabular-nums">
                              {stageDrop.toLocaleString()} drop-off
                            </span>

                            <span className="text-danger text-[9px] font-medium tabular-nums">
                              {stageDropPercentage.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex flex-col gap-2 border-t border-white/[0.05] px-5 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p className="text-text-subtle text-[10px]">Overall lead-to-sale performance</p>

          <div className="flex items-center gap-2">
            <span className="bg-success size-1.5 rounded-full shadow-[0_0_7px_rgba(50,183,105,0.6)]" />

            <span className="text-success text-[10px] font-medium tabular-nums">
              {sold.toLocaleString()} sales
            </span>

            <span className="text-text-subtle text-[10px]">from</span>

            <span className="text-text-primary text-[10px] font-medium tabular-nums">
              {totalLeads.toLocaleString()} leads
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
