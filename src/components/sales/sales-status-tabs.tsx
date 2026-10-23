"use client";

import { motion } from "motion/react";
import { useMotion } from "@/src/hooks/use-motion";
import { SALES_DEAL_STATUSES, type SalesDealStatus } from "@/src/lib/types/sales";
import { cn } from "@/src/lib/utils/cn";

interface SalesStatusTabsProps {
  /** The statuses currently filtered. One status highlights its tab, none highlights All. */
  selected: SalesDealStatus[];
  onSelect: (status: SalesDealStatus | null) => void;
}

export function SalesStatusTabs({ selected, onSelect }: SalesStatusTabsProps) {
  const { transition } = useMotion();
  const current = selected.length === 1 ? selected[0] : selected.length === 0 ? null : undefined;

  const tabs: { key: SalesDealStatus | null; label: string }[] = [
    { key: null, label: "All" },
    ...SALES_DEAL_STATUSES.map((status) => ({ key: status, label: status })),
  ];

  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="scrollbar-hidden border-border -mx-1 flex gap-1 overflow-x-auto border-b px-1"
    >
      {tabs.map((tab) => {
        const active = current === tab.key;
        return (
          <button
            key={tab.label}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(tab.key)}
            className={cn(
              "text-body-sm relative min-h-11 shrink-0 px-3.5 font-medium transition-colors",
              active ? "text-text-primary" : "text-text-muted hover:text-text-primary",
            )}
          >
            {tab.label}
            {active && (
              <motion.span
                layoutId="sales-status-underline"
                transition={transition(0.25)}
                className="bg-primary absolute inset-x-2 -bottom-px h-0.5 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
