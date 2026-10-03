"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";

export function useCountUp(target: number, duration = 1.2) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    if (prefersReducedMotion) {
      // Intentional one-time sync: when reduced motion is on, skip the
      // animation entirely and jump straight to the final value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(target);
      return;
    }

    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setValue(latest),
    });

    return () => controls.stop();
  }, [target, duration, prefersReducedMotion]);

  return value;
}
