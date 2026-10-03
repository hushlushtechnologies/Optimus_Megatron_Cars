import { Globe2, Search, UsersRound, Trophy, type LucideIcon } from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { leadSummary } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

type LeadSourceVisual = {
  Icon: LucideIcon;
  iconClass: string;
  iconBackground: string;
  barClass: string;
};

function getSourceVisual(source: string): LeadSourceVisual {
  const normalized = source.toLowerCase();

  if (normalized.includes("instagram")) {
    return {
      Icon: Search,
      iconClass: "text-pink-300",
      iconBackground: "border-pink-400/15 bg-pink-400/[0.07]",
      barClass: "bg-gradient-to-r from-pink-400 to-purple-400",
    };
  }

  if (normalized.includes("facebook")) {
    return {
      Icon: Search,
      iconClass: "text-blue-300",
      iconBackground: "border-blue-400/15 bg-blue-400/[0.07]",
      barClass: "bg-gradient-to-r from-blue-500 to-blue-300",
    };
  }

  if (normalized.includes("google") || normalized.includes("search")) {
    return {
      Icon: Search,
      iconClass: "text-primary",
      iconBackground: "border-primary/15 bg-primary/[0.07]",
      barClass: "bg-gradient-primary",
    };
  }

  if (normalized.includes("website") || normalized.includes("web")) {
    return {
      Icon: Globe2,
      iconClass: "text-cyan-300",
      iconBackground: "border-cyan-400/15 bg-cyan-400/[0.07]",
      barClass: "bg-gradient-to-r from-cyan-400 to-blue-300",
    };
  }

  return {
    Icon: UsersRound,
    iconClass: "text-text-muted",
    iconBackground: "border-white/[0.06] bg-gradient-ghost",
    barClass: "bg-gradient-to-r from-primary/70 to-primary",
  };
}

