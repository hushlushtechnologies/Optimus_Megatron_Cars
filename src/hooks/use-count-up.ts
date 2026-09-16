"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion";

export function useCountUp(target: number, duration = 1.2) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setValue(latest),
    });

    return () => controls.stop();
  }, [target, duration]);

  return value;
}
