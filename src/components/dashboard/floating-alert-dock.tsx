"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AlertTriangle, ChevronRight, X } from "lucide-react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { IconButton } from "@/src/components/ui/icon-button";
import { cn } from "@/src/lib/utils/cn";

interface AlertItem {
  id: string | number;
  message: string;
}

interface FloatingAlertDockProps {
  alerts: AlertItem[];
}

export function FloatingAlertDock({ alerts }: FloatingAlertDockProps) {
  const [isOpen, setIsOpen] = useState(false);

  const reduceMotion = useReducedMotion();

  const panelId = useId();

  const containerRef = useRef<HTMLDivElement>(null);

  const alertCount = alerts.length;

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (alertCount === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="fixed right-3 bottom-5 z-40 sm:top-26">
      {/* =====================================================
          FLOATING ALERT BUTTON
      ===================================================== */}

      <motion.button
        type="button"
        aria-label={`${alertCount} alerts require attention`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
        whileHover={
          reduceMotion
            ? undefined
            : {
                x: -3,
                scale: 1.02,
              }
        }
        whileTap={
          reduceMotion
            ? undefined
            : {
                scale: 0.96,
              }
        }
        className={cn([
          "group",
          "relative",
          "flex",
          "h-13",
          "w-13",
          "items-center",
          "justify-center",
          "rounded-full",
          "border",
          "border-danger/20",
          "bg-base",
          "text-danger",
          "shadow-[0_16px_40px_rgba(0,0,0,0.35),0_0_30px_rgba(239,68,68,0.08)]",
          "backdrop-blur-xl",
          "transition-colors",
          "duration-200",
          "hover:border-danger/60",
        ])}
      >
        {/* Glow */}

        <motion.span
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [0.9, 1.3, 0.9],
                  opacity: [0.18, 0.38, 0.18],
                }
          }
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-danger/20 pointer-events-none absolute size-12 rounded-full blur-xl"
        />

        {/* Warning ring */}

        <motion.span
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.25],
                  opacity: [0.4, 0],
                }
          }
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="border-danger/30 absolute size-8 rounded-full border"
        />

        <AlertTriangle className="relative z-10 size-5" strokeWidth={2} />

        {/* Count */}

        <span className="border-danger/20 bg-danger absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-bold text-white shadow-[0_4px_12px_rgba(239,68,68,0.35)]">
          {alertCount > 99 ? "99+" : alertCount}
        </span>

        {/* Right edge line */}

        <span
          aria-hidden="true"
          className="via-danger/40 absolute top-3 right-0 bottom-3 w-px bg-linear-to-b from-transparent to-transparent"
        />
      </motion.button>

      {/* =====================================================
          ALERT PANEL
      ===================================================== */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="Dashboard alerts"
            initial={
              reduceMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    x: 20,
                    scale: 0.97,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={
              reduceMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    x: 20,
                    scale: 0.97,
                  }
            }
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="border-border bg-base/95 absolute right-0 bottom-16 w-[calc(100vw-32px)] max-w-95 overflow-hidden rounded-xl border shadow-[0_26px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:top-26 sm:right-14 sm:bottom-auto sm:w-95 sm:-translate-y-1/2"
          >
            {/* Ambient warning glow */}

            <div
              aria-hidden="true"
              className="bg-danger/20 pointer-events-none absolute -top-20 -right-16 size-48 rounded-full blur-[70px]"
            />

            {/* Header */}

            <div className="border-border/30 relative flex items-center justify-between border-b px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="border-danger/15 bg-danger/5 text-danger flex size-10 items-center justify-center rounded-xl border">
                  <AlertTriangle className="size-4.5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-body text-text-primary font-semibold">Action required</h3>

                    <span className="bg-danger/10 text-danger rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      {alertCount}
                    </span>
                  </div>

                  <p className="text-text-subtle mt-0.5 text-[11px]">Items that need your attention</p>
                </div>
              </div>

              <IconButton
                aria-label="Close alerts"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </IconButton>
            </div>

            {/* Alert list */}

            <div className="relative max-h-90 scrollbar-thin overflow-y-auto p-2">
              {alerts.map((alert, index) => (
                <motion.button
                  key={alert.id}
                  type="button"
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 6,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: reduceMotion ? 0 : index * 0.035,
                  }}
                  className="group hover:bg-text-primary/4 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200"
                >
                  {/* Status indicator */}

                  <span className="bg-danger mt-1.5 size-1.5 shrink-0 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.7)]" />

                  <span className="text-body-sm text-text-secondary group-hover:text-text-primary flex-1 leading-5 transition-colors">
                    {alert.message}
                  </span>

                  <ChevronRight className="text-text-subtle group-hover:text-text-muted mt-0.5 size-4 shrink-0 transition-all group-hover:translate-x-0.5" />
                </motion.button>
              ))}
            </div>

            {/* Bottom accent */}

            <div
              aria-hidden="true"
              className="h-px w-full bg-linear-to-r from-transparent via-red-400/20 to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
