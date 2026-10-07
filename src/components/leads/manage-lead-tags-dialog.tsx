"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";
import { LeadTagPill } from "@/src/components/leads/lead-tag-pill";
import { syncLeadTags } from "@/app/admin/leads/[id]/tags-actions";
import type { LeadTag } from "@/src/lib/types/lead";

interface ManageLeadTagsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  allTags: LeadTag[];
  currentTagIds: string[];
  onSaved: (newTags: LeadTag[]) => void;
}

export function ManageLeadTagsDialog({
  isOpen,
  onClose,
  leadId,
  allTags,
  currentTagIds,
  onSaved,
}: ManageLeadTagsDialogProps) {
  const [draftIds, setDraftIds] = useState<string[]>(currentTagIds);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (tagId: string) => {
    setDraftIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleClose = () => {
    // Reset unsaved changes when closing.
    setDraftIds(currentTagIds);
    onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);

    const result = await syncLeadTags(leadId, currentTagIds, draftIds);

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const newTags = allTags.filter((tag) => draftIds.includes(tag.id));

    toast.success("Tags updated");

    onSaved(newTags);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Tags"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {allTags.length === 0 ? (
          <p className="text-body-sm text-text-muted">No tags have been created yet.</p>
        ) : (
          allTags.map((tag) => (
            <LeadTagPill
              key={tag.id}
              tag={tag}
              selected={draftIds.includes(tag.id)}
              onClick={() => toggle(tag.id)}
            />
          ))
        )}
      </div>
    </Modal>
  );
}
