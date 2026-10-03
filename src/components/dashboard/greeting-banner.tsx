"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CloudSun, MoonStar, Sparkles, Sun, Sunset } from "lucide-react";

import { FloatingAlertDock } from "@/src/components/dashboard/floating-alert-dock";

import { actionAlerts } from "@/src/lib/mock-data/dashboard";
import { cn } from "@/src/lib/utils/cn";

type TimePeriod = "morning" | "afternoon" | "evening" | "night";

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";

  return "night";
}

const timeConfig = {
  morning: {
    greeting: "Good morning",
    description: "A fresh start. Here's what's happening across Optimus Megatron Cars today.",

    Icon: CloudSun,

    accent: "from-amber-300 via-yellow-400 to-orange-400",

    glow: "bg-amber-400/20",

    secondaryGlow: "bg-orange-400/10",
  },

  afternoon: {
    greeting: "Good afternoon",
    description: "Things are moving. Here's your latest Optimus Megatron Cars overview.",

    Icon: Sun,

    accent: "from-yellow-200 via-amber-400 to-yellow-500",

    glow: "bg-yellow-400/20",

    secondaryGlow: "bg-amber-400/10",
  },

  evening: {
    greeting: "Good evening",
    description: "Wrapping up the day? Here's the latest activity across Optimus Megatron Cars.",

    Icon: Sunset,

    accent: "from-orange-300 via-primary to-purple-500",

    glow: "bg-orange-400/20",

    secondaryGlow: "bg-purple-500/10",
  },

  night: {
    greeting: "Good evening",
    description: "Here's a quick look at what's happening across Optimus Megatron Cars.",

    Icon: MoonStar,

    accent: "from-blue-200 via-indigo-300 to-primary",

    glow: "bg-indigo-400/20",

    secondaryGlow: "bg-blue-500/10",
  },
} as const;

function GreetingVisual({ period }: { period: TimePeriod }) {
  const reduceMotion = useReducedMotion();

  const config = timeConfig[period];

  const isNight = period === "night";
  const isEvening = period === "evening";

  return (
    <div className="border-border relative flex size-19.5 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border bg-white/2.5">
      {/* outer ambient glow */}

      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.12, 1],
                opacity: [0.4, 0.7, 0.4],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn("absolute size-16 rounded-full blur-2xl", config.glow)}
      />

      {/* rotating halo */}

      {!isNight && (
        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: 360,
                }
          }
          transition={{
            duration: period === "afternoon" ? 16 : 22,
            repeat: Infinity,
            ease: "linear",
          }}
          className="border-primary/20 absolute size-14.5 rounded-full border border-dashed"
        />
      )}

      {/* evening horizon */}

      {isEvening && (
        <>
          <div
            aria-hidden="true"
            className="absolute right-0 bottom-0 left-0 h-7 bg-linear-to-t from-purple-500/12 to-transparent"
          />

          <div
            aria-hidden="true"
            className="absolute right-3 bottom-5 left-3 h-px bg-linear-to-r from-transparent via-orange-300/40 to-transparent"
          />
        </>
      )}

      {/* stars */}

      {isNight && (
        <>
          {[
            ["left-[17px]", "top-[15px]", "delay-0"],
            ["right-[16px]", "top-[21px]", "delay-300"],
            ["left-[26px]", "bottom-[14px]", "delay-500"],
          ].map(([x, y, delay], index) => (
            <motion.span
              key={index}
              aria-hidden="true"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.25, 1, 0.25],
                      scale: [0.8, 1.2, 0.8],
                    }
              }
              transition={{
                duration: 2.5 + index * 0.5,
                repeat: Infinity,
                delay: index * 0.4,
              }}
              className={cn("absolute size-1 rounded-full bg-blue-200", x, y, delay)}
            />
          ))}
        </>
      )}

      {/* main orb */}

      <motion.div
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.08,
                rotate: period === "night" ? -8 : 8,
              }
        }
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -2, 0],
              }
        }
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },

          scale: {
            duration: 0.2,
          },

          rotate: {
            duration: 0.2,
          },
        }}
        className={cn(
          [
            "relative",
            "z-10",
            "flex",
            "size-11",
            "items-center",
            "justify-center",
            "rounded-2xl",
            "bg-linear-to-br",
            "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
          ],
          config.accent,
        )}
      >
        <config.Icon className="size-5 text-[#10131a]" strokeWidth={2} />
      </motion.div>
    </div>
  );
}

export function GreetingBanner({ name }: { name: string }) {
  const reduceMotion = useReducedMotion();

  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setHour(new Date().getHours());
    };

    updateTime();

    const interval = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const period = useMemo<TimePeriod>(() => {
    if (hour === null) return "morning";

    return getTimePeriod(hour);
  }, [hour]);

  const config = timeConfig[period];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      {/* =====================================================
          LEFT — GREETING
      ===================================================== */}

      <motion.section
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 8,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                y: -2,
              }
        }
        className="group bg-base hover:border-primary/[0.14] relative isolate min-h-33 overflow-hidden rounded-[24px] border border-white/8 shadow-[0_16px_45px_rgba(0,0,0,0.18)] transition-colors duration-300"
      >
        {/* Background ambient gradient */}

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={cn(
              [
                "absolute",
                "-left-16",
                "-top-28",
                "size-64",
                "rounded-full",
                "blur-[90px]",
                "transition-opacity",
                "duration-500",
              ],
              config.secondaryGlow,
            )}
          />

          <div
            className={cn(
              [
                "absolute",
                "-right-20",
                "-bottom-32",
                "size-72",
                "rounded-full",
                "blur-[100px]",
                "opacity-70",
              ],
              config.glow,
            )}
          />

          {/* gold top highlight */}

          <div className="via-primary/35 absolute top-0 left-12 h-px w-55 bg-linear-to-r from-transparent to-transparent" />
        </div>

        <div className="flex h-full items-center gap-4 px-5 py-5 sm:gap-5 sm:px-6">
          {/* Animated time visual */}

          <GreetingVisual period={period} />

          {/* Content */}

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="bg-card text-text-subtle inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] px-2 py-1 text-[9px] font-semibold tracking-[0.18em] uppercase">
                <Sparkles className="text-primary size-3" />
                Today
              </span>
            </div>

            <h2 className="text-text-primary text-[22px] leading-tight font-semibold tracking-[-0.02em] sm:text-[25px]">
              {config.greeting}, <span className="text-gradient-primary">{name}</span>
            </h2>

            <p className="text-body-sm text-text-muted mt-1.5 max-w-xl">{config.description}</p>
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          RIGHT — LEAVE CURRENT ALERT AREA FOR NOW
      ===================================================== */}
      <FloatingAlertDock alerts={actionAlerts} />
    </div>
  );
}
