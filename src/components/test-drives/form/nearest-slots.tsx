"use client";

import { format } from "date-fns";
import { CalendarSearch } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { addDaysToIso } from "@/src/lib/utils/test-drive-slots";
import { getDubaiToday, parseIsoDate } from "@/src/lib/utils/test-drive-format";
import type { NearestSlot } from "@/src/lib/types/test-drive";

export interface NearestPanel {
  heading: string;
  /** null while loading. */
  slots: NearestSlot[] | null;
  failed: boolean;
}

interface NearestSlotsProps {
  panel: NearestPanel;
  onPick: (slot: NearestSlot) => void;
}

export function NearestSlots({ panel, onPick }: NearestSlotsProps) {
  const today = getDubaiToday();
  const tomorrow = addDaysToIso(today, 1);

  const label = (slot: NearestSlot) => {
    const when =
      slot.date === today
        ? "Today"
        : slot.date === tomorrow
          ? "Tomorrow"
          : format(parseIsoDate(slot.date), "EEE d MMM");
    return `${when} · ${slot.time}`;
  };

  return (
    <div
      role="region"
      aria-label="Nearest available times"
      aria-live="polite"
      className="border-primary/30 bg-primary/5 flex flex-col gap-2.5 rounded-lg border p-3"
    >
      <p className="text-body-sm text-text-primary flex items-center gap-2 font-medium">
        <CalendarSearch className="text-primary-text size-4 shrink-0" aria-hidden="true" />
        {panel.heading}
      </p>

      {panel.failed ? (
        <p role="alert" className="text-body-sm text-text-muted">
          We couldn&apos;t look for other times. Pick a different date, or press Refresh availability.
        </p>
      ) : panel.slots === null ? (
        <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Looking for openings">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28" />
          ))}
        </div>
      ) : panel.slots.length === 0 ? (
        <p className="text-body-sm text-text-muted">
          Nothing is free in the next two weeks for this combination. Try another vehicle, showroom, staff
          member or duration.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {panel.slots.map((slot) => (
            <Button
              key={`${slot.date}-${slot.time}`}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onPick(slot)}
            >
              {label(slot)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
