import { CalendarClock, CarFront, ChevronRight, Clock3, UserRound } from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { upcomingTestDrives } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

function getScheduleLabel(time: string) {
  const normalized = time.toLowerCase();

  if (normalized.includes("today")) {
    return {
      label: "Today",
      className: "border-primary/15 bg-primary/[0.07] text-primary",
    };
  }

  if (normalized.includes("tomorrow")) {
    return {
      label: "Tomorrow",
      className: "border-blue-400/15 bg-blue-400/[0.07] text-blue-300",
    };
  }

  return null;
}

export function UpcomingTestDrives() {
  const nextDrive = upcomingTestDrives[0];

  return (
    <Card variant="elevated" padding="sm" className="group relative flex h-full flex-col overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/[0.07] pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-blue-500/[0.04] blur-[90px]"
      />

      {/* top highlight */}

      <div
        aria-hidden="true"
        className="via-primary/40 absolute top-0 left-8 h-px w-44 bg-gradient-to-r from-transparent to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 lg:px-6 lg:pt-6">
          <div className="flex items-start gap-3">
            <div className="border-primary/15 bg-primary/[0.08] text-primary flex size-11 shrink-0 items-center justify-center rounded-[14px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <CalendarClock className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-text-primary text-[16px] font-semibold tracking-[-0.01em]">
                Upcoming Test Drives
              </h3>

              <p className="text-text-subtle mt-1 text-[11px]">Scheduled customer appointments</p>
            </div>
          </div>

          {/* Appointment count */}

          <div className="bg-gradient-ghost flex items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2">
            <CalendarClock className="text-primary size-4" />

            <div>
              <p className="text-text-primary text-[12px] font-semibold tabular-nums">
                {upcomingTestDrives.length}
              </p>

              <p className="text-text-subtle text-[9px]">Scheduled</p>
            </div>
          </div>
        </div>

        {/* ===================================================
            NEXT TEST DRIVE
        =================================================== */}

        {nextDrive && (
          <div className="px-5 pb-4 lg:px-6">
            <div className="border-primary/[0.13] bg-gradient-ghost relative overflow-hidden rounded-[18px] border p-4">
              {/* ambient glow */}

              <div
                aria-hidden="true"
                className="bg-primary/[0.09] pointer-events-none absolute -top-14 -right-14 size-36 rounded-full blur-[55px]"
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Main info */}

                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-gradient-primary flex size-12 shrink-0 items-center justify-center rounded-[15px] text-[#0b1220] shadow-[0_10px_25px_rgba(212,175,55,0.18)]">
                    <CarFront className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border-primary/15 bg-primary/[0.07] text-primary rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-[0.12em] uppercase">
                        Next
                      </span>

                      {getScheduleLabel(nextDrive.time) && (
                        <span
                          className={cn(
                            [
                              "rounded-full",
                              "border",
                              "px-2",
                              "py-0.5",
                              "text-[8px]",
                              "font-semibold",
                              "uppercase",
                              "tracking-[0.1em]",
                            ],

                            getScheduleLabel(nextDrive.time)!.className,
                          )}
                        >
                          {getScheduleLabel(nextDrive.time)!.label}
                        </span>
                      )}
                    </div>

                    <p className="text-text-primary mt-1.5 truncate text-[14px] font-semibold">
                      {nextDrive.customer}
                    </p>

                    <div className="text-text-muted mt-1 flex items-center gap-1.5 text-[10px]">
                      <CarFront className="size-3" />

                      <span className="truncate">{nextDrive.car}</span>
                    </div>
                  </div>
                </div>

                {/* Time */}

                <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/[0.06] bg-black/[0.08] px-3 py-2 sm:self-auto">
                  <Clock3 className="text-primary size-4" />

                  <div>
                    <p className="text-text-primary text-[11px] font-medium">{nextDrive.time}</p>

                    <p className="text-text-subtle mt-0.5 text-[9px]">Scheduled time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            APPOINTMENT LIST
        =================================================== */}

        <div className="flex-1 border-t border-white/[0.05] px-4 pt-5 pb-5 sm:px-5 lg:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-text-primary text-[11px] font-semibold">Schedule</p>

              <p className="text-text-subtle mt-0.5 text-[10px]">Upcoming customer test drives</p>
            </div>

            <span className="bg-gradient-ghost text-text-muted hidden rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] sm:inline-flex">
              {upcomingTestDrives.length} bookings
            </span>
          </div>

          <div className="relative">
            {/* timeline */}

            <div
              aria-hidden="true"
              className="from-primary/30 via-border absolute top-5 bottom-5 left-[19px] w-px bg-gradient-to-b to-transparent"
            />

            <ul className="flex flex-col gap-2">
              {upcomingTestDrives.map((drive, index) => {
                const schedule = getScheduleLabel(drive.time);

                const isNext = index === 0;

                return (
                  <li key={drive.id} className="relative pl-[52px]">
                    {/* timeline icon */}

                    <div
                      className={cn(
                        [
                          "absolute",
                          "left-0",
                          "top-2.5",
                          "flex",
                          "size-10",
                          "items-center",
                          "justify-center",
                          "rounded-xl",
                          "border",
                          "shadow-[0_5px_15px_rgba(0,0,0,0.18)]",
                        ],

                        isNext
                          ? ["border-primary/15", "bg-primary/[0.08]", "text-primary"]
                          : ["border-blue-400/10", "bg-blue-400/[0.05]", "text-blue-300"],
                      )}
                    >
                      <CarFront className="size-[17px]" />
                    </div>

                    {/* Row */}

                    <div
                      className={cn(
                        [
                          "group/item",
                          "rounded-[14px]",
                          "border",
                          "px-3.5",
                          "py-3",
                          "transition-all",
                          "duration-200",

                          "hover:translate-x-[2px]",
                          "hover:border-primary/[0.12]",
                        ],

                        isNext
                          ? ["border-primary/[0.09]", "bg-primary/[0.025]"]
                          : ["border-white/[0.05]", "bg-gradient-ghost"],
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Customer / car */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <UserRound className="text-text-subtle size-3" />

                              <p className="text-text-primary truncate text-[12px] font-semibold">
                                {drive.customer}
                              </p>
                            </div>

                            {isNext && (
                              <span className="border-primary/15 bg-primary/[0.06] text-primary rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-[0.1em] uppercase">
                                Next
                              </span>
                            )}
                          </div>

                          <div className="text-text-muted mt-1.5 flex items-center gap-1.5 text-[10px]">
                            <CarFront className="size-3" />

                            <span className="truncate">{drive.car}</span>
                          </div>
                        </div>

                        {/* Time */}

                        <div className="flex shrink-0 items-center gap-2">
                          {schedule && (
                            <span
                              className={cn(
                                ["rounded-lg", "border", "px-2", "py-1", "text-[9px]", "font-medium"],

                                schedule.className,
                              )}
                            >
                              {schedule.label}
                            </span>
                          )}

                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-black/[0.08] px-2 py-1">
                            <Clock3 className="text-text-subtle size-3" />

                            <span className="text-text-muted text-[9px] whitespace-nowrap tabular-nums">
                              {drive.time}
                            </span>
                          </div>

                          <ChevronRight className="text-text-subtle group-hover/item:text-primary hidden size-4 transition-all group-hover/item:translate-x-0.5 sm:block" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3 lg:px-6">
          <p className="text-text-subtle text-[10px]">Customer test-drive schedule</p>

          <div className="inline-flex items-center gap-1.5">
            <span className="bg-primary size-1.5 rounded-full shadow-[0_0_7px_rgba(235,184,17,0.55)]" />

            <span className="text-primary text-[10px] font-medium">{upcomingTestDrives.length} upcoming</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
