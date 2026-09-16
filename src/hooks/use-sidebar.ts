"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
  return ctx;
}

export function useSidebarState(): SidebarContextValue {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return {
    isCollapsed,
    toggleCollapsed: () => setIsCollapsed((v) => !v),
    isMobileOpen,
    setMobileOpen: setIsMobileOpen,
  };
}
