"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Select } from "@/src/components/ui/select";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { formatDuration, getDubaiToday, parseIsoDate, toIsoDate } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { DayHint } from "@/src/lib/types/test-drive";

const WEEKDAYS = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
];

const WEEK_OPTIONS = { weekStartsOn: 1 } as const; // weeks start on Monday

interface SchedulePickerProps {
  /** Selected date as YYYY-MM-DD (Dubai calendar date), or null. */
  value: string | null;
  onChange: (isoDate: string) => void;
  durationMinutes: number;
  onDurationChange: (minutes: number) => void;
  durationOptions?: number[];
  /** Earliest selectable date. Defaults to today in Dubai. */
  minDate?: string;
  maxDate?: string;
  /** Mark extra days unavailable, e.g. showroom closed days. */
  isDateDisabled?: (isoDate: string) => boolean;
  disabledHint?: string;
  /**
   * Per-date availability, keyed by YYYY-MM-DD. "closed" days can't be chosen.
   * "full" days stay selectable (so the nearest openings can be shown) but are
   * struck through. "limited" days get a small marker.
   */
  dayHints?: Record<string, DayHint>;
  hintsLoading?: boolean;
  /** Called with the first day of the month being shown, including on first render. */
  onVisibleMonthChange?: (monthStartIso: string) => void;
  error?: string;
  className?: string;
}

