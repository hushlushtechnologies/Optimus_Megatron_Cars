"use client";

import { useEffect, useState } from "react";
import { animate } from "motion";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";

export function useCountUp(target: number, duration = 1.2) {
  const prefersReducedMotion = useReducedMotion();

  // Keep the last displayed value in state.
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!Number.isFinite(target)) return;

    if (prefersReducedMotion || duration <= 0) {
      return;
    }

    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setValue(latest);
      },
    });

    return () => {
      controls.stop();
    };
  }, [target, duration, prefersReducedMotion]);

  // Always show the latest value when animation is disabled.
  if (prefersReducedMotion || duration <= 0) {
    return target;
  }

  return value;
}
