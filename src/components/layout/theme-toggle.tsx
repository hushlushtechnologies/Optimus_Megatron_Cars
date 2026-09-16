"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/src/hooks/use-theme";
import { IconButton } from "@/src/components/ui/icon-button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      variant="ghost"
      onClick={toggleTheme}
      className="overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-flex"
        >
          {theme === "dark" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
