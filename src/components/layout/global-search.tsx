"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { IconButton } from "@/src/components/ui/icon-button";

export function GlobalSearch() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <div className="hidden w-64 md:block">
        <Input
          aria-label="Global search"
          placeholder="Search anything..."
          leftIcon={<Search className="size-4" />}
        />
      </div>

      <IconButton
        aria-label="Open search"
        variant="ghost"
        className="md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Search className="size-4" />
      </IconButton>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="glass-panel fixed inset-x-3 top-3 z-[60] flex items-center gap-2 p-3 md:hidden"
          >
            <div className="flex-1">
              <Input
                autoFocus
                aria-label="Global search"
                placeholder="Search anything..."
                leftIcon={<Search className="size-4" />}
              />
            </div>
            <IconButton aria-label="Close search" variant="ghost" onClick={() => setIsMobileOpen(false)}>
              <X className="size-4" />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
