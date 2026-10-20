"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tooltip } from "@/src/components/ui/tooltip";
import { SchedulePicker } from "@/src/components/test-drives/schedule-picker";
import { TimeSlotPicker } from "@/src/components/test-drives/time-slot-picker";
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from "@/src/components/test-drives/availability-indicator";
import { NearestSlots, type NearestPanel } from "@/src/components/test-drives/form/nearest-slots";
import { ShowroomHoursCard } from "@/src/components/test-drives/form/showroom-hours-card";
import {
  getNearestForDriveAction,
  getScheduleInfoForDriveAction,
  getSlotsForDriveAction,
  getStaffAvailabilityForDriveAction,
} from "@/app/admin/test-drives/schedule-actions";
import { addDaysToIso, getClosedDateReason } from "@/src/lib/utils/test-drive-slots";
import { formatTime, getDubaiToday, toDubaiIsoDate } from "@/src/lib/utils/test-drive-format";
import type {
  NearestSlot,
  ShowroomScheduleInfo,
  StaffAvailabilityMap,
  TestDriveEditData,
  TestDriveSlotsResult,
} from "@/src/lib/types/test-drive";

export interface ScheduleDraft {
  locationId: string;
  /** YYYY-MM-DD, Dubai calendar date. */
  date: string;
  /** HH:mm, Dubai time. */
  time: string;
  durationMinutes: number;
  staffId: string | null;
}

export function draftFromEditData(data: TestDriveEditData): ScheduleDraft {
  return {
    locationId: data.locationId,
    date: toDubaiIsoDate(data.scheduledStart),
    time: formatTime(data.scheduledStart),
    durationMinutes: data.durationMinutes,
    staffId: data.staffId,
  };
}

/** The date, time, duration or showroom differs. */
export function scheduleFieldsChanged(a: ScheduleDraft, b: ScheduleDraft): boolean {
  return (
    a.locationId !== b.locationId ||
    a.date !== b.date ||
    a.time !== b.time ||
    a.durationMinutes !== b.durationMinutes
  );
}

/** Anything about the schedule or the host differs. */
export function scheduleDraftChanged(a: ScheduleDraft, b: ScheduleDraft): boolean {
  return scheduleFieldsChanged(a, b) || a.staffId !== b.staffId;
}

interface ScheduleEditorProps {
  testDriveId: string;
  showrooms: { id: string; name: string }[];
  hosts: { id: string; full_name: string }[];
  draft: ScheduleDraft;
  onDraftChange: (patch: Partial<ScheduleDraft>) => void;
  /** Whether this person may change the host (needs the assign permission). */
  canChangeHost: boolean;
  /** Shown when the host can't be changed. */
  lockedHostName: string | null;
  /** A confirmed appointment must always have a host. */
  hostRequired: boolean;
  /** Offer nearest openings when the chosen time isn't available. Off while the schedule is untouched. */
  suggestOnUnavailable: boolean;
  /** Set after a save was refused because the time was taken. */
  conflictAt: { date: string; time: string } | null;
  /** Bump to force every availability check to run again. */
  refreshKey: number;
  errors?: { time?: string };
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-border text-body-sm text-text-muted rounded-md border border-dashed px-3 py-4 text-center">
      {children}
    </p>
  );
}

