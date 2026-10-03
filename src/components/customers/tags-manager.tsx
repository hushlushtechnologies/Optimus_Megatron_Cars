"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { CustomerTagPill } from "@/src/components/customers/customer-tag-pill";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { Button } from "@/src/components/ui/button";
import type { CustomerTag } from "@/src/lib/supabase/customer-lookups";

interface TagsManagerProps {
  customerId: string;
  assignedTags: CustomerTag[];
  availableTags: CustomerTag[];
  onAddTag: (customerId: string, tagId: string) => Promise<{ error: string | null }>;
  onRemoveTag: (customerId: string, tagId: string) => Promise<{ error: string | null }>;
}

export function TagsManager({
  customerId,
  assignedTags: initial,
  availableTags,
  onAddTag,
  onRemoveTag,
}: TagsManagerProps) {
  const [assignedTags, setAssignedTags] = useState(initial);

  const remainingTags = availableTags.filter((t) => !assignedTags.some((a) => a.id === t.id));

  const handleAdd = async (tag: CustomerTag) => {
    setAssignedTags((prev) => [...prev, tag]);
    const result = await onAddTag(customerId, tag.id);
    if (result.error) {
      toast.error(result.error);
      setAssignedTags((prev) => prev.filter((t) => t.id !== tag.id));
    }
  };

  const handleRemove = async (tagId: string) => {
    const removed = assignedTags.find((t) => t.id === tagId);
    setAssignedTags((prev) => prev.filter((t) => t.id !== tagId));
    const result = await onRemoveTag(customerId, tagId);
    if (result.error) {
      toast.error(result.error);
      if (removed) setAssignedTags((prev) => [...prev, removed]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assignedTags.map((tag) => (
        <CustomerTagPill key={tag.id} tag={tag} onRemove={() => handleRemove(tag.id)} />
      ))}

      {remainingTags.length > 0 && (
        <Dropdown>
          <DropdownTrigger>
            <Button variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />}>
              Add Tag
            </Button>
          </DropdownTrigger>
          <DropdownContent align="start" className="w-48 py-1">
            {remainingTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                role="menuitem"
                onClick={() => handleAdd(tag)}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2 px-4 py-2 text-left"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: tag.color_hex }}
                />
                {tag.name}
              </button>
            ))}
          </DropdownContent>
        </Dropdown>
      )}
    </div>
  );
}
