"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { LeadStage } from "@/src/lib/types/lead";

interface LeadStageColumnProps {
  stage: LeadStage;
  count: number;
  totalValue?: number;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;

  // Drag-and-drop state from LeadKanbanBoard
  isDragging?: boolean;
  isDropTarget?: boolean;
}

interface ScrollState {
  canScroll: boolean;
  canUp: boolean;
  canDown: boolean;
  progress: number;
  thumbSize: number;
}

const INITIAL_SCROLL_STATE: ScrollState = {
  canScroll: false,
  canUp: false,
  canDown: false,
  progress: 0,
  thumbSize: 100,
};

export function LeadStageColumn({
  stage,
  count,
  totalValue,
  footer,
  children,
  className,
  isDragging = false,
  isDropTarget = false,
}: LeadStageColumnProps) {
  const headingId = `stage-heading-${stage.id}`;

  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  const [scrollState, setScrollState] = useState<ScrollState>(INITIAL_SCROLL_STATE);

  const updateScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const canScroll = maxScroll > 2;

    const nextState: ScrollState = {
      canScroll,
      canUp: canScroll && scrollTop > 2,
      canDown: canScroll && scrollTop < maxScroll - 2,
      progress: canScroll ? scrollTop / maxScroll : 0,
      thumbSize: scrollHeight > 0 ? Math.min(100, (clientHeight / scrollHeight) * 100) : 100,
    };

    setScrollState((previous) => {
      if (
        previous.canScroll === nextState.canScroll &&
        previous.canUp === nextState.canUp &&
        previous.canDown === nextState.canDown &&
        Math.abs(previous.progress - nextState.progress) < 0.001 &&
        Math.abs(previous.thumbSize - nextState.thumbSize) < 0.1
      ) {
        return previous;
      }

      return nextState;
    });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(updateScroll);

    resizeObserver.observe(element);

    const mutationObserver = new MutationObserver(() => {
      updateScroll();

      for (const child of Array.from(element.children)) {
        resizeObserver.observe(child);
      }
    });

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
    });

    for (const child of Array.from(element.children)) {
      resizeObserver.observe(child);
    }

    element.addEventListener("scroll", updateScroll, {
      passive: true,
    });

    updateScroll();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener("scroll", updateScroll);
    };
  }, [updateScroll]);

  function scrollByDirection(direction: -1 | 1) {
    const element = scrollRef.current;
    if (!element) return;

    const distance = Math.max(140, element.clientHeight * 0.65);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    element.scrollBy({
      top: distance * direction,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }

  function seek(clientY: number, offset?: number) {
    const track = trackRef.current;
    const element = scrollRef.current;

    if (!track || !element) return;

    const rect = track.getBoundingClientRect();

    const thumbPixels = (scrollState.thumbSize / 100) * rect.height;

    const availableTrack = Math.max(0, rect.height - thumbPixels);

    if (availableTrack <= 0) return;

    const thumbOffset = offset ?? thumbPixels / 2;

    const position = Math.max(0, Math.min(availableTrack, clientY - rect.top - thumbOffset));

    const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);

    element.scrollTop = (position / availableTrack) * maxScroll;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();

    const thumbPixels = (scrollState.thumbSize / 100) * rect.height;

    const thumbTop = scrollState.progress * (rect.height - thumbPixels);

    const pointerPosition = event.clientY - rect.top;

    const insideThumb = pointerPosition >= thumbTop && pointerPosition <= thumbTop + thumbPixels;

    dragOffsetRef.current = insideThumb ? pointerPosition - thumbTop : thumbPixels / 2;

    draggingRef.current = true;

    event.currentTarget.setPointerCapture(event.pointerId);

    seek(event.clientY, dragOffsetRef.current);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;

    event.preventDefault();

    seek(event.clientY, dragOffsetRef.current);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTrackKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        scrollByDirection(-1);
        break;

      case "ArrowDown":
        event.preventDefault();
        scrollByDirection(1);
        break;

      case "PageUp":
        event.preventDefault();
        scrollRef.current?.scrollBy({
          top: -(scrollRef.current?.clientHeight ?? 300),
          behavior: "smooth",
        });
        break;

      case "PageDown":
        event.preventDefault();
        scrollRef.current?.scrollBy({
          top: scrollRef.current?.clientHeight ?? 300,
          behavior: "smooth",
        });
        break;

      case "Home":
        event.preventDefault();
        scrollRef.current?.scrollTo({ top: 0 });
        break;

      case "End": {
        event.preventDefault();

        const element = scrollRef.current;

        if (element) {
          element.scrollTo({
            top: element.scrollHeight - element.clientHeight,
          });
        }
        break;
      }
    }
  }

  const progressPercent = Math.round(scrollState.progress * 100);

  const thumbStyle: CSSProperties = {
    height: `${scrollState.thumbSize}%`,
    top: `${scrollState.progress * (100 - scrollState.thumbSize)}%`,
  };

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "group/kanban-column relative flex w-[85vw] max-w-80 shrink-0 snap-start flex-col",
        "bg-card-hover/40 overflow-hidden rounded-xl border",
        "transition-all duration-200 sm:w-80",

        isDropTarget
          ? "border-primary bg-primary/5 ring-primary/30 ring-2"
          : "border-border hover:border-primary/20",

        isDragging && !isDropTarget && "border-dashed",

        className,
      )}
    >
      {/* Stage header */}
      <div className="border-border bg-card/70 relative shrink-0 border-b px-3.5 py-3">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: stage.color_hex }}
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: stage.color_hex,
                boxShadow: `0 0 0 3px ${stage.color_hex}18`,
              }}
            />

            <h3
              id={headingId}
              className="text-text-primary truncate text-sm font-semibold"
              title={stage.name}
            >
              {stage.name}
            </h3>
          </div>

          <span className="border-border bg-card text-text-muted shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums">
            <span className="sr-only">
              {count} {count === 1 ? "lead" : "leads"}
            </span>
            <span aria-hidden="true">{count.toLocaleString()}</span>
          </span>
        </div>

        {totalValue !== undefined && totalValue > 0 && (
          <p className="text-text-subtle mt-2 text-xs">AED {totalValue.toLocaleString()}</p>
        )}
      </div>

      {/* Scrollable cards */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          role="region"
          aria-label={`${stage.name} lead cards`}
          tabIndex={0}
          className={cn(
            "flex min-h-28 flex-col gap-2.5 overflow-y-auto",
            "px-2.5 py-3",
            "lg:max-h-[calc(100vh-24rem)]",
            "overscroll-y-contain",
            "[scrollbar-width:none]",
            "[-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden",
            "focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-inset",
            "focus-visible:ring-primary/50",
          )}
        >
          {children}
        </div>

        {/* Fade at bottom indicates more cards below */}
        {scrollState.canDown && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-9",
              "from-card via-card/70 bg-gradient-to-t to-transparent",
            )}
          />
        )}
      </div>

      {/* Optional existing footer */}
      {footer && <div className="border-border/60 shrink-0 border-t px-3 py-2">{footer}</div>}

      {/* Custom vertical navigation */}
      {scrollState.canScroll && (
        <div
          role="group"
          aria-label={`${stage.name} column navigation`}
          className={cn("flex shrink-0 items-center gap-3", "border-border bg-card/80 border-t", "px-3 py-2")}
        >
          <button
            type="button"
            aria-label={`Scroll ${stage.name} leads up`}
            title="Scroll up"
            disabled={!scrollState.canUp}
            onClick={() => scrollByDirection(-1)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              "border-border bg-card border",
              "text-text-muted",
              "transition-all duration-150",
              "hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
              "active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-30",
              "disabled:hover:border-border disabled:hover:bg-card",
              "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              ref={trackRef}
              role="scrollbar"
              aria-label={`${stage.name} vertical scroll position`}
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-valuetext={`${progressPercent}% scrolled`}
              tabIndex={0}
              onKeyDown={handleTrackKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={cn(
                "relative h-5 w-full cursor-pointer touch-none",
                "rounded-md",
                "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              <div className="bg-border absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />

              <div
                aria-hidden="true"
                className="bg-primary/80 hover:bg-primary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-colors"
                style={{
                  width: `${Math.max(12, scrollState.thumbSize)}%`,
                  left: `${scrollState.progress * (100 - Math.max(12, scrollState.thumbSize))}%`,
                }}
              />
            </div>

            <span className="text-text-subtle text-[10px] tabular-nums">{progressPercent}% scrolled</span>
          </div>

          <button
            type="button"
            aria-label={`Scroll ${stage.name} leads down`}
            title="Scroll down"
            disabled={!scrollState.canDown}
            onClick={() => scrollByDirection(1)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              "border-border bg-card border",
              "text-text-muted",
              "transition-all duration-150",
              "hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
              "active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-30",
              "disabled:hover:border-border disabled:hover:bg-card",
              "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
