"use client";

import { useEffect, useState } from "react";

import type { VisibilityState, ColumnOrderState, SortingState } from "@tanstack/react-table";

interface TablePreferences {
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  sorting: SortingState;
}

function loadPreferences(storageKey: string, defaults: TablePreferences): TablePreferences {
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return defaults;
    }

    const parsed = JSON.parse(saved) as Partial<TablePreferences>;

    return {
      ...defaults,
      ...parsed,
    };
  } catch {
    return defaults;
  }
}

export function useTablePreferences(storageKey: string, defaults: TablePreferences) {
  const [preferences, setPreferences] = useState<TablePreferences>(() =>
    loadPreferences(storageKey, defaults),
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Storage may be unavailable or full.
    }
  }, [preferences, storageKey]);

  return {
    columnVisibility: preferences.columnVisibility,

    setColumnVisibility: (v: VisibilityState) =>
      setPreferences((p) => ({
        ...p,
        columnVisibility: v,
      })),

    columnOrder: preferences.columnOrder,

    setColumnOrder: (o: ColumnOrderState) =>
      setPreferences((p) => ({
        ...p,
        columnOrder: o,
      })),

    sorting: preferences.sorting,

    setSorting: (s: SortingState) =>
      setPreferences((p) => ({
        ...p,
        sorting: s,
      })),

    reset: () => setPreferences(defaults),

    isHydrated: true,
  };
}
