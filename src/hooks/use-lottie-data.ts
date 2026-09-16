"use client";

import { useEffect, useState } from "react";

export function useLottieData(src?: string) {
  const [data, setData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Lottie file not found");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { data, failed };
}
