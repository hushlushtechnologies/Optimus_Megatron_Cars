"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { IconButton } from "@/src/components/ui/icon-button";
import { cn } from "@/src/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

export function Modal({ isOpen, onClose, title, description, children, footer, size = "sm" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();

  useFocusTrap(panelRef, isOpen, onClose);

  // The page behind a dialog shouldn't scroll.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  const enter = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={enter}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={enter}
            transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: "easeOut" }}
            className={cn(
              "surface-card-elevated relative z-10 max-h-[calc(100dvh-2rem)] w-full overflow-y-auto overscroll-contain p-4 sm:p-6",
              sizeMap[size],
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-h3">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-body-sm text-text-muted mt-1">
                    {description}
                  </p>
                )}
              </div>
              <IconButton aria-label="Close dialog" variant="ghost" size="sm" onClick={onClose}>
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </div>

            {children}

            {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
