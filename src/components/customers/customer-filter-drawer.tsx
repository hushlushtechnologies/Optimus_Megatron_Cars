"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Check } from "lucide-react";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import type { CustomerFilters } from "@/src/lib/utils/customer-filters";
import type { CustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

interface CustomerFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CustomerFilters;
  selectedTagIds: string[];
  onApply: (filters: CustomerFilters, tagIds: string[]) => void;
  lookups: CustomerFilterLookups;
}

const LIFECYCLE_OPTIONS = ["Prospect", "Active", "VIP", "Inactive", "Do Not Contact"].map((v) => ({
  value: v,
  label: v,
}));
const ACCOUNT_OPTIONS = ["No Account", "Pending Setup", "Active", "Disabled"].map((v) => ({
  value: v,
  label: v,
}));

export function CustomerFilterDrawer({
  isOpen,
  onClose,
  filters,
  selectedTagIds,
  onApply,
  lookups,
}: CustomerFilterDrawerProps) {
  const [draft, setDraft] = useState<CustomerFilters>(filters);
  const [draftTags, setDraftTags] = useState<string[]>(selectedTagIds);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen, onClose);

  // Intentional: reloads the draft filter + tag state from the parent's
  // props every time the drawer opens, so reopening always starts from
  // whatever is currently applied rather than the drawer's last edited state.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(filters);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftTags(selectedTagIds);
    }
  }, [isOpen, filters, selectedTagIds]);

  const set = <K extends keyof CustomerFilters>(key: K, value: CustomerFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const toggleTag = (tagId: string) => {
    setDraftTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filter customers"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="surface-card-elevated relative z-10 flex h-full w-full max-w-sm flex-col"
          >
            <div className="border-border flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-h3">Filters</h2>
              <IconButton aria-label="Close filters" variant="ghost" size="sm" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-5">
                <Select
                  label="Customer Status"
                  placeholder="Any status"
                  options={LIFECYCLE_OPTIONS}
                  value={draft.status ?? ""}
                  onChange={(e) => set("status", e.target.value)}
                />
                <Select
                  label="Account Status"
                  placeholder="Any account status"
                  options={ACCOUNT_OPTIONS}
                  value={draft.accountStatus ?? ""}
                  onChange={(e) => set("accountStatus", e.target.value)}
                />
                <Select
                  label="Source"
                  placeholder="Any source"
                  options={lookups.sources.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  value={draft.source ?? ""}
                  onChange={(e) => set("source", e.target.value)}
                />
                <Select
                  label="Location"
                  placeholder="Any location"
                  options={lookups.locations.map((l) => ({
                    value: l.id,
                    label: l.name,
                  }))}
                  value={draft.location ?? ""}
                  onChange={(e) => set("location", e.target.value)}
                />
                <Select
                  label="Primary Relationship Manager"
                  placeholder="Anyone"
                  options={lookups.staff.map((s) => ({
                    value: s.id,
                    label: s.full_name,
                  }))}
                  value={draft.prm ?? ""}
                  onChange={(e) => set("prm", e.target.value)}
                />

                <div>
                  <p className="text-label mb-2">Joined Date</p>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Joined from"
                      type="date"
                      value={draft.joinedFrom ?? ""}
                      onChange={(e) => set("joinedFrom", e.target.value)}
                    />
                    <span className="text-text-subtle">–</span>
                    <Input
                      aria-label="Joined to"
                      type="date"
                      value={draft.joinedTo ?? ""}
                      onChange={(e) => set("joinedTo", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-label mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {lookups.tags.map((tag) => {
                      const isSelected = draftTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors"
                          style={{
                            backgroundColor: isSelected ? `${tag.color_hex}1A` : "transparent",
                            borderColor: isSelected ? `${tag.color_hex}66` : "var(--omc-border)",
                            color: isSelected ? tag.color_hex : "var(--omc-text-muted)",
                          }}
                        >
                          {isSelected && <Check className="size-3" aria-hidden="true" />}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-border flex flex-col gap-4 border-t pt-4">
                  <Switch
                    label="Has Active Deals"
                    checked={!!draft.hasActiveDeals}
                    onCheckedChange={(checked) => set("hasActiveDeals", checked || undefined)}
                  />
                  <Switch
                    label="Has Purchased Vehicles"
                    checked={!!draft.hasPurchased}
                    onCheckedChange={(checked) => set("hasPurchased", checked || undefined)}
                  />
                </div>
              </div>
            </div>

            <div className="border-border flex items-center justify-between gap-3 border-t px-5 py-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft({});
                  setDraftTags([]);
                }}
              >
                Clear All
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onApply(draft, draftTags);
                    onClose();
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
