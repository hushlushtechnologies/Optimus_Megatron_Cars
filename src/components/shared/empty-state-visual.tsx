"use client";

import { motion, useReducedMotion } from "motion/react";

import { Inbox, Search, SearchX, FileQuestion, CarFront, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/src/lib/utils/cn";

/* =========================================================
   TYPES
========================================================= */

export type EmptyStateVisualIcon = "Inbox" | "Search" | "SearchX" | "FileQuestion" | "CarFront" | "Users";

interface EmptyStateVisualProps {
  icon?: EmptyStateVisualIcon;
  className?: string;
}

/* =========================================================
   ICON MAP
========================================================= */

const iconMap: Record<EmptyStateVisualIcon, LucideIcon> = {
  Inbox,
  Search,
  SearchX,
  FileQuestion,
  CarFront,
  Users,
};

/* =========================================================
   COMPONENT
========================================================= */

export function EmptyStateVisual({ icon = "Inbox", className }: EmptyStateVisualProps) {
  const prefersReducedMotion = useReducedMotion();

  const Icon = iconMap[icon];

  return (
    <div
      className={cn(`relative flex h-[112px] w-[160px] items-center justify-center`, className)}
      aria-hidden="true"
    >
      {/* ===================================================
          SUBTLE BACKGROUND SPOTLIGHT
      =================================================== */}

      <div className="bg-primary/[0.06] pointer-events-none absolute top-1/2 left-1/2 h-20 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />

      {/* ===================================================
          OUTER RING
      =================================================== */}

      <motion.div
        className="border-border/60 absolute size-[94px] rounded-full border"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [1, 1.04, 1],
                opacity: [0.55, 0.8, 0.55],
              }
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          INNER RING
      =================================================== */}

      <div className="border-border bg-card/50 absolute size-[72px] rounded-full border" />

      {/* ===================================================
          FLOATING DOT — LEFT
      =================================================== */}

      <motion.div
        className="bg-primary/35 absolute top-[38px] left-[23px] size-1.5 rounded-full"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, -4, 0],
                opacity: [0.4, 0.8, 0.4],
              }
        }
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          FLOATING DOT — RIGHT
      =================================================== */}

      <motion.div
        className="bg-text-muted/40 absolute top-[67px] right-[26px] size-1 rounded-full"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, 3, 0],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={{
          duration: 4,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          SMALL DECORATIVE LINE — LEFT
      =================================================== */}

      <motion.div
        className="to-border absolute top-[62px] left-[13px] h-px w-5 bg-gradient-to-r from-transparent"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                opacity: [0.35, 0.8, 0.35],
              }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          SMALL DECORATIVE LINE — RIGHT
      =================================================== */}

      <motion.div
        className="to-border absolute top-[43px] right-[12px] h-px w-5 bg-gradient-to-l from-transparent"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                opacity: [0.3, 0.7, 0.3],
              }
        }
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ===================================================
          ICON CONTAINER
      =================================================== */}

      <motion.div
        className="border-primary/15 bg-primary/[0.06] text-primary relative z-10 flex size-12 items-center justify-center overflow-hidden rounded-xl border shadow-sm"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, -2, 0],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* subtle icon spotlight */}

        <div className="bg-primary/10 pointer-events-none absolute -top-4 -left-4 size-10 rounded-full blur-xl" />

        <Icon className="relative z-10 size-5" strokeWidth={1.7} />

        {/* ===============================================
            SCAN LINE
        =============================================== */}

        {!prefersReducedMotion && (
          <motion.div
            className="bg-primary/25 pointer-events-none absolute right-1.5 left-1.5 h-px"
            initial={{
              top: "25%",
              opacity: 0,
            }}
            animate={{
              top: ["25%", "75%", "25%"],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {/* ===================================================
          BOTTOM SHADOW
      =================================================== */}

      <motion.div
        className="absolute bottom-[7px] h-1 w-12 rounded-full bg-black/20 blur-sm"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scaleX: [1, 0.85, 1],
                opacity: [0.25, 0.15, 0.25],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
