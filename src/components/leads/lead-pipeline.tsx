"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";

export function LeadPipeline({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: false, right: false, overflow: false, progress: 0 });

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setPosition({
      left: el.scrollLeft > 2,
      right: el.scrollLeft < max - 2,
      overflow: max > 2,
      progress: max ? el.scrollLeft / max : 0,
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    const content = el.firstElementChild;
    if (content) observer.observe(content);
    el.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const scroll = (direction: -1 | 1) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.min(el.clientWidth * 0.8, 640),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <div className="border-border bg-card min-w-0 overflow-hidden rounded-xl border">
      <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4">
        <div className="text-text-muted flex min-w-0 items-center gap-2 text-xs">
          <MoveHorizontal className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Move leads between stages to update your pipeline</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!position.left}
            aria-label="Previous pipeline stages"
            className="border-border text-text-muted hover:bg-card-hover hover:text-text-primary focus-visible:outline-primary flex size-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!position.right}
            aria-label="Next pipeline stages"
            className="border-border text-text-muted hover:bg-card-hover hover:text-text-primary focus-visible:outline-primary flex size-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={viewportRef}
          role="region"
          aria-label="Sales pipeline stages"
          tabIndex={0}
          className="focus-visible:outline-primary min-w-0 [scrollbar-width:none] overflow-x-auto overscroll-x-contain px-3 py-3 [-ms-overflow-style:none] focus-visible:outline-2 sm:px-4 [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max min-w-full items-stretch gap-3">{children}</div>
        </div>
        {position.left && (
          <div
            aria-hidden="true"
            className="from-card pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r to-transparent"
          />
        )}
        {position.right && (
          <div
            aria-hidden="true"
            className="from-card pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l to-transparent"
          />
        )}
      </div>
      {position.overflow && (
        <div className="bg-border/60 h-1">
          <div
            className="bg-primary/80 h-full transition-[width] duration-150"
            style={{ width: `${Math.max(8, position.progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