export function LeadSummary() {
  const sortedLeads = [...leadSummary].sort((a, b) => b.count - a.count);

  const total = sortedLeads.reduce((sum, item) => sum + item.count, 0);

  const max = sortedLeads.length > 0 ? Math.max(...sortedLeads.map((item) => item.count)) : 0;

  const topSource = sortedLeads[0];

  const topPercentage = topSource && total > 0 ? Math.round((topSource.count / total) * 100) : 0;

  return (
    <Card variant="flat" padding="sm" className="group relative flex h-full flex-col overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="bg-info/20 pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full blur-[90px]"
      />

      {/* top gold highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-44 bg-linear-to-r from-transparent to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between lg:pt-6">
          <div className="flex items-start gap-3">
            <div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <UsersRound className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">Lead Summary</h3>

              <p className="text-text-subtle mt-1 text-[11px]">Lead acquisition by source</p>
            </div>
          </div>

          {/* Total leads */}

          <div className="border-border bg-gradient-ghost flex items-center gap-2 self-start rounded-xl border px-3 py-2">
            <UsersRound className="text-primary size-4" />

            <div>
              <p className="text-text-primary text-[12px] font-semibold tabular-nums">
                {total.toLocaleString()}
              </p>

              <p className="text-text-subtle text-[9px]">Total leads</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            TOP SOURCE
        =================================================== */}

        {topSource && (
          <div className="px-5 pb-4 lg:px-6">
            <div className="border-primary/15 bg-gradient-ghost relative overflow-hidden rounded-[18px] border p-4">
              {/* glow */}

              <div
                aria-hidden="true"
                className="bg-primary/10 pointer-events-none absolute -top-16 -right-16 size-40 rounded-full blur-[60px]"
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-gradient-primary text-text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] shadow-[0_10px_25px_rgba(212,175,55,0.18)]">
                    <Trophy className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-primary text-[9px] font-semibold tracking-[0.12em] uppercase">
                      Top Lead Source
                    </span>

                    <p className="text-text-primary mt-1 truncate text-[14px] font-semibold">
                      {topSource.source}
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-3 sm:text-right">
                  <div>
                    <p className="text-text-subtle text-[9px] tracking-widest uppercase">Leads</p>

                    <p className="text-text-primary mt-1 text-[18px] font-semibold tabular-nums">
                      {topSource.count}
                    </p>
                  </div>

                  <div>
                    <p className="text-text-subtle text-[9px] tracking-widest uppercase">Share</p>

                    <p className="text-gradient-primary mt-1 text-[18px] font-semibold tabular-nums">
                      {topPercentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            SOURCE BREAKDOWN
        =================================================== */}

        <div className="border-border flex-1 border-t px-4 pt-5 pb-5 sm:px-5 lg:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-text-primary text-[11px] font-semibold">Source Performance</p>

              <p className="text-text-subtle mt-0.5 text-[10px]">
                Contribution from each acquisition channel
              </p>
            </div>

            <span className="border-border bg-gradient-ghost text-text-muted hidden rounded-lg border py-1 text-[10px] sm:inline-flex">
              {sortedLeads.length} sources
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {sortedLeads.map((item, index) => {
              const visual = getSourceVisual(item.source);

              const Icon = visual.Icon;

              const contribution = total > 0 ? (item.count / total) * 100 : 0;

              const relativeWidth = max > 0 ? (item.count / max) * 100 : 0;

              const isTop = index === 0;

              return (
                <div
                  key={item.source}
                  className={cn(
                    [
                      "group/item",
                      "rounded-[15px]",
                      "border",
                      "px-3",
                      "py-3",
                      "transition-all",
                      "duration-200",

                      "hover:translate-x-[2px]",
                      "hover:border-primary/[0.12]",
                    ],

                    isTop
                      ? ["border-primary/[0.09]", "bg-primary/[0.025]"]
                      : ["border-white/[0.05]", "bg-gradient-ghost"],
                  )}
                >
                  {/* Main row */}

                  <div className="flex items-center gap-3">
                    {/* Ranking */}

                    <div className="text-text-subtle hidden w-5 shrink-0 text-center text-[10px] font-semibold tabular-nums sm:block">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    {/* Source icon */}

                    <div
                      className={cn(
                        [
                          "flex",
                          "size-9",
                          "shrink-0",
                          "items-center",
                          "justify-center",
                          "rounded-xl",
                          "border",
                        ],

                        visual.iconBackground,
                      )}
                    >
                      <Icon className={cn("size-4", visual.iconClass)} strokeWidth={1.8} />
                    </div>

                    {/* Source */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-text-primary truncate text-[12px] font-semibold">
                              {item.source}
                            </p>

                            {isTop && (
                              <span className="border-primary/15 bg-primary/[0.06] text-primary rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-[0.1em] uppercase">
                                Top
                              </span>
                            )}
                          </div>

                          <p className="text-text-subtle mt-0.5 text-[9px]">
                            {contribution.toFixed(1)}% of total leads
                          </p>
                        </div>

                        {/* Value */}

                        <div className="shrink-0 text-right">
                          <p className="text-text-primary text-[14px] font-semibold tabular-nums">
                            {item.count}
                          </p>

                          <p className="text-text-subtle mt-0.5 text-[9px]">leads</p>
                        </div>
                      </div>

                      {/* Progress */}

                      <div className="mt-2.5 h-[4px] overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className={cn(
                            ["h-full", "rounded-full", "transition-[width]", "duration-700", "ease-out"],
                            visual.barClass,
                          )}
                          style={{
                            width: `${Math.max(relativeWidth, item.count > 0 ? 3 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex flex-col gap-2 border-t border-white/[0.05] px-5 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p className="text-text-subtle text-[10px]">Lead acquisition distribution</p>

          {topSource && (
            <div className="inline-flex items-center gap-1.5">
              <span className="bg-primary size-1.5 rounded-full shadow-[0_0_7px_rgba(235,184,17,0.55)]" />

              <span className="text-text-subtle text-[10px]">Best source</span>

              <span className="text-primary max-w-[120px] truncate text-[10px] font-medium">
                {topSource.source}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
