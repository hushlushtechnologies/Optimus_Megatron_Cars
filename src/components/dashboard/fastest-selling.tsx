import { ArrowRight, Clock3, MapPin, Trophy, Zap } from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { fastestSelling } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

export function FastestSelling() {
  const sortedCars = [...fastestSelling].sort((a, b) => a.daysToSell - b.daysToSell);

  const fastestCar = sortedCars[0];

  const averageDays =
    sortedCars.length > 0 ? sortedCars.reduce((sum, car) => sum + car.daysToSell, 0) / sortedCars.length : 0;

  const maxDays = sortedCars.length > 0 ? Math.max(...sortedCars.map((car) => car.daysToSell)) : 1;

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

      {/* Gold highlight */}

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
            {/* Icon */}

            <div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <Zap className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Fastest Selling
              </h3>

              <p className="text-text-subtle mt-1 text-[11px]">Vehicles with the shortest selling cycle</p>
            </div>
          </div>

          {/* Average */}

          <div className="border-border bg-gradient-ghost hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex">
            <Clock3 className="text-primary size-4" />

            <div>
              <p className="text-text-primary text-[12px] font-semibold tabular-nums">
                {averageDays.toFixed(1)}d
              </p>

              <p className="text-text-subtle text-[9px]">Avg. sell time</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            TOP PERFORMER
        =================================================== */}

        {fastestCar && (
          <div className="pb-4">
            <div className="border-primary/10 bg-gradient-ghost relative overflow-hidden rounded-[18px] border px-4 py-4">
              {/* Glow */}

              <div
                aria-hidden="true"
                className="bg-primary/10 pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-[50px]"
              />

              <div className="relative flex items-center gap-3">
                {/* Trophy */}

                <div className="bg-gradient-primary text-text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] shadow-[0_10px_25px_rgba(212,175,55,0.18)]">
                  <Trophy className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-[9px] font-semibold tracking-[0.14em] uppercase">
                      #1 Fastest
                    </span>
                  </div>

                  <p className="text-text-primary mt-1 truncate text-[14px] font-semibold">
                    {fastestCar.name}
                  </p>

                  <div className="text-text-subtle mt-1 flex items-center gap-1 text-[10px]">
                    <MapPin className="size-3" />

                    <span className="truncate">{fastestCar.location}</span>
                  </div>
                </div>

                {/* Days */}

                <div className="shrink-0 text-right">
                  <p className="text-gradient-primary text-[24px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                    {fastestCar.daysToSell}
                  </p>

                  <p className="text-text-subtle mt-1 text-[9px] tracking-widest uppercase">Days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            RANKING LIST
        =================================================== */}

        <div className="border-border flex-1 border-t pt-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-text-primary text-[11px] font-semibold">Performance Ranking</p>

              <p className="text-text-subtle mt-0.5 text-[10px]">Lower days means faster sale</p>
            </div>

            <span className="border-border bg-gradient-ghost text-text-muted rounded-lg border px-2 py-1 text-[10px]">
              {sortedCars.length} vehicles
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {sortedCars.map((car, index) => {
              const isFirst = index === 0;

              /*
               * Fastest vehicle should have
               * the fullest bar.
               */
              const speedScore =
                maxDays > 0
                  ? Math.max(20, 100 - ((car.daysToSell - (fastestCar?.daysToSell ?? 0)) / maxDays) * 100)
                  : 100;

              return (
                <li
                  key={car.id}
                  className={cn(
                    [
                      "group/item",
                      "relative",
                      "rounded-xl",
                      "border",
                      "px-3",
                      "py-3",
                      "transition-all",
                      "duration-200",

                      "hover:translate-x-0.5",
                    ],

                    isFirst
                      ? ["border-primary/10", "bg-primary/5"]
                      : ["border-transparent", "hover:border-border", "hover:bg-white/2"],
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Ranking */}

                    <div
                      className={cn(
                        [
                          "flex",
                          "size-8",
                          "shrink-0",
                          "items-center",
                          "justify-center",
                          "rounded-[10px]",
                          "border",
                          "text-[11px]",
                          "font-semibold",
                        ],

                        isFirst
                          ? ["border-primary/15", "bg-primary/10", "text-primary"]
                          : ["border-border", "bg-gradient-ghost", "text-text-muted"],
                      )}
                    >
                      {isFirst ? <Trophy className="size-3.5" /> : index + 1}
                    </div>

                    {/* Vehicle info */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-text-primary truncate text-[12px] font-medium">{car.name}</p>

                          <div className="text-text-subtle mt-0.5 flex items-center gap-1 text-[10px]">
                            <MapPin className="size-3" />

                            <span className="truncate">{car.location}</span>
                          </div>
                        </div>

                        {/* Selling time */}

                        <div className="shrink-0 text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span
                              className={cn(
                                ["text-[15px]", "font-semibold", "tabular-nums"],

                                isFirst ? "text-primary" : "text-text-primary",
                              )}
                            >
                              {car.daysToSell}
                            </span>

                            <span className="text-text-subtle text-[9px]">days</span>
                          </div>
                        </div>
                      </div>

                      {/* Speed indicator */}

                      <div className="mt-2 h-0.75 overflow-hidden rounded-full bg-white/3">
                        <div
                          className={cn(
                            ["h-full", "rounded-full", "transition-all", "duration-700"],

                            isFirst ? "bg-gradient-primary" : "bg-info/50",
                          )}
                          style={{
                            width: `${speedScore}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="border-border flex items-center justify-between border-t px-5 py-3 lg:px-6">
          <p className="text-text-subtle text-[10px]">Based on completed vehicle sales</p>

          <button
            type="button"
            className="group/link text-text-muted hover:text-primary inline-flex items-center gap-1.5 text-[10px] font-medium transition-colors"
          >
            View inventory
            <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
