import { BadgeDollarSign, Crown, Handshake, MapPin, Target, Trophy } from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { topSalesExecutive } from "@/src/lib/mock-data/dashboard";

export function TopSalesExecutive() {
  const averageDealValue =
    topSalesExecutive.dealsClosed > 0 ? topSalesExecutive.revenue / topSalesExecutive.dealsClosed : 0;

  return (
    <Card variant="flat" padding="sm" className="group relative flex h-full flex-col overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/20 pointer-events-none absolute -top-24 -right-20 size-64 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="bg-info/20 pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full blur-[90px]"
      />

      {/* Gold top highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-40 bg-linear-to-r from-transparent to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-start justify-between gap-4 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <Trophy className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Top Sales Executive
              </h3>

              <p className="text-text-subtle mt-1 text-[11px]">Best sales performance this month</p>
            </div>
          </div>

          {/* Top performer badge */}

          <div className="border-primary/15 bg-gradient-ghost hidden items-center gap-2 rounded-full border px-3 py-2 sm:flex">
            <Crown className="text-primary size-3" />

            <span className="text-primary text-[9px] font-semibold tracking-widest uppercase">
              Top Performer
            </span>
          </div>
        </div>

        {/* ===================================================
            EXECUTIVE PROFILE
        =================================================== */}

        <div className="px-4 pb-4 lg:px-6">
          <div className="border-primary/10 bg-gradient-ghost relative overflow-hidden rounded-[18px] border p-4">
            {/* Inner glow */}

            <div
              aria-hidden="true"
              className="bg-primary/10 pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-[60px]"
            />

            <div className="relative flex items-center gap-3">
              {/* Avatar */}

              <div className="relative shrink-0">
                <div className="bg-gradient-primary text-text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] shadow-[0_10px_25px_rgba(212,175,55,0.18)]">
                  {topSalesExecutive.name.charAt(0).toUpperCase()}
                </div>

                {/* Crown marker */}

                <span className="border-primary/20 text-primary absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border bg-[#071229] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <Crown className="size-3" />
                </span>
              </div>

              {/* Employee information */}

              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate text-[15px] font-semibold">
                  {topSalesExecutive.name}
                </p>

                <div className="text-text-subtle mt-1 flex items-center gap-1.5 text-[10px]">
                  <MapPin className="size-3" />

                  <span className="truncate">{topSalesExecutive.location}</span>
                </div>

                <div className="border-success/10 bg-success/10 text-success mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-medium">
                  <span className="bg-success size-1.5 rounded-full shadow-[0_0_6px_rgba(50,183,105,0.7)]" />
                  Leading this month
                </div>
              </div>

              {/* Main revenue */}

              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-text-subtle text-[9px] font-semibold tracking-[0.1em] uppercase">
                  Revenue
                </p>

                <p className="text-gradient-primary mt-1 text-[22px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  AED {(topSalesExecutive.revenue / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            PERFORMANCE METRICS
        =================================================== */}

        <div className="grid flex-1 grid-cols-1 gap-2 border-t border-white/10 px-4 py-4 sm:grid-cols-3">
          {/* Deals closed */}

          <div className="bg-gradient-ghost hover:border-primary/12 flex flex-col items-center justify-center gap-3 rounded-xl border border-white/6 px-3 py-3 transition-colors">
            <div className="bg-primary/[0.07] text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Handshake className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle text-[9px] font-semibold tracking-widest uppercase">
                Deals Closed
              </p>

              <p className="text-text-primary mt-0.5 w-full text-center text-[15px] font-semibold tabular-nums">
                {topSalesExecutive.dealsClosed}
              </p>
            </div>
          </div>

          {/* Total revenue */}

          <div className="bg-gradient-ghost hover:border-primary/[0.12] flex flex-col items-center justify-center gap-3 rounded-xl border border-white/6 px-3 py-3 transition-colors">
            <div className="bg-success/[0.07] text-success flex size-9 shrink-0 items-center justify-center rounded-xl">
              <BadgeDollarSign className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle w-full text-center text-[9px] font-semibold tracking-[0.1em] uppercase">
                Revenue
              </p>

              <p className="text-text-primary mt-0.5 truncate text-[15px] font-semibold tabular-nums">
                AED {(topSalesExecutive.revenue / 1000).toFixed(0)}K
              </p>
            </div>
          </div>

          {/* Average deal */}

          <div className="bg-gradient-ghost hover:border-primary/[0.12] flex flex-col items-center justify-center gap-3 rounded-xl border border-white/6 px-3 py-3 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/[0.07] text-blue-300">
              <Target className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle w-full text-center text-[9px] font-semibold tracking-[0.1em] uppercase">
                Avg. Deal
              </p>

              <p className="text-text-primary mt-0.5 truncate text-[15px] font-semibold tabular-nums">
                AED {(averageDealValue / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3 lg:px-6">
          <p className="text-text-subtle text-[10px]">Monthly sales performance</p>

          <div className="text-primary inline-flex items-center gap-1.5 text-[10px] font-medium">
            <Trophy className="size-3" />
            #1 Sales Executive
          </div>
        </div>
      </div>
    </Card>
  );
}
