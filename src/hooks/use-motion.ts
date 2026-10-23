"use client";

import { useReducedMotion } from "@/src/hooks/use-reduced-motion";

/** The module's motion vocabulary: a few durations and one curve. Everything uses these. */
export const MOTION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.4,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

/** Motion props that switch themselves off when the person asks for reduced motion. */
export function useMotion() {
  const reduce = useReducedMotion();

  const transition = (duration: number = MOTION.base, delay = 0) => ({
    duration: reduce ? 0.01 : duration,
    delay: reduce ? 0 : delay,
    ease: MOTION.ease,
  });

  /** A gentle rise. Pass the item's index to stagger a list. */
  const fadeUp = (index = 0) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: transition(MOTION.base, Math.min(index, 8) * 0.035),
  });

  return { reduce, transition, fadeUp };
}
