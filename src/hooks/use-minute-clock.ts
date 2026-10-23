"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / 60_000) * 60_000;
}

/** The current time in ms, refreshed every minute. 0 on the server, so nothing renders from a stale clock. */
export function useMinuteClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
