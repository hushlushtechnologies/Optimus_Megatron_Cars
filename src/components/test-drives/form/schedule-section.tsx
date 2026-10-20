"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tooltip } from "@/src/components/ui/tooltip";
import { FormSection } from "@/src/components/test-drives/form/form-section";
import { NearestSlots, type NearestPanel } from "@/src/components/test-drives/form/nearest-slots";
import { ShowroomHoursCard } from "@/src/components/test-drives/form/showroom-hours-card";
import { SchedulePicker } from "@/src/components/test-drives/schedule-picker";
import { TimeSlotPicker } from "@/src/components/test-drives/time-slot-picker";
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from "@/src/components/test-drives/availability-indicator";
import { getClosedDateReason, addDaysToIso } from "@/src/lib/utils/test-drive-slots";
import { getDubaiToday } from "@/src/lib/utils/test-drive-format";
import type {
  DayHint,
  NearestSlot,
  ShowroomScheduleInfo,
  TestDriveSlotsResult,
} from "@/src/lib/types/test-drive";

interface ScheduleSectionProps {
  showrooms: { id: string; name: string }[];
  locationId: string;
  onLocationChange: (id: string) => void;
  scheduleInfo: ShowroomScheduleInfo | null;
  scheduleLoading: boolean;
  scheduleFailed: boolean;
  hasVehicle: boolean;
  date: string;
  time: string;
  durationMinutes: number;
  onDateChange: (isoDate: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (minutes: number) => void;
  slotsResult: TestDriveSlotsResult | null;
  slotsLoading: boolean;
  slotsFailed: boolean;
  onRefreshAvailability: () => void;
  dayHints?: Record<string, DayHint>;
  dayHintsLoading: boolean;
  onVisibleMonthChange: (monthStartIso: string) => void;
  nearest: NearestPanel | null;
  onPickNearest: (slot: NearestSlot) => void;
  errors: { locationId?: string; date?: string; time?: string };
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-border text-body-sm text-text-muted rounded-md border border-dashed px-3 py-4 text-center">
      {children}
    </p>
  );
}

export function ScheduleSection({
  showrooms,
  locationId,
  onLocationChange,
  scheduleInfo,
  scheduleLoading,
  scheduleFailed,
  hasVehicle,
  date,
  time,
  durationMinutes,
  onDateChange,
  onTimeChange,
  onDurationChange,
  slotsResult,
  slotsLoading,
  slotsFailed,
  onRefreshAvailability,
  dayHints,
  dayHintsLoading,
  onVisibleMonthChange,
  nearest,
  onPickNearest,
  errors,
}: ScheduleSectionProps) {
  const durationOptions = Array.from(
    new Set([30, 45, 60, 90, 120, scheduleInfo?.settings.default_duration_minutes ?? 60, durationMinutes]),
  ).sort((a, b) => a - b);

  // The vehicle's state on the chosen date, from the same slot list the picker shows.
  let vehicleState: AvailabilityState = "unknown";
  let vehicleDetail = "Pick a date to check this vehicle's schedule.";

  if (hasVehicle && date) {
    if (slotsLoading) {
      vehicleState = "checking";
      vehicleDetail = "";
    } else if (slotsResult) {
      const free = slotsResult.slots.filter((s) => s.available).length;
      if (slotsResult.closedReason) {
        vehicleState = "unavailable";
        vehicleDetail = slotsResult.closedReason;
      } else if (free > 0) {
        vehicleState = "available";
        vehicleDetail = `${free} of ${slotsResult.slots.length} time slots are free on this date.`;
      } else {
        vehicleState = "unavailable";
        vehicleDetail = "Every time slot on this date is taken.";
      }
    }
  }

  const today = getDubaiToday();

  return (
    <FormSection step={4} title="Schedule" description="Choose a showroom, then an available date and time.">
      <Select
        label="Showroom"
        placeholder="Choose a showroom"
        options={showrooms.map((s) => ({ value: s.id, label: s.name }))}
        value={locationId}
        onChange={(event) => onLocationChange(event.target.value)}
      />
      {errors.locationId && (
        <p role="alert" className="text-body-sm -mt-2 text-red-500">
          {errors.locationId}
        </p>
      )}

      {!locationId ? (
        <Hint>Choose a showroom to see its available dates.</Hint>
      ) : scheduleLoading ? (
        <div aria-busy="true" aria-label="Loading showroom schedule">
          <Skeleton className="h-80 w-full" />
        </div>
      ) : scheduleFailed || !scheduleInfo ? (
        <p
          role="alert"
          className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden="true" />
          We couldn&apos;t load this showroom&apos;s schedule. Choose it again, or refresh the page.
        </p>
      ) : !scheduleInfo.enabled ? (
        <p
          role="alert"
          className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
        >
          Test drives aren&apos;t available at this showroom right now.
        </p>
      ) : (
        <>
          <ShowroomHoursCard info={scheduleInfo} />

          <SchedulePicker
            value={date || null}
            onChange={onDateChange}
            durationMinutes={durationMinutes}
            onDurationChange={onDurationChange}
            durationOptions={durationOptions}
            maxDate={addDaysToIso(today, scheduleInfo.settings.max_advance_days)}
            isDateDisabled={(iso) => getClosedDateReason(iso, scheduleInfo) !== null}
            disabledHint="Struck-through days that can't be opened are closed at this showroom."
            dayHints={dayHints}
            hintsLoading={dayHintsLoading}
            onVisibleMonthChange={onVisibleMonthChange}
            error={errors.date}
          />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {hasVehicle ? (
                <AvailabilityIndicator
                  state={vehicleState}
                  label="Vehicle"
                  detail={vehicleDetail}
                  help="Checks this car's confirmed bookings for the chosen date."
                />
              ) : (
                <span />
              )}

              {hasVehicle && date && (
                <Tooltip content="Check again in case someone else has just booked a slot.">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    leftIcon={<RefreshCw className="size-3.5" />}
                    onClick={onRefreshAvailability}
                    disabled={slotsLoading}
                  >
                    Refresh availability
                  </Button>
                </Tooltip>
              )}
            </div>

            {!hasVehicle ? (
              <Hint>Choose a vehicle first so its availability can be checked.</Hint>
            ) : !date ? (
              <>
                <Hint>Pick a date to see the available times.</Hint>
                {errors.time && (
                  <p role="alert" className="text-body-sm text-red-500">
                    {errors.time}
                  </p>
                )}
              </>
            ) : (
              <TimeSlotPicker
                slots={slotsResult?.slots ?? []}
                value={time || null}
                onChange={onTimeChange}
                durationMinutes={durationMinutes}
                isLoading={slotsLoading}
                errorMessage={slotsFailed ? "We couldn't check availability. Please try again." : undefined}
                emptyMessage={
                  slotsResult?.closedReason ?? "No time slots are available for this date. Try another day."
                }
                error={errors.time}
              />
            )}

            {nearest && <NearestSlots panel={nearest} onPick={onPickNearest} />}
          </div>
        </>
      )}
    </FormSection>
  );
}
