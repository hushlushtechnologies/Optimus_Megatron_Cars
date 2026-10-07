"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { LeadLostReasonSelector } from "@/src/components/leads/lead-lost-reason-selector";
import { markLeadLost } from "@/app/admin/leads/actions";
import type { LeadLostReason } from "@/src/lib/types/lead";

interface MarkLostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  reasons: LeadLostReason[];
  onMarked: () => void;
}

export function MarkLostDialog({ isOpen, onClose, leadId, reasons, onMarked }: MarkLostDialogProps) {
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!reasonId) {
      setError("Select a lost reason.");
      return;
    }
    setError(undefined);
    setIsSaving(true);
    const result = await markLeadLost(leadId, reasonId, notes);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lead marked as Lost");
    setReasonId(null);
    setNotes("");
    onMarked();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Lead as Lost"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} isLoading={isSaving}>
            Mark Lost
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-text-muted">
          This moves the lead into the Lost stage. A reason is required so this can be tracked over time.
        </p>
        <LeadLostReasonSelector reasons={reasons} value={reasonId} onChange={setReasonId} error={error} />
        <Textarea
          label="Notes"
          placeholder="Optional — any additional context..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}
