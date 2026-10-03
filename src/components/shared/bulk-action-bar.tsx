"use client";

import { AnimatePresence, motion } from "motion/react";
import { X, type LucideIcon } from "lucide-react";
import { IconButton } from "@/src/components/ui/icon-button";
import { Button } from "@/src/components/ui/button";

interface BulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "secondary" | "destructive";
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export function BulkActionBar({ selectedCount, onClearSelection, actions }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="glass-panel fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-3 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <IconButton aria-label="Clear selection" variant="ghost" size="sm" onClick={onClearSelection}>
              <X className="size-4" />
            </IconButton>
            <span className="text-body-sm text-text-primary">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>
          <div className="bg-border h-5 w-px" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant={action.variant === "destructive" ? "destructive" : "secondary"}
                  size="sm"
                  leftIcon={Icon ? <Icon className="size-4" /> : undefined}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
