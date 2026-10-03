"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CarFront, CircleCheck, Gauge, PackageCheck } from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { inventoryStatus } from "@/src/lib/mock-data/dashboard";

export function InventoryStatus() {
  const total = inventoryStatus.reduce((sum, status) => sum + status.value, 0);

  const availableStatus = inventoryStatus.find((status) => status.name.toLowerCase().includes("available"));

  const available = availableStatus?.value ?? 0;

  const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0;

  const unavailable = Math.max(total - available, 0);

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

      {/* Top metallic highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-40 bg-linear-to-r from-transparent to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 lg:px-6 lg:pt-6">
          <div className="flex items-start gap-3">
            {/* Icon */}

            <div className="border-primary/15 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <CarFront className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Inventory Health
              </h3>

              <p className="text-text-subtle mt-1 text-[11px]">Vehicle availability overview</p>
            </div>
          </div>

          {/* Health badge */}

          <div className="border-success/15 bg-success/10 hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex">
            <span className="relative flex size-2">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-30" />

              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>

            <div>
              <p className="text-success text-[11px] font-semibold">{availabilityRate}% Available</p>

              <p className="text-text-subtle text-[9px]">Current stock</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            TOP SUMMARY
        =================================================== */}

        <div className="grid grid-cols-2 gap-2 px-5 pb-4 lg:px-6">
          {/* Total stock */}

          <div className="border-border bg-gradient-ghost flex items-center gap-3 rounded-xl border px-3 py-3">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Gauge className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
                Total Stock
              </p>

              <p className="text-text-primary mt-0.5 text-[15px] font-semibold tabular-nums">{total}</p>
            </div>
          </div>

          {/* Available */}

          <div className="border-border bg-gradient-ghost flex items-center gap-3 rounded-xl border px-3 py-3">
            <div className="bg-success/10 text-success flex size-9 shrink-0 items-center justify-center rounded-xl">
              <PackageCheck className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="text-text-subtle text-[9px] font-semibold tracking-[0.12em] uppercase">
                Available
              </p>

              <div className="mt-0.5 flex items-baseline gap-1.5">
                <p className="text-text-primary text-[15px] font-semibold tabular-nums">{available}</p>

                <span className="text-success text-[10px] font-medium">{availabilityRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            CHART + STATUS LIST
        =================================================== */}

        <div className="border-border grid flex-1 gap-4 border-t px-5 pt-5 pb-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-center lg:px-6">
          {/* =================================================
              DONUT
          ================================================= */}

          <div className="relative mx-auto h-45 w-45">
            {/* Outer glow */}

            <div
              aria-hidden="true"
              className="bg-primary/5 pointer-events-none absolute inset-5.5 rounded-full blur-2xl"
            />

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={77}
                  paddingAngle={4}
                  cornerRadius={5}
                  animationDuration={900}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  {inventoryStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>

                {/* Premium Tooltip */}

                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }

                    const item = payload[0];

                    const value = Number(item.value ?? 0);

                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                    return (
                      <div className="border-border bg-base min-w-36.25 rounded-xl border p-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: item.color,
                            }}
                          />

                          <p className="text-text-muted text-[10px] font-medium">{item.name}</p>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between gap-4">
                          <p className="text-text-primary text-[15px] font-semibold tabular-nums">{value}</p>

                          <span className="text-text-subtle text-[10px]">{percentage}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center */}

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-success/[0.07] text-success mb-1 flex size-8 items-center justify-center rounded-lg">
                <CircleCheck className="size-4" />
              </div>

              <span className="text-text-primary text-[25px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {total}
              </span>

              <span className="text-text-subtle mt-1 text-[9px] font-medium tracking-[0.12em] uppercase">
                Vehicles
              </span>
            </div>
          </div>

          {/* =================================================
              STATUS BREAKDOWN
          ================================================= */}

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-text-primary text-[11px] font-semibold">Stock Breakdown</p>

                <p className="text-text-subtle mt-0.5 text-[10px]">Current vehicle status</p>
              </div>

              <span className="border-border bg-gradient-ghost text-text-muted rounded-lg border px-2 py-1 text-[10px] tabular-nums">
                {inventoryStatus.length} statuses
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {inventoryStatus.map((status) => {
                const percentage = total > 0 ? Math.round((status.value / total) * 100) : 0;

                return (
                  <li
                    key={status.name}
                    className="group/status rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-white/5 hover:bg-white/2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Name */}

                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="size-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{
                            backgroundColor: status.color,
                            color: status.color,
                          }}
                        />

                        <span className="text-text-muted group-hover/status:text-text-primary truncate text-[12px] font-medium transition-colors">
                          {status.name}
                        </span>
                      </div>

                      {/* Value */}

                      <div className="flex shrink-0 items-baseline gap-2">
                        <span className="text-text-primary text-[12px] font-semibold tabular-nums">
                          {status.value}
                        </span>

                        <span className="text-text-subtle w-8 text-right text-[10px] tabular-nums">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress */}

                    <div className="mt-2 h-0.75 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ===================================================
            FOOTER SUMMARY
        =================================================== */}

        <div className="border-border flex items-center justify-between border-t px-5 py-3 lg:px-6">
          <p className="text-text-subtle text-[10px]">Inventory availability</p>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-success inline-flex items-center gap-1.5">
              <span className="bg-success size-1.5 rounded-full" />
              {available} available
            </span>

            <span className="text-text-subtle inline-flex items-center gap-1.5">
              <span className="bg-text-subtle size-1.5 rounded-full" />
              {unavailable} other
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
