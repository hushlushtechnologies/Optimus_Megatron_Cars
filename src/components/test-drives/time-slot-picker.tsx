"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { addMinutesToTime } from "@/src/lib/utils/test-drive-format";
import { cn } from "@/src/lib/utils/cn";
import type { TestDriveTimeSlot } from "@/src/lib/types/test-drive";

interface TimeSlotPickerProps {
  slots: TestDriveTimeSlot[];
  /** Selected slot, "HH:mm", or null. */
  value: string | null;
  onChange: (time: string) => void;
  /** Used to announce each slot's end time to screen readers. */
  durationMinutes?: number;
  isLoading?: boolean;
  /** The slots could not be loaded at all. */
  errorMessage?: string;
  emptyMessage?: string;
  /** Validation message, e.g. "Please select an available time slot." */
  error?: string;
  legend?: string;
  className?: string;
}

const GROUPS = [
  { key: "morning", label: "Morning", includes: (hour: number) => hour < 12 },
  { key: "afternoon", label: "Afternoon", includes: (hour: number) => hour >= 12 && hour < 17 },
  { key: "evening", label: "Evening", includes: (hour: number) => hour >= 17 },
];

export function TimeSlotPicker({
  slots,
  value,
  onChange,
  durationMinutes,
  isLoading,
  errorMessage,
  emptyMessage = "No time slots are available for this date. Try another day.",
  error,
  legend = "Available time slots",
  className,
}: TimeSlotPickerProps) {
  const groupName = useId();
  const errorId = useId();

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-busy="true" aria-label="Loading time slots">
        <p className="text-label">{legend}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <p className="text-label">{legend}</p>
        <p
          role="alert"
          className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
        >
          {errorMessage}
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <p className="text-label">{legend}</p>
        <p
          role="status"
          className="border-border text-body-sm text-text-muted rounded-md border border-dashed px-3 py-4 text-center"
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <fieldset className={cn("flex flex-col gap-3", className)} aria-describedby={error ? errorId : undefined}>
      <legend className="text-label flex w-full items-baseline justify-between gap-2">
        {legend}
        <span className="text-caption text-text-subtle font-normal">
          {availableCount} of {slots.length} available
        </span>
      </legend>

      {GROUPS.map((group) => {
        const groupSlots = slots.filter((s) => group.includes(Number(s.time.slice(0, 2))));
        if (groupSlots.length === 0) return null;

        return (
          <div key={group.key} className="flex flex-col gap-2">
            <p className="text-caption text-text-subtle">{group.label}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {groupSlots.map((slot) => {
                const isSelected = slot.time === value;

                return (
                  <label
                    key={slot.time}
                    className={cn("relative", slot.available ? "cursor-pointer" : "cursor-not-allowed")}
                    title={!slot.available ? (slot.reason ?? "Unavailable") : undefined}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={slot.time}
                      checked={isSelected}
                      disabled={!slot.available}
                      onChange={() => onChange(slot.time)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "text-body-sm peer-focus-visible:ring-primary flex h-10 items-center justify-center gap-1.5 rounded-md border px-3 tabular-nums transition-[background-color,border-color,transform] duration-150 peer-focus-visible:ring-2 motion-reduce:transition-none",
                        isSelected
                          ? "border-primary bg-primary/15 text-primary-text font-semibold"
                          : slot.available
                            ? "border-border bg-card text-text-primary hover:border-primary/50 hover:bg-card-hover motion-safe:active:scale-95"
                            : "border-border bg-card-hover/40 text-text-subtle line-through opacity-60",
                      )}
                    >
                      {isSelected && <Check className="size-3.5" aria-hidden="true" />}
                      {slot.time}
                    </span>
                    {durationMinutes && (
                      <span className="sr-only"> to {addMinutesToTime(slot.time, durationMinutes)}</span>
                    )}
                    {!slot.available && (
                      <span className="sr-only">, unavailable{slot.reason ? `: ${slot.reason}` : ""}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <p id={errorId} role="alert" className="text-body-sm text-red-500">
          {error}
        </p>
      )}
    </fieldset>
  );
}
