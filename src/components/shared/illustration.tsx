"use client";

import { Lottie } from "lottie-react";
import type { LucideIcon } from "lucide-react";

import { useLottieData } from "@/src/hooks/use-lottie-data";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { cn } from "@/src/lib/utils/cn";

interface IllustrationProps {
  /** Path under /public, e.g. "/lottie/empty.json" */
  lottieSrc?: string;

  /** Shown while loading, if the file is missing, or reduced motion is enabled */
  fallbackIcon: LucideIcon;

  tone?: "neutral" | "danger" | "success";

  className?: string;
}

const toneClasses = {
  neutral: "bg-card-hover text-text-muted",
  danger: "bg-red-500/10 text-red-400",
  success: "bg-emerald-500/10 text-emerald-400",
} as const;

export function Illustration({
  lottieSrc,
  fallbackIcon: FallbackIcon,
  tone = "neutral",
  className,
}: IllustrationProps) {
  const { data, failed } = useLottieData(lottieSrc);

  const prefersReducedMotion = useReducedMotion();

  const showLottie = Boolean(data) && !failed && !prefersReducedMotion;

  if (showLottie && data) {
    return (
      <div className={cn("size-28", className)} aria-hidden="true">
        <Lottie src={data} loop autoplay />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("flex size-20 items-center justify-center rounded-full", toneClasses[tone], className)}
    >
      <FallbackIcon className="size-9" />
    </div>
  );
}
