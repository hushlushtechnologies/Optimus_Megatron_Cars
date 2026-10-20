"use client";

import type { UseFormRegister } from "react-hook-form";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { FormSection } from "@/src/components/test-drives/form/form-section";
import type { CreateTestDriveValues } from "@/src/lib/validation/test-drive";

interface NotesSectionProps {
  register: UseFormRegister<CreateTestDriveValues>;
  requestSources: { id: string; name: string }[];
  requestSourceId: string | null;
  onRequestSourceChange: (id: string | null) => void;
  errors: { customerNotes?: string; internalNotes?: string };
}

export function NotesSection({
  register,
  requestSources,
  requestSourceId,
  onRequestSourceChange,
  errors,
}: NotesSectionProps) {
  return (
    <FormSection step={6} title="Notes" description="Optional details for the team.">
      <Select
        label="How was this requested?"
        options={requestSources.map((s) => ({ value: s.id, label: s.name }))}
        value={requestSourceId ?? ""}
        onChange={(event) => onRequestSourceChange(event.target.value || null)}
      />

      <div className="flex flex-col gap-1.5">
        <Textarea
          label="Customer request notes"
          placeholder="Anything the customer asked for, such as a specific route or a second driver."
          rows={3}
          {...register("customerNotes")}
        />
        {errors.customerNotes && (
          <p role="alert" className="text-body-sm text-red-500">
            {errors.customerNotes}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Textarea
          label="Internal notes"
          placeholder="Only staff see these. The customer never does."
          rows={3}
          {...register("internalNotes")}
        />
        {errors.internalNotes && (
          <p role="alert" className="text-body-sm text-red-500">
            {errors.internalNotes}
          </p>
        )}
      </div>
    </FormSection>
  );
}
