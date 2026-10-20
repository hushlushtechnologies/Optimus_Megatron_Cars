"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";

interface TableScrollControlsProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  contentKey?: string;
}

export function TableScrollControls({ scrollRef, contentKey }: TableScrollControlsProps) {
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    canLeft: false,
    canRight: false,
    progress: 0,
    thumbWidth: 100,
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

    setScrollState({
      canScroll: maxScroll > 2,
      canLeft: el.scrollLeft > 2,
      canRight: el.scrollLeft < maxScroll - 2,
      progress: maxScroll > 0 ? el.scrollLeft / maxScroll : 0,
      thumbWidth: el.scrollWidth > 0 ? Math.min(100, (el.clientWidth / el.scrollWidth) * 100) : 100,
    });
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScroll();

    const observer = new ResizeObserver(updateScroll);
    observer.observe(el);

    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    el.addEventListener("scroll", updateScroll, {
      passive: true,
    });

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateScroll);
    };
  }, [scrollRef, updateScroll, contentKey]);

  function scrollBy(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;

    const distance = Math.min(400, el.clientWidth * 0.7);

    el.scrollBy({
      left: distance * direction,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  function seek(clientX: number) {
    const track = trackRef.current;
    const el = scrollRef.current;

    if (!track || !el) return;

    const rect = track.getBoundingClientRect();
    const thumbPixels = (scrollState.thumbWidth / 100) * rect.width;

    const availableTrack = Math.max(1, rect.width - thumbPixels);

    const position = Math.max(0, Math.min(availableTrack, clientX - rect.left - thumbPixels / 2));

    const maxScroll = el.scrollWidth - el.clientWidth;

    el.scrollLeft = (position / availableTrack) * maxScroll;
  }

  if (!scrollState.canScroll) return null;

  return (
    <div
      className="border-border bg-card flex items-center gap-3 border-t px-3 py-2"
      aria-label="Horizontal table navigation"
    >
      <MoveHorizontal className="text-text-subtle size-3.5 shrink-0" aria-hidden="true" />

      <span className="text-text-muted hidden shrink-0 text-[11px] sm:inline">Scroll columns</span>

      <button
        type="button"
        aria-label="Scroll table left"
        disabled={!scrollState.canLeft}
        onClick={() => scrollBy(-1)}
        className="text-text-muted hover:bg-card-hover hover:text-text-primary flex size-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div
        ref={trackRef}
        role="scrollbar"
        aria-label="Horizontal table position"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollState.progress * 100)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollBy(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollBy(1);
          } else if (event.key === "Home") {
            event.preventDefault();
            scrollRef.current?.scrollTo({ left: 0 });
          } else if (event.key === "End") {
            event.preventDefault();
            const el = scrollRef.current;
            if (el) {
              el.scrollTo({
                left: el.scrollWidth - el.clientWidth,
              });
            }
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          seek(event.clientX);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) {
            seek(event.clientX);
          }
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        className="focus-visible:outline-primary relative h-5 min-w-0 flex-1 cursor-pointer touch-none rounded-md focus-visible:outline-2"
      >
        <div className="bg-border absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />

        <div
          className="bg-text-subtle/70 hover:bg-primary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-colors"
          style={{
            width: `${scrollState.thumbWidth}%`,
            left: `${scrollState.progress * (100 - scrollState.thumbWidth)}%`,
          }}
        />
      </div>

      <button
        type="button"
        aria-label="Scroll table right"
        disabled={!scrollState.canRight}
        onClick={() => scrollBy(1)}
        className="text-text-muted hover:bg-card-hover hover:text-text-primary flex size-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