export function SchedulePicker({
  value,
  onChange,
  durationMinutes,
  onDurationChange,
  durationOptions = [30, 45, 60, 90, 120],
  minDate,
  maxDate,
  isDateDisabled,
  disabledHint = "Struck-through days are closed or unavailable.",
  dayHints,
  hintsLoading,
  onVisibleMonthChange,
  error,
  className,
}: SchedulePickerProps) {
  const prefersReducedMotion = useReducedMotion();
  const today = getDubaiToday();
  const effectiveMin = minDate ?? today;

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseIsoDate(value ?? today)));
  const [focusIso, setFocusIso] = useState(value ?? today);
  const pendingFocus = useRef(false);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());

  // When something outside the picker changes the date (for example choosing
  // a suggested time in another month), show that month. Comparing during
  // render and resetting is React's documented way to do this without an effect.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value) {
      setViewMonth(startOfMonth(parseIsoDate(value)));
      setFocusIso(value);
    }
  }

  const monthKey = toIsoDate(viewMonth);
  const monthCallback = useRef(onVisibleMonthChange);
  useEffect(() => {
    monthCallback.current = onVisibleMonthChange;
  });
  useEffect(() => {
    monthCallback.current?.(monthKey);
  }, [monthKey]);

  const isDisabled = (iso: string) =>
    iso < effectiveMin ||
    (!!maxDate && iso > maxDate) ||
    (isDateDisabled?.(iso) ?? false) ||
    dayHints?.[iso]?.state === "closed";

  const days = eachDayOfInterval({
    start: startOfWeek(viewMonth, WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(viewMonth), WEEK_OPTIONS),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  // Only one day is a tab stop (the "roving tabindex" pattern), so Tab moves
  // past the calendar and the arrow keys move within it.
  const tabStopIso = days.some((d) => toIsoDate(d) === focusIso) ? focusIso : monthKey;

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    cellRefs.current.get(focusIso)?.focus();
  }, [focusIso, viewMonth]);

  const moveFocus = (target: Date) => {
    setFocusIso(toIsoDate(target));
    setViewMonth(startOfMonth(target));
    pendingFocus.current = true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = parseIsoDate(tabStopIso);
    let next: Date;

    switch (event.key) {
      case "ArrowLeft":
        next = addDays(current, -1);
        break;
      case "ArrowRight":
        next = addDays(current, 1);
        break;
      case "ArrowUp":
        next = addDays(current, -7);
        break;
      case "ArrowDown":
        next = addDays(current, 7);
        break;
      case "PageUp":
        next = addMonths(current, -1);
        break;
      case "PageDown":
        next = addMonths(current, 1);
        break;
      case "Home":
        next = startOfWeek(current, WEEK_OPTIONS);
        break;
      case "End":
        next = endOfWeek(current, WEEK_OPTIONS);
        break;
      default:
        return;
    }

    event.preventDefault();
    moveFocus(next);
  };

  const select = (iso: string) => {
    if (isDisabled(iso)) return;
    setFocusIso(iso);
    setViewMonth(startOfMonth(parseIsoDate(iso)));
    onChange(iso);
  };

  const tomorrow = toIsoDate(addDays(parseIsoDate(today), 1));
  const canGoBack = toIsoDate(startOfMonth(viewMonth)) > toIsoDate(startOfMonth(parseIsoDate(effectiveMin)));
  const canGoForward = !maxDate || toIsoDate(endOfMonth(viewMonth)) < maxDate;

  return (
    <div className={cn("border-border bg-card flex flex-col gap-4 rounded-lg border p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-label">Date</span>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={value === today ? "outline" : "secondary"}
            disabled={isDisabled(today)}
            onClick={() => select(today)}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant={value === tomorrow ? "outline" : "secondary"}
            disabled={isDisabled(tomorrow)}
            onClick={() => select(tomorrow)}
          >
            Tomorrow
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <IconButton
          type="button"
          aria-label="Previous month"
          variant="ghost"
          size="sm"
          disabled={!canGoBack}
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
        >
          <ChevronLeft className="size-4" />
        </IconButton>
        <p aria-live="polite" className="text-body-sm text-text-primary font-medium">
          {format(viewMonth, "MMMM yyyy")}
        </p>
        <IconButton
          type="button"
          aria-label="Next month"
          variant="ghost"
          size="sm"
          disabled={!canGoForward}
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="size-4" />
        </IconButton>
      </div>

      <div role="grid" aria-label="Choose a date" onKeyDown={handleKeyDown} className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((day) => (
            <span
              key={day.short}
              role="columnheader"
              aria-label={day.long}
              className="text-caption text-text-subtle py-1"
            >
              {day.short}
            </span>
          ))}
        </div>

        <motion.div
          key={monthKey}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-1"
        >
          {weeks.map((week) => (
            <div key={toIsoDate(week[0])} role="row" className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const iso = toIsoDate(day);
                const disabled = isDisabled(iso);
                const hint = dayHints?.[iso];
                const isSelected = iso === value;
                const isToday = iso === today;
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const isFull = hint?.state === "full";
                const isLimited = hint?.state === "limited";

                const descriptor = disabled
                  ? `unavailable${hint ? `: ${hint.label}` : ""}`
                  : hint
                    ? hint.label
                    : "";

                return (
                  <button
                    key={iso}
                    ref={(el) => {
                      if (el) cellRefs.current.set(iso, el);
                      else cellRefs.current.delete(iso);
                    }}
                    type="button"
                    role="gridcell"
                    tabIndex={iso === tabStopIso ? 0 : -1}
                    aria-selected={isSelected}
                    aria-disabled={disabled || undefined}
                    aria-label={`${format(day, "EEEE d MMMM yyyy")}${isToday ? ", today" : ""}${descriptor ? `, ${descriptor}` : ""}`}
                    title={hint?.label}
                    onClick={() => select(iso)}
                    className={cn(
                      "text-body-sm focus-visible:ring-primary relative mx-auto flex size-9 h-10 w-full max-w-10 items-center justify-center rounded-md tabular-nums transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none",
                      !inMonth && "text-text-subtle",
                      inMonth &&
                        !disabled &&
                        !isSelected &&
                        !isFull &&
                        "text-text-primary hover:bg-card-hover",
                      isFull && !isSelected && "text-text-subtle hover:bg-card-hover line-through",
                      isToday && !isSelected && "ring-primary/60 ring-1",
                      isSelected && "bg-primary font-semibold text-[#0b1220]",
                      disabled && "text-text-subtle cursor-not-allowed line-through opacity-60",
                    )}
                  >
                    {format(day, "d")}
                    {isLimited && !disabled && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0.5 size-1 rounded-full bg-amber-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="flex flex-col gap-1">
        {dayHints && (
          <p className="text-caption text-text-subtle flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
              Few times left
            </span>
            <span>A struck-through day you can still open has no free times.</span>
          </p>
        )}
        <p className="text-caption text-text-subtle">{disabledHint}</p>
        {hintsLoading && (
          <p role="status" aria-live="polite" className="text-caption text-text-subtle">
            Checking availability…
          </p>
        )}
      </div>

      <div className="border-border grid grid-cols-1 items-end gap-4 border-t pt-4 sm:grid-cols-2">
        <div>
          <p className="text-caption text-text-subtle">Selected</p>
          <p className="text-body-sm text-text-primary">
            {value ? format(parseIsoDate(value), "EEEE, d MMMM yyyy") : "No date chosen yet"}
          </p>
        </div>
        <Select
          label="Duration"
          options={durationOptions.map((m) => ({ value: String(m), label: formatDuration(m) }))}
          value={String(durationMinutes)}
          onChange={(e) => onDurationChange(Number(e.target.value))}
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
