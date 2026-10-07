"use client";

import { useCallback, useSyncExternalStore } from "react";

export type LeadView = "kanban" | "table";

const STORAGE_KEY = "omc-leads-view";

const STORAGE_EVENT = "omc-leads-view-change";

/* =========================================================
   HELPERS
========================================================= */

function isLeadView(value: string | null): value is LeadView {
  return value === "kanban" || value === "table";
}

function getViewSnapshot(): LeadView {
  if (typeof window === "undefined") {
    return "kanban";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  return isLeadView(stored) ? stored : "kanban";
}

function getServerViewSnapshot(): LeadView {
  return "kanban";
}

/* =========================================================
   SUBSCRIBE
========================================================= */

function subscribeToView(callback: () => void) {
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
   HYDRATION STORE
========================================================= */

function subscribeToHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

/* =========================================================
   HOOK
========================================================= */

export function useLeadView() {
  const view = useSyncExternalStore(subscribeToView, getViewSnapshot, getServerViewSnapshot);

  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const setView = useCallback((next: LeadView) => {
    window.localStorage.setItem(STORAGE_KEY, next);

    /*
     * The native "storage" event
     * only fires in other tabs.
     *
     * Dispatch our own event so
     * this tab updates immediately.
     */
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  return {
    view,
    setView,
    isHydrated,
  };
}
