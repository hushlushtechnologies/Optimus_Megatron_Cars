"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import type { InventoryFilters } from "@/src/lib/utils/inventory-filters";
import type { FilterLookups } from "@/src/lib/supabase/inventory-queries";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: InventoryFilters;
  onApply: (filters: InventoryFilters) => void;
  lookups: FilterLookups;
}

export function FilterDrawer({ isOpen, onClose, filters, onApply, lookups }: FilterDrawerProps) {
  const [draft, setDraft] = useState<InventoryFilters>(filters);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen, onClose);

  // Intentional: reloads the draft filter state from the parent's `filters`
  // prop every time the drawer opens, so reopening always starts from
  // whatever is currently applied rather than the drawer's last edited state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const set = <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const modelOptions = lookups.models.filter((m) => !draft.brand || m.brand_id === draft.brand);

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
            aria-label="Filter inventory"
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
                  label="Brand"
                  placeholder="Any brand"
                  options={lookups.brands.map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                  value={draft.brand ?? ""}
                  onChange={(e) => set("brand", e.target.value)}
                />
                <Select
                  label="Model"
                  placeholder="Any model"
                  options={modelOptions.map((m) => ({
                    value: m.id,
                    label: m.name,
                  }))}
                  value={draft.model ?? ""}
                  onChange={(e) => set("model", e.target.value)}
                  disabled={!draft.brand}
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
                  label="Collection"
                  placeholder="Any collection"
                  options={lookups.collections.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={draft.collection ?? ""}
                  onChange={(e) => set("collection", e.target.value)}
                />
                <Select
                  label="Status"
                  placeholder="Any status"
                  options={lookups.availabilityStatuses.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  value={draft.status ?? ""}
                  onChange={(e) => set("status", e.target.value)}
                />
                <Select
                  label="Body Type"
                  placeholder="Any body type"
                  options={lookups.bodyTypes.map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                  value={draft.bodyType ?? ""}
                  onChange={(e) => set("bodyType", e.target.value)}
                />
                <Select
                  label="Fuel Type"
                  placeholder="Any fuel type"
                  options={lookups.fuelTypes.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                  value={draft.fuelType ?? ""}
                  onChange={(e) => set("fuelType", e.target.value)}
                />
                <Select
                  label="Transmission"
                  placeholder="Any transmission"
                  options={lookups.transmissionTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  value={draft.transmission ?? ""}
                  onChange={(e) => set("transmission", e.target.value)}
                />
                <Select
                  label="Drive Type"
                  placeholder="Any drive type"
                  options={lookups.driveTypes.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  value={draft.driveType ?? ""}
                  onChange={(e) => set("driveType", e.target.value)}
                />
                <Select
                  label="Promotion"
                  placeholder="Any promotion"
                  options={lookups.promotions.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={draft.promotion ?? ""}
                  onChange={(e) => set("promotion", e.target.value)}
                />

                <div>
                  <p className="text-label mb-2">Year</p>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Minimum year"
                      type="number"
                      placeholder="Min"
                      value={draft.yearMin ?? ""}
                      onChange={(e) => set("yearMin", e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-text-subtle">–</span>
                    <Input
                      aria-label="Maximum year"
                      type="number"
                      placeholder="Max"
                      value={draft.yearMax ?? ""}
                      onChange={(e) => set("yearMax", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-label mb-2">Price Range (AED)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Minimum price"
                      type="number"
                      placeholder="Min"
                      value={draft.priceMin ?? ""}
                      onChange={(e) => set("priceMin", e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-text-subtle">–</span>
                    <Input
                      aria-label="Maximum price"
                      type="number"
                      placeholder="Max"
                      value={draft.priceMax ?? ""}
                      onChange={(e) => set("priceMax", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-label mb-2">Mileage Range (km)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Minimum mileage"
                      type="number"
                      placeholder="Min"
                      value={draft.mileageMin ?? ""}
                      onChange={(e) => set("mileageMin", e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="text-text-subtle">–</span>
                    <Input
                      aria-label="Maximum mileage"
                      type="number"
                      placeholder="Max"
                      value={draft.mileageMax ?? ""}
                      onChange={(e) => set("mileageMax", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="border-border flex flex-col gap-4 border-t pt-4">
                  <Switch
                    label="Warranty Available"
                    checked={!!draft.warranty}
                    onCheckedChange={(checked) => set("warranty", checked || undefined)}
                  />
                  <Switch
                    label="Trade-In Available"
                    checked={!!draft.tradeIn}
                    onCheckedChange={(checked) => set("tradeIn", checked || undefined)}
                  />
                </div>
              </div>
            </div>

            <div className="border-border flex items-center justify-between gap-3 border-t px-5 py-4">
              <Button variant="ghost" onClick={() => setDraft({})}>
                Clear All
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onApply(draft);
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
