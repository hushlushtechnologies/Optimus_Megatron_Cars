"use client";

import { createContext, useContext, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils/cn";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  groupId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs.List/Tab/Panel must be used inside <Tabs>");
  }

  return context;
}

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const groupId = useId();

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, groupId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* =========================================================
   TAB LIST
========================================================= */

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "scrollbar-hidden border-border -mx-1 flex items-center gap-1 overflow-x-auto border-b px-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* =========================================================
   TAB
========================================================= */

interface TabProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function Tab({ id, children, className }: TabProps) {
  const { activeTab, setActiveTab, groupId } = useTabsContext();
  const isActive = activeTab === id;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );

    if (!tabs.length) return;

    const currentIndex = tabs.indexOf(event.currentTarget);

    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;

      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = tabs.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextTab = tabs[nextIndex];
    nextTab?.focus();
    nextTab?.click();
  };

  return (
    <button
      type="button"
      role="tab"
      id={`${groupId}-tab-${id}`}
      aria-selected={isActive}
      aria-controls={`${groupId}-panel-${id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative shrink-0 rounded-t-md px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150",
        "focus-visible:ring-0 focus-visible:outline-none",
        isActive
          ? "text-text-primary font-medium"
          : "text-text-muted hover:bg-card-hover/50 hover:text-text-primary",
        className,
      )}
    >
      {children}

      {isActive && (
        <motion.span
          layoutId={`${groupId}-tab-indicator`}
          aria-hidden="true"
          className="bg-primary absolute inset-x-3 bottom-0 h-0.5 rounded-full"
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 35,
          }}
        />
      )}
    </button>
  );
}

/* =========================================================
   TAB PANEL
========================================================= */

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab, groupId } = useTabsContext();

  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`${groupId}-panel-${id}`}
      aria-labelledby={`${groupId}-tab-${id}`}
      tabIndex={0}
      className={cn("pt-5 outline-none", className)}
    >
      {children}
    </div>
  );
}
