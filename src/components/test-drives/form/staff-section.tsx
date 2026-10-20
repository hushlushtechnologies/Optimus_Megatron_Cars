"use client";

import { Select } from "@/src/components/ui/select";
import { FormSection } from "@/src/components/test-drives/form/form-section";
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from "@/src/components/test-drives/availability-indicator";
import type { StaffAvailabilityMap } from "@/src/lib/types/test-drive";

interface StaffSectionProps {
  staff: { id: string; full_name: string }[];
  staffId: string | null;
  onChange: (staffId: string | null) => void;
  /** Whether a date and time have been chosen. */
  hasTime: boolean;
  /** Who is free, busy or on leave at the chosen time. null until it has loaded (or if it failed). */
  availability: StaffAvailabilityMap | null;
  availabilityLoading: boolean;
}

export function StaffSection({
  staff,
  staffId,
  onChange,
  hasTime,
  availability,
  availabilityLoading,
}: StaffSectionProps) {
  let state: AvailabilityState = "unknown";
  let detail = "Optional now. A staff member is required before the request can be approved.";

  if (staffId) {
    if (!hasTime) {
      detail = "Choose a time and we'll check this person's schedule.";
    } else if (availabilityLoading) {
      state = "checking";
      detail = "";
    } else {
      const entry = availability?.[staffId];
      if (!entry) {
        detail = "We couldn't check this person's schedule. They'll be checked again when you save.";
      } else if (entry.state === "available") {
        state = "available";
        detail = "No other appointments or leave at the chosen time.";
      } else {
        state = entry.state === "busy" ? "conflict" : "unavailable";
        detail = entry.detail ?? "Unavailable at this time.";
      }
    }
  }

  const freeCount = availability
    ? staff.filter((s) => availability[s.id]?.state === "available").length
    : null;

  const options = staff.map((s) => {
    const entry = availability?.[s.id];
    const suffix =
      entry?.state === "busy" ? " (busy at this time)" : entry?.state === "away" ? " (on leave)" : "";
    return { value: s.id, label: `${s.full_name}${suffix}` };
  });

  return (
    <FormSection step={5} title="Staff" description="Who will host this test drive?">
      <Select
        label="Assigned staff"
        placeholder="Assign later"
        options={options}
        value={staffId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      />

      {hasTime && freeCount !== null && (
        <p role="status" className="text-caption text-text-subtle">
          {freeCount} of {staff.length} staff {freeCount === 1 ? "is" : "are"} free at the chosen time.
        </p>
      )}

      <AvailabilityIndicator
        state={state}
        label="Staff"
        detail={detail}
        help="Checks the staff member's other confirmed appointments and any leave."
      />
    </FormSection>
  );
}
