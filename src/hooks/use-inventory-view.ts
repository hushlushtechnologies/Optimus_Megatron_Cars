"use client";

import { useCallback, useSyncExternalStore } from "react";

/* =========================================================
   TYPES
========================================================= */

export type InventoryView = "table" | "grid";

/* =========================================================
   CONFIG
========================================================= */

const STORAGE_KEY = "omc-inventory-view";

const STORAGE_EVENT = "omc-inventory-view-change";

const DEFAULT_VIEW: InventoryView = "table";

/* =========================================================
   HELPERS
========================================================= */

function isInventoryView(value: string | null): value is InventoryView {
  return value === "table" || value === "grid";
}

/* =========================================================
   SNAPSHOTS
========================================================= */

function getClientSnapshot(): InventoryView {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  return isInventoryView(stored) ? stored : DEFAULT_VIEW;
}

/**
 * Critical:
 *
 * Server render AND hydration render both start with
 * exactly the same value.
 */
function getServerSnapshot(): InventoryView {
  return DEFAULT_VIEW;
}

/* =========================================================
   SUBSCRIBE
========================================================= */

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleLocalChange = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);

  window.addEventListener(STORAGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);

    window.removeEventListener(STORAGE_EVENT, handleLocalChange);
  };
}

/* =========================================================
   HOOK
========================================================= */

export function useInventoryView() {
  const view = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setView = useCallback((next: InventoryView) => {
    window.localStorage.setItem(STORAGE_KEY, next);

    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  return {
    view,
    setView,
  };
}
