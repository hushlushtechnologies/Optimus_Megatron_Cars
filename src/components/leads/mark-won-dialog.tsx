"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { markLeadWon } from "@/app/admin/leads/actions";

interface MarkWonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onMarked: () => void;
}

export function MarkWonDialog({ isOpen, onClose, leadId, onMarked }: MarkWonDialogProps) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    const result = await markLeadWon(leadId, notes);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lead marked as Won");
    setNotes("");
    onMarked();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Lead as Won"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving}>
            Mark Won
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-text-muted">
          This moves the lead into the Won stage and records todays date and your name against it.
        </p>
        <Textarea
          label="Notes"
          placeholder="Optional — anything worth recording about the sale..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}