export function ScheduleEditor({
  testDriveId,
  showrooms,
  hosts,
  draft,
  onDraftChange,
  canChangeHost,
  lockedHostName,
  hostRequired,
  suggestOnUnavailable,
  conflictAt,
  refreshKey,
  errors,
}: ScheduleEditorProps) {
  const [nonce, setNonce] = useState(0);
  const version = `${refreshKey}.${nonce}`;

  // --- The showroom's hours, closures and rules ---
  // Every answer is stored with the key it belongs to, so a stale answer is simply ignored when the inputs change.
  const [scheduleState, setScheduleState] = useState<{
    locationId: string;
    info: ShowroomScheduleInfo | null;
  } | null>(null);

  useEffect(() => {
    if (!draft.locationId) return;
    let cancelled = false;

    getScheduleInfoForDriveAction({ testDriveId, locationId: draft.locationId })
      .then((info) => {
        if (!cancelled) setScheduleState({ locationId: draft.locationId, info });
      })
      .catch(() => {
        if (!cancelled) setScheduleState({ locationId: draft.locationId, info: null });
      });

    return () => {
      cancelled = true;
    };
  }, [testDriveId, draft.locationId]);

  const scheduleReady = !!scheduleState && scheduleState.locationId === draft.locationId;
  const info = scheduleState && scheduleReady ? scheduleState.info : null;
  const infoLoading = !!draft.locationId && !scheduleReady;
  const infoFailed = !!draft.locationId && scheduleReady && info === null;
  const enabled = !!info?.enabled;

  // --- Free time slots for the chosen date ---
  const [slotsState, setSlotsState] = useState<{ key: string; result: TestDriveSlotsResult | null } | null>(
    null,
  );

  const slotsKey =
    enabled && draft.date
      ? [draft.locationId, draft.date, draft.durationMinutes, draft.staffId ?? "", version].join("|")
      : null;

  useEffect(() => {
    if (!slotsKey) return;
    let cancelled = false;

    getSlotsForDriveAction({
      testDriveId,
      locationId: draft.locationId,
      date: draft.date,
      durationMinutes: draft.durationMinutes,
      staffId: draft.staffId,
    })
      .then((result) => {
        if (!cancelled) setSlotsState({ key: slotsKey, result });
      })
      .catch(() => {
        if (!cancelled) setSlotsState({ key: slotsKey, result: null });
      });

    return () => {
      cancelled = true;
    };
  }, [slotsKey, testDriveId, draft.locationId, draft.date, draft.durationMinutes, draft.staffId]);

  const slotsCurrent = slotsKey && slotsState && slotsState.key === slotsKey ? slotsState : null;
  const slotsResult = slotsCurrent ? slotsCurrent.result : null;
  const slotsLoading = !!slotsKey && !slotsCurrent;
  const slotsFailed = !!slotsCurrent && slotsCurrent.result === null;

  // --- Who is free at the chosen time ---
  const [staffState, setStaffState] = useState<{ key: string; map: StaffAvailabilityMap | null } | null>(
    null,
  );

  const staffKey =
    enabled && draft.date && draft.time
      ? [draft.locationId, draft.date, draft.time, draft.durationMinutes, version].join("|")
      : null;

  useEffect(() => {
    if (!staffKey) return;
    let cancelled = false;

    getStaffAvailabilityForDriveAction({
      testDriveId,
      locationId: draft.locationId,
      date: draft.date,
      time: draft.time,
      durationMinutes: draft.durationMinutes,
    })
      .then((map) => {
        if (!cancelled) setStaffState({ key: staffKey, map });
      })
      .catch(() => {
        if (!cancelled) setStaffState({ key: staffKey, map: null });
      });

    return () => {
      cancelled = true;
    };
  }, [staffKey, testDriveId, draft.locationId, draft.date, draft.time, draft.durationMinutes]);

  const staffCurrent = staffKey && staffState && staffState.key === staffKey ? staffState : null;
  const staffMap = staffCurrent ? staffCurrent.map : null;
  const staffLoading = !!staffKey && !staffCurrent;

  // --- Nearest openings: after a refused save, for an unavailable choice, or for a full day ---
  const hasNoFreeTimes =
    !!slotsResult &&
    !slotsResult.closedReason &&
    slotsResult.slots.length > 0 &&
    !slotsResult.slots.some((s) => s.available);

  const chosenSlot =
    draft.time && slotsResult ? slotsResult.slots.find((s) => s.time === draft.time) : undefined;
  const chosenUnavailable = suggestOnUnavailable && !!chosenSlot && !chosenSlot.available;

  const target: { date: string; time: string | null } | null =
    conflictAt ??
    (chosenUnavailable
      ? { date: draft.date, time: draft.time }
      : hasNoFreeTimes && draft.date
        ? { date: draft.date, time: null }
        : null);

  const targetDate = target?.date ?? null;
  const targetTime = target?.time ?? null;
  const reasonKind = conflictAt ? "conflict" : chosenUnavailable ? "unavailable" : "full";

  const nearestKey =
    enabled && targetDate
      ? [
          draft.locationId,
          targetDate,
          targetTime ?? "",
          draft.durationMinutes,
          draft.staffId ?? "",
          version,
          reasonKind,
        ].join("|")
      : null;

  const [nearestState, setNearestState] = useState<{ key: string; slots: NearestSlot[] | null } | null>(null);

  useEffect(() => {
    if (!nearestKey || !targetDate) return;
    let cancelled = false;

    getNearestForDriveAction({
      testDriveId,
      locationId: draft.locationId,
      date: targetDate,
      time: targetTime,
      durationMinutes: draft.durationMinutes,
      staffId: draft.staffId,
    })
      .then((slots) => {
        if (!cancelled) setNearestState({ key: nearestKey, slots });
      })
      .catch(() => {
        if (!cancelled) setNearestState({ key: nearestKey, slots: null });
      });

    return () => {
      cancelled = true;
    };
  }, [
    nearestKey,
    targetDate,
    targetTime,
    testDriveId,
    draft.locationId,
    draft.durationMinutes,
    draft.staffId,
  ]);

  const nearestCurrent = nearestKey && nearestState && nearestState.key === nearestKey ? nearestState : null;

  const nearestPanel: NearestPanel | null = nearestKey
    ? {
        heading:
          reasonKind === "conflict"
            ? "That time is no longer available. Nearest openings:"
            : reasonKind === "unavailable"
              ? "That time isn't available. Nearest openings:"
              : "Nothing is free on this date. Nearest openings:",
        slots: nearestCurrent ? nearestCurrent.slots : null,
        failed: !!nearestCurrent && nearestCurrent.slots === null,
      }
    : null;

  // --- Display ---
  const durationOptions = Array.from(
    new Set([30, 45, 60, 90, 120, info?.settings.default_duration_minutes ?? 60, draft.durationMinutes]),
  ).sort((a, b) => a - b);

  const hostOptions = hosts.map((h) => {
    const entry = staffMap?.[h.id];
    const suffix =
      entry?.state === "busy" ? " (busy at this time)" : entry?.state === "away" ? " (on leave)" : "";
    return { value: h.id, label: `${h.full_name}${suffix}` };
  });

  let hostState: AvailabilityState = "unknown";
  let hostDetail = hostRequired ? "Choose a time and we'll check this person's schedule." : "";

  if (draft.staffId && draft.date && draft.time) {
    if (staffLoading) {
      hostState = "checking";
      hostDetail = "";
    } else {
      const entry = staffMap?.[draft.staffId];
      if (!entry) {
        hostDetail = "We couldn't check this person's schedule. It's checked again when you save.";
      } else if (entry.state === "available") {
        hostState = "available";
        hostDetail = "No other appointments or leave at the chosen time.";
      } else {
        hostState = entry.state === "busy" ? "conflict" : "unavailable";
        hostDetail = entry.detail ?? "Unavailable at this time.";
      }
    }
  }

  const offGrid = !!draft.time && !!slotsResult && !slotsResult.closedReason && !chosenSlot;
  const today = getDubaiToday();

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Showroom"
        placeholder="Choose a showroom"
        options={showrooms.map((s) => ({ value: s.id, label: s.name }))}
        value={draft.locationId}
        onChange={(event) => onDraftChange({ locationId: event.target.value, time: "" })}
      />

      {infoLoading ? (
        <div aria-busy="true" aria-label="Loading showroom schedule">
          <Skeleton className="h-80 w-full" />
        </div>
      ) : infoFailed || !info ? (
        <p
          role="alert"
          className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden="true" />
          We couldn&apos;t load this showroom&apos;s schedule. Choose it again, or close this and reopen it.
        </p>
      ) : !info.enabled ? (
        <p
          role="alert"
          className="text-body-sm text-text-primary rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
        >
          Test drives aren&apos;t available at this showroom right now.
        </p>
      ) : (
        <>
          <ShowroomHoursCard info={info} />

          <SchedulePicker
            value={draft.date || null}
            onChange={(iso) => onDraftChange({ date: iso, time: "" })}
            durationMinutes={draft.durationMinutes}
            onDurationChange={(minutes) => onDraftChange({ durationMinutes: minutes })}
            durationOptions={durationOptions}
            maxDate={addDaysToIso(today, info.settings.max_advance_days)}
            isDateDisabled={(iso) => getClosedDateReason(iso, info) !== null}
            disabledHint="Struck-through days are closed at this showroom."
          />

          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Tooltip content="Check again in case someone else has just booked a slot.">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  leftIcon={<RefreshCw className="size-3.5" />}
                  onClick={() => setNonce((n) => n + 1)}
                  disabled={slotsLoading}
                >
                  Refresh availability
                </Button>
              </Tooltip>
            </div>

            {!draft.date ? (
              <Hint>Pick a date to see the available times.</Hint>
            ) : (
              <TimeSlotPicker
                slots={slotsResult?.slots ?? []}
                value={draft.time || null}
                onChange={(time) => onDraftChange({ time })}
                durationMinutes={draft.durationMinutes}
                isLoading={slotsLoading}
                errorMessage={slotsFailed ? "We couldn't check availability. Please try again." : undefined}
                emptyMessage={
                  slotsResult?.closedReason ?? "No time slots are available for this date. Try another day."
                }
                error={errors?.time}
              />
            )}

            {offGrid && (
              <p role="status" className="text-caption text-text-subtle">
                The current time ({draft.time}) isn&apos;t one of the standard start times. Pick a listed time
                to move it.
              </p>
            )}

            {nearestPanel && (
              <NearestSlots
                panel={nearestPanel}
                onPick={(slot) => onDraftChange({ date: slot.date, time: slot.time })}
              />
            )}
          </div>
        </>
      )}

      {canChangeHost ? (
        <div className="flex flex-col gap-3">
          <Select
            label="Host"
            placeholder={hostRequired ? "Choose a staff member" : "Unassigned"}
            options={hostOptions}
            value={draft.staffId ?? ""}
            onChange={(event) => onDraftChange({ staffId: event.target.value || null })}
          />
          {draft.staffId && (
            <AvailabilityIndicator
              state={hostState}
              label="Host"
              detail={hostDetail}
              help="Checks the host's other confirmed appointments and any leave at the chosen time."
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-label">Host</p>
          <p className="text-body-sm text-text-primary">{lockedHostName ?? "Unassigned"}</p>
          <p className="text-caption text-text-subtle">
            Changing the host needs the assign staff permission.
          </p>
        </div>
      )}
    </div>
  );
}
