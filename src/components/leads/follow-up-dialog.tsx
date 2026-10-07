"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Modal } from "@/src/components/ui/modal";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";

import { createFollowUp, editFollowUp, rescheduleFollowUp } from "@/app/admin/leads/[id]/follow-up-actions";

import type { FollowUpType, LeadFollowUp } from "@/src/lib/types/lead";

/* =========================================================
   FOLLOW-UP TYPES
========================================================= */

const TYPE_OPTIONS = [
  "Phone Call",
  "WhatsApp",
  "Email",
  "Showroom Visit",
  "Test Drive",
  "General Follow-Up",
] as const satisfies readonly FollowUpType[];

function isFollowUpType(value: string): value is FollowUpType {
  return (TYPE_OPTIONS as readonly string[]).includes(value);
}

/* =========================================================
   PROPS
========================================================= */

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;

  mode: "create" | "edit" | "reschedule";

  followUp?: LeadFollowUp;
}

interface FollowUpDialogContentProps {
  onClose: () => void;
  leadId: string;

  mode: "create" | "edit" | "reschedule";

  followUp?: LeadFollowUp;
}

/* =========================================================
   DATE HELPERS
========================================================= */

function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function toTimeInput(iso: string): string {
  return new Date(iso).toISOString().slice(11, 16);
}

/* =========================================================
   OUTER DIALOG
========================================================= */

export function FollowUpDialog({ isOpen, onClose, leadId, mode, followUp }: FollowUpDialogProps) {
  /*
   * Do not keep the form mounted while the dialog is closed.
   *
   * Each time the dialog opens, FollowUpDialogContent mounts
   * again and its useState initial values are calculated from
   * the latest followUp.
   *
   * This removes the need for useEffect + setState entirely.
   */
  if (!isOpen) {
    return null;
  }

  return (
    <FollowUpDialogContent
      key={`${mode}-${followUp?.id ?? "new"}-${followUp?.scheduled_at ?? ""}`}
      onClose={onClose}
      leadId={leadId}
      mode={mode}
      followUp={followUp}
    />
  );
}

/* =========================================================
   DIALOG CONTENT
========================================================= */

function FollowUpDialogContent({ onClose, leadId, mode, followUp }: FollowUpDialogContentProps) {
  /* =========================================================
     FORM STATE
  ========================================================= */

  const [type, setType] = useState<FollowUpType>(followUp?.type ?? "Phone Call");

  const [date, setDate] = useState<string>(followUp ? toDateInput(followUp.scheduled_at) : "");

  const [time, setTime] = useState<string>(followUp ? toTimeInput(followUp.scheduled_at) : "09:00");

  const [notes, setNotes] = useState<string>(followUp?.notes ?? "");

  const [isSaving, setIsSaving] = useState(false);

  /* =========================================================
     TITLE
  ========================================================= */

  const title =
    mode === "create" ? "Schedule Follow-Up" : mode === "edit" ? "Edit Follow-Up" : "Reschedule Follow-Up";

  /* =========================================================
     TYPE CHANGE
  ========================================================= */

  const handleTypeChange = (value: string) => {
    if (isFollowUpType(value)) {
      setType(value);
    }
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Please select a follow-up date.");

      return;
    }

    setIsSaving(true);

    try {
      let result: {
        error: string | null;
      };

      if (mode === "create") {
        result = await createFollowUp(leadId, type, date, time, notes);
      } else if (mode === "edit" && followUp) {
        result = await editFollowUp(followUp.id, leadId, type, date, time, notes);
      } else if (mode === "reschedule" && followUp) {
        result = await rescheduleFollowUp(followUp.id, leadId, date, time);
      } else {
        result = {
          error: "Something went wrong.",
        };
      }

      if (result.error) {
        toast.error(result.error);

        return;
      }

      toast.success(
        mode === "create"
          ? "Follow-up scheduled"
          : mode === "edit"
            ? "Follow-up updated"
            : "Follow-up rescheduled",
      );

      onClose();
    } catch (error: unknown) {
      console.error("Follow-up action failed:", error);

      toast.error("Unable to save the follow-up. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="button" onClick={handleSubmit} isLoading={isSaving} disabled={!date || isSaving}>
            {mode === "create" ? "Schedule" : mode === "edit" ? "Save Changes" : "Reschedule"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* ===================================================
            TYPE
        =================================================== */}

        {mode !== "reschedule" && (
          <Select
            label="Type"
            options={TYPE_OPTIONS.map((option) => ({
              value: option,

              label: option,
            }))}
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
          />
        )}

        {/* ===================================================
            DATE / TIME
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <Input label="Time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </div>

        {/* ===================================================
            NOTES
        =================================================== */}

        {mode !== "reschedule" && (
          <Textarea
            label="Notes"
            placeholder="Optional"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        )}

        {/* ===================================================
            RESCHEDULE INFO
        =================================================== */}

        {mode === "reschedule" && (
          <p className="text-caption text-text-subtle">
            The original follow-up stays on record as rescheduled; this creates a new one at the date above.
          </p>
        )}
      </div>
    </Modal>
  );
}
