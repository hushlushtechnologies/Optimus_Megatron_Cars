"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils/cn";

type TooltipSide = "top" | "bottom" | "left" | "right";

const SIDE_CLASSES: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

interface TooltipProps {
  content: ReactNode;
  /** One focusable element: a button, a link, or anything with tabIndex. */
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: TooltipSide;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({ content, children, side = "top", disabled, className }: TooltipProps) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (disabled) return children;

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") setIsOpen(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      onKeyDown={handleKeyDown}
    >
      {isValidElement(children) ? cloneElement(children, { "aria-describedby": id }) : children}
      {/* Always in the page (just hidden), so aria-describedby always points at real text. */}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "glass-panel border-border text-caption text-text-primary pointer-events-none absolute z-50 w-max max-w-60 rounded-md border px-2.5 py-1.5 text-center transition-opacity duration-150 motion-reduce:transition-none",
          SIDE_CLASSES[side],
          isOpen ? "visible opacity-100" : "invisible opacity-0",
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
