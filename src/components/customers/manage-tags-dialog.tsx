"use client";

import { Modal } from "@/src/components/ui/modal";
import { TagsManager } from "@/src/components/customers/tags-manager";
import { addCustomerTag, removeCustomerTag } from "@/app/admin/customers/[id]/tags-actions";
import type { CustomerTag } from "@/src/lib/supabase/customer-lookups";

interface ManageTagsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  assignedTags: CustomerTag[];
  availableTags: CustomerTag[];
}

export function ManageTagsDialog({ isOpen, onClose, customerId, assignedTags, availableTags }: ManageTagsDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Tags" size="sm">
      <TagsManager
        customerId={customerId}
        assignedTags={assignedTags}
        availableTags={availableTags}
        onAddTag={addCustomerTag}
        onRemoveTag={removeCustomerTag}
      />
    </Modal>
  );
}