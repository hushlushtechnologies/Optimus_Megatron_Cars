"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0,
  );
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  onEscape?: () => void,
) {
  // The newest onEscape is kept in a ref, so a parent passing a new function on
  // every render doesn't restart the trap (which would steal focus mid-typing).
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!isActive || !container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Only move focus in if it isn't already inside (a panel may place it itself).
    if (!container.contains(document.activeElement)) {
      visibleFocusables(container)[0]?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // An open dropdown (such as the vehicle search) closes itself first.
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.getAttribute("aria-expanded") === "true") return;
        escapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = visibleFocusables(container);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!container.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isActive, containerRef]);
}
