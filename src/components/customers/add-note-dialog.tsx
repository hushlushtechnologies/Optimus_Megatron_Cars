"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { createNote } from "@/app/admin/customers/[id]/notes-actions";

interface AddNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

export function AddNoteDialog({ isOpen, onClose, customerId }: AddNoteDialogProps) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    const result = await createNote(customerId, text, isInternal);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Note added");
    setText("");
    setIsInternal(true);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Note"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!text.trim()}>
            Add Note
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Textarea
          aria-label="Note"
          placeholder="e.g. Customer interested in Lamborghini Urus below AED 900,000."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
        />
        <Switch label="Internal Only" checked={isInternal} onCheckedChange={setIsInternal} />
      </div>
    </Modal>
  );
}
