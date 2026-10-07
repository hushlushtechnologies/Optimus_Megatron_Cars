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
import type { LeadFilters } from "@/src/lib/utils/lead-filters";
import type { LeadFilterLookups } from "@/src/lib/supabase/lead-lookups";

interface LeadFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: LeadFilters;
  selectedTagIds: string[];
  onApply: (filters: LeadFilters, tagIds: string[]) => void;
  lookups: LeadFilterLookups;
}

const FOLLOW_UP_OPTIONS = [
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "none", label: "No Follow-Up Scheduled" },
];

export function LeadFilterDrawer({
  isOpen,
  onClose,
  filters,
  selectedTagIds,
  onApply,
  lookups,
}: LeadFilterDrawerProps) {
  const [draft, setDraft] = useState<LeadFilters>(filters);
  const [draftTags, setDraftTags] = useState<string[]>(selectedTagIds);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen, onClose);

  // Intentional: reloads draft state from props every time the drawer opens.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(filters);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftTags(selectedTagIds);
    }
  }, [isOpen, filters, selectedTagIds]);

  const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => {
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
            aria-label="Filter leads"
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
                  label="Stage"
                  placeholder="Any stage"
                  options={lookups.stages.map((s) => ({ value: s.id, label: s.name }))}
                  value={draft.stage ?? ""}
                  onChange={(e) => set("stage", e.target.value)}
                />
                <Select
                  label="Assigned Staff"
                  placeholder="Anyone"
                  options={lookups.staff.map((s) => ({ value: s.id, label: s.full_name }))}
                  value={draft.assignedStaff ?? ""}
                  onChange={(e) => set("assignedStaff", e.target.value)}
                />
                <Select
                  label="Source"
                  placeholder="Any source"
                  options={lookups.sources.map((s) => ({ value: s.id, label: s.name }))}
                  value={draft.source ?? ""}
                  onChange={(e) => set("source", e.target.value)}
                />
                <Select
                  label="Temperature"
                  placeholder="Any temperature"
                  options={lookups.temperatures}
                  value={draft.temperature ?? ""}
                  onChange={(e) => set("temperature", e.target.value)}
                />
                <Select
                  label="Brand"
                  placeholder="Any brand"
                  options={lookups.brands.map((b) => ({ value: b.id, label: b.name }))}
                  value={draft.brand ?? ""}
                  onChange={(e) => set("brand", e.target.value)}
                />
                <Select
                  label="Location"
                  placeholder="Any location"
                  options={lookups.locations.map((l) => ({ value: l.id, label: l.name }))}
                  value={draft.location ?? ""}
                  onChange={(e) => set("location", e.target.value)}
                />
                <Select
                  label="Follow-Up Status"
                  placeholder="Any"
                  options={FOLLOW_UP_OPTIONS}
                  value={draft.followUpStatus ?? ""}
                  onChange={(e) => set("followUpStatus", e.target.value as LeadFilters["followUpStatus"])}
                />
                <Select
                  label="Lost Reason"
                  placeholder="Any reason"
                  options={lookups.lostReasons.map((r) => ({ value: r.id, label: r.name }))}
                  value={draft.lostReason ?? ""}
                  onChange={(e) => set("lostReason", e.target.value)}
                />

                <div>
                  <p className="text-label mb-2">Created Date</p>
                  <div className="xs:flex-row xs:items-center flex flex-col gap-2">
                    <Input
                      aria-label="Created from"
                      type="date"
                      value={draft.createdFrom ?? ""}
                      onChange={(e) => set("createdFrom", e.target.value)}
                    />
                    <span className="text-text-subtle xs:inline hidden">–</span>
                    <Input
                      aria-label="Created to"
                      type="date"
                      value={draft.createdTo ?? ""}
                      onChange={(e) => set("createdTo", e.target.value)}
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
