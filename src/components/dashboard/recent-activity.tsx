import {
  Activity,
  BadgeCheck,
  CalendarClock,
  CarFront,
  CircleDollarSign,
  Clock3,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { recentActivity } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

type ActivityVisual = {
  Icon: LucideIcon;
  iconClass: string;
  iconBackground: string;
  dotClass: string;
};

function getActivityVisual(label: string, detail: string): ActivityVisual {
  const text = `${label} ${detail}`.toLowerCase();

  if (text.includes("sold") || text.includes("sale") || text.includes("deal")) {
    return {
      Icon: BadgeCheck,
      iconClass: "text-success",
      iconBackground: "border-success/15 bg-success/[0.07]",
      dotClass: "bg-success",
    };
  }

  if (text.includes("customer") || text.includes("lead")) {
    return {
      Icon: UserPlus,
      iconClass: "text-blue-300",
      iconBackground: "border-blue-400/15 bg-blue-400/[0.07]",
      dotClass: "bg-blue-300",
    };
  }

  if (text.includes("test drive") || text.includes("appointment") || text.includes("reservation")) {
    return {
      Icon: CalendarClock,
      iconClass: "text-warning",
      iconBackground: "border-warning/15 bg-warning/[0.07]",
      dotClass: "bg-warning",
    };
  }

  if (text.includes("payment") || text.includes("invoice") || text.includes("revenue")) {
    return {
      Icon: CircleDollarSign,
      iconClass: "text-primary",
      iconBackground: "border-primary/15 bg-primary/[0.07]",
      dotClass: "bg-primary",
    };
  }

  if (text.includes("car") || text.includes("vehicle") || text.includes("inventory")) {
    return {
      Icon: CarFront,
      iconClass: "text-primary",
      iconBackground: "border-primary/15 bg-primary/[0.07]",
      dotClass: "bg-primary",
    };
  }

  return {
    Icon: Activity,
    iconClass: "text-text-muted",
    iconBackground: "border-white/[0.06] bg-gradient-ghost",
    dotClass: "bg-text-muted",
  };
}

export function RecentActivity() {
  return (
    <Card variant="elevated" padding="sm" className="group relative flex h-full flex-col overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/[0.06] pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 size-56 rounded-full bg-blue-500/[0.04] blur-[90px]"
      />

      {/* top highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-40 bg-gradient-to-r from-transparent to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 lg:px-6 lg:pt-6">
          <div className="flex items-start gap-3">
            <div className="border-primary/15 bg-primary/[0.08] text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <Activity className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Recent Activity
              </h3>

              <p className="text-text-subtle mt-1 text-[11px]">Latest updates across operations</p>
            </div>
          </div>

          {/* Activity count */}

          <div className="bg-gradient-ghost flex items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2">
            <span className="relative flex size-2">
              <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-30" />

              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>

            <div>
              <p className="text-text-primary text-[11px] font-semibold">{recentActivity.length}</p>

              <p className="text-text-subtle text-[9px]">Updates</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            ACTIVITY FEED
        =================================================== */}

        <div className="flex-1 border-t border-white/[0.05] px-4 pt-5 pb-5 sm:px-5 lg:px-6">
          <ol className="relative">
            {/* Timeline line */}

            <div
              aria-hidden="true"
              className="from-primary/35 via-border absolute top-4 bottom-4 left-[19px] w-px bg-gradient-to-b to-transparent"
            />

            <div className="flex flex-col gap-3">
              {recentActivity.map((item, index) => {
                const visual = getActivityVisual(item.label, item.detail);

                const Icon = visual.Icon;

                const isLatest = index === 0;

                return (
                  <li key={item.id} className="relative pl-[52px]">
                    {/* Timeline node */}

                    <div
                      className={cn(
                        [
                          "absolute",
                          "left-0",
                          "top-3",

                          "flex",
                          "size-10",
                          "items-center",
                          "justify-center",

                          "rounded-xl",
                          "border",

                          "shadow-[0_5px_15px_rgba(0,0,0,0.18)]",
                        ],

                        visual.iconBackground,
                      )}
                    >
                      <Icon className={cn("size-[17px]", visual.iconClass)} strokeWidth={1.8} />

                      {/* connector dot */}

                      <span
                        className={cn(
                          ["absolute", "-left-[4px]", "size-1.5", "rounded-full"],
                          visual.dotClass,
                        )}
                      />
                    </div>

                    {/* Activity card */}

                    <div
                      className={cn(
                        [
                          "group/item",
                          "relative",
                          "overflow-hidden",

                          "rounded-[14px]",
                          "border",

                          "px-3.5",
                          "py-3",

                          "transition-all",
                          "duration-200",

                          "hover:translate-x-[2px]",
                          "hover:border-primary/[0.12]",
                        ],

                        isLatest
                          ? ["border-primary/[0.10]", "bg-primary/[0.025]"]
                          : ["border-white/[0.05]", "bg-gradient-ghost"],
                      )}
                    >
                      {/* Latest glow */}

                      {isLatest && (
                        <div
                          aria-hidden="true"
                          className="bg-primary/[0.07] pointer-events-none absolute -top-12 -right-10 size-28 rounded-full blur-[45px]"
                        />
                      )}

                      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        {/* Activity text */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-text-primary text-[12px] font-semibold">{item.label}</p>

                            {isLatest && (
                              <span className="border-primary/15 bg-primary/[0.06] text-primary rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-[0.1em] uppercase">
                                Latest
                              </span>
                            )}
                          </div>

                          <p className="text-text-muted mt-1 text-[11px] leading-5">{item.detail}</p>
                        </div>

                        {/* Timestamp */}

                        <div className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/[0.05] bg-black/[0.08] px-2 py-1">
                          <Clock3 className="text-text-subtle size-3" />

                          <span className="text-text-subtle text-[9px] whitespace-nowrap tabular-nums">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </div>
          </ol>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3 lg:px-6">
          <p className="text-text-subtle text-[10px]">Activity from all modules</p>

          <div className="inline-flex items-center gap-1.5">
            <span className="bg-success size-1.5 rounded-full shadow-[0_0_7px_rgba(50,183,105,0.6)]" />

            <span className="text-success text-[10px] font-medium">Live</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
