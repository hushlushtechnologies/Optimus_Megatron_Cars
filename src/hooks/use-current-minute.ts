"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

const getSnapshot = (): number | null => Math.floor(Date.now() / 60_000);

// While rendering on the server (and during hydration) there is no "now",
// so server and browser output always match. The real value arrives right after.
const getServerSnapshot = (): number | null => null;

/** Minutes since the Unix epoch, refreshed every 30 seconds. Null until the browser takes over. */
export function useCurrentMinute(): number | null {
  return useSyncExternalStore<number | null>(subscribe, getSnapshot, getServerSnapshot);
}
