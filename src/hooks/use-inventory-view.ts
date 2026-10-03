"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "omc-inventory-view";

export type InventoryView = "table" | "grid";

function getInitialView(defaultView: InventoryView): InventoryView {
  if (typeof window === "undefined") {
    return defaultView;
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  return saved === "table" || saved === "grid" ? saved : defaultView;
}

export function useInventoryView(defaultView: InventoryView = "table") {
  const [view, setViewState] = useState<InventoryView>(() => getInitialView(defaultView));

  const setView = useCallback((next: InventoryView) => {
    setViewState(next);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { view, setView };
}
