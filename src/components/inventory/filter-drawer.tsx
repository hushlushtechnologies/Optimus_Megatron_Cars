"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, RotateCcw, SlidersHorizontal, X, AlertCircle, Search } from "lucide-react";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { Button } from "@/src/components/ui/button";
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

type FilterKey = keyof InventoryFilters;
type SectionId = "essentials" | "vehicle" | "pricing" | "features";
type RangeKey = "year" | "price" | "mileage";

const LABELS: Partial<Record<FilterKey, string>> = {
  brand: "Brand",
  model: "Model",
  location: "Location",
  collection: "Collection",
  status: "Status",
  bodyType: "Body type",
  fuelType: "Fuel type",
  transmission: "Transmission",
  driveType: "Drive type",
  promotion: "Promotion",
  yearMin: "Min year",
  yearMax: "Max year",
  priceMin: "Min price",
  priceMax: "Max price",
  mileageMin: "Min mileage",
  mileageMax: "Max mileage",
  warranty: "Warranty",
  tradeIn: "Trade-in",
};

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "" && value !== false;
}
function activeEntries(filters: InventoryFilters): Array<[FilterKey, InventoryFilters[FilterKey]]> {
  return (Object.entries(filters) as Array<[FilterKey, InventoryFilters[FilterKey]]>).filter(([, value]) =>
    hasValue(value),
  );
}
function sameFilters(a: InventoryFilters, b: InventoryFilters): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as FilterKey[]);
  return [...keys].every(
    (key) => (hasValue(a[key]) ? a[key] : undefined) === (hasValue(b[key]) ? b[key] : undefined),
  );
}

function Section({
  id,
  title,
  subtitle,
  count,
  expanded,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const regionId = `inventory-filter-${id}`;
  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={regionId}
        onClick={onToggle}
        className="hover:bg-card-hover focus-visible:outline-primary flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors"
      >
        <span className="min-w-0">
          <span className="text-text-primary flex items-center gap-2 text-sm font-semibold">
            {title}
            {count > 0 && (
              <span className="bg-primary/15 text-primary rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                {count}
              </span>
            )}
          </span>
          <span className="text-text-muted mt-0.5 block text-xs">{subtitle}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`text-text-muted size-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div id={regionId} className="border-border grid gap-4 border-t px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}

export function FilterDrawer({ isOpen, onClose, filters, onApply, lookups }: FilterDrawerProps) {
  const [draft, setDraft] = useState<InventoryFilters>(filters);
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    essentials: true,
    vehicle: false,
    pricing: true,
    features: false,
  });
  const [showDiscard, setShowDiscard] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const previousOpen = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const dirty = !sameFilters(draft, filters);
  const appliedCount = activeEntries(filters).length;
  const draftEntries = activeEntries(draft);
  const draftCount = draftEntries.length;

  // Only reset on the CLOSED -> OPEN transition. Parent updates must not erase in-progress edits.
  useEffect(() => {
    if (isOpen && !previousOpen.current) {
      setDraft({ ...filters });
      setShowDiscard(false);
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    if (!isOpen && previousOpen.current) {
      returnFocusRef.current?.focus();
    }
    previousOpen.current = isOpen;
  }, [isOpen, filters]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Existing focus-trap hook manages Escape and focus containment.
  useFocusTrap(panelRef, isOpen, () => {
    if (dirty) setShowDiscard(true);
    else onClose();
  });

  const modelOptions = useMemo(
    () => lookups.models.filter((model) => !draft.brand || model.brand_id === draft.brand),
    [lookups.models, draft.brand],
  );

  function set<K extends FilterKey>(key: K, value: InventoryFilters[K]) {
    setDraft((previous) => ({ ...previous, [key]: hasValue(value) ? value : undefined }));
  }
  function changeBrand(brand: string) {
    setDraft((previous) => ({ ...previous, brand: brand || undefined, model: undefined }));
  }
  function remove(key: FilterKey) {
    setDraft((previous) =>
      key === "brand"
        ? { ...previous, brand: undefined, model: undefined }
        : { ...previous, [key]: undefined },
    );
  }
  function closeRequested() {
    if (dirty) setShowDiscard(true);
    else onClose();
  }
  function reset() {
    setDraft({});
    setShowDiscard(false);
  }

  const ranges: Array<{ name: RangeKey; label: string; unit: string; min: FilterKey; max: FilterKey }> = [
    { name: "year", label: "Manufacturing year", unit: "Year", min: "yearMin", max: "yearMax" },
    { name: "price", label: "Selling price", unit: "AED", min: "priceMin", max: "priceMax" },
    { name: "mileage", label: "Mileage", unit: "km", min: "mileageMin", max: "mileageMax" },
  ];
  const currentYear = new Date().getFullYear();
  const errors: Partial<Record<RangeKey, string>> = {};
  for (const range of ranges) {
    const min = draft[range.min] as number | undefined;
    const max = draft[range.max] as number | undefined;
    if (
      (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max < 0))
    ) {
      errors[range.name] = "Enter a valid non-negative number.";
    } else if (min !== undefined && max !== undefined && min > max) {
      errors[range.name] = "Minimum cannot exceed maximum.";
    } else if (
      range.name === "year" &&
      ((min !== undefined && (min < 1886 || min > currentYear + 2)) ||
        (max !== undefined && (max < 1886 || max > currentYear + 2)))
    ) {
      errors.year = `Enter a year between 1886 and ${currentYear + 2}.`;
    }
  }
  const hasErrors = Object.values(errors).some(Boolean);

  function lookupLabel(key: FilterKey, value: unknown): string {
    const groups: Partial<Record<FilterKey, Array<{ id: string; name: string }>>> = {
      brand: lookups.brands,
      model: lookups.models,
      location: lookups.locations,
      collection: lookups.collections,
      status: lookups.availabilityStatuses,
      bodyType: lookups.bodyTypes,
      fuelType: lookups.fuelTypes,
      transmission: lookups.transmissionTypes,
      driveType: lookups.driveTypes,
      promotion: lookups.promotions,
    };
    if (value === true) return "Yes";
    return groups[key]?.find((item) => item.id === value)?.name ?? String(value);
  }
  function selection(
    key: FilterKey,
    label: string,
    values: Array<{ id: string; name: string }>,
    placeholder: string,
    disabled = false,
  ) {
    return (
      <Select
        label={label}
        placeholder={placeholder}
        options={values.map((v) => ({ value: v.id, label: v.name }))}
        value={String(draft[key] ?? "")}
        onChange={(event) =>
          key === "brand"
            ? changeBrand(event.target.value)
            : set(key, event.target.value as InventoryFilters[typeof key])
        }
        disabled={disabled}
      />
    );
  }
  function rangeInputs(range: (typeof ranges)[number]) {
    const min = draft[range.min] as number | undefined;
    const max = draft[range.max] as number | undefined;
    return (
      <div key={range.name} className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-primary text-xs font-semibold">{range.label}</span>
          <span className="text-text-subtle text-[11px]">{range.unit}</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <Input
            aria-label={`Minimum ${range.label}`}
            aria-invalid={!!errors[range.name]}
            type="number"
            min={range.name === "year" ? 1886 : 0}
            max={range.name === "year" ? currentYear + 2 : undefined}
            step="1"
            inputMode="numeric"
            placeholder="Min"
            value={min ?? ""}
            onChange={(event) =>
              set(
                range.min,
                (event.target.value === ""
                  ? undefined
                  : Number(event.target.value)) as InventoryFilters[typeof range.min],
              )
            }
          />
          <span aria-hidden="true" className="text-text-subtle">
            —
          </span>
          <Input
            aria-label={`Maximum ${range.label}`}
            aria-invalid={!!errors[range.name]}
            type="number"
            min={range.name === "year" ? 1886 : 0}
            max={range.name === "year" ? currentYear + 2 : undefined}
            step="1"
            inputMode="numeric"
            placeholder="Max"
            value={max ?? ""}
            onChange={(event) =>
              set(
                range.max,
                (event.target.value === ""
                  ? undefined
                  : Number(event.target.value)) as InventoryFilters[typeof range.max],
              )
            }
          />
        </div>
        {errors[range.name] && (
          <p role="alert" className="text-danger flex items-center gap-1.5 text-xs">
            <AlertCircle className="size-3.5" />
            {errors[range.name]}
          </p>
        )}
      </div>
    );
  }
  function apply() {
    if (hasErrors) {
      setExpanded((prev) => ({ ...prev, pricing: true }));
      return;
    }
    onApply(draft);
    onClose();
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <motion.div
            aria-hidden="true"
            onClick={closeRequested}
            className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ x: reducedMotion ? 0 : "100%", opacity: reducedMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reducedMotion ? 0 : "100%", opacity: reducedMotion ? 0 : 1 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="border-border bg-base relative z-10 flex h-[100dvh] w-full max-w-[460px] flex-col border-l shadow-2xl"
          >
            <div className="bg-gradient-primary h-1 shrink-0" />
            <header className="border-border bg-card shrink-0 border-b px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="border-primary/20 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border">
                    <SlidersHorizontal className="size-5" />
                  </span>
                  <div>
                    <h2 id={titleId} className="text-text-primary text-lg font-semibold">
                      Filter inventory
                    </h2>
                    <p className="text-text-muted mt-0.5 text-xs">Refine the vehicles you want to see</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeRequested}
                  aria-label="Close filter drawer"
                  className="text-text-muted hover:bg-card-hover hover:text-text-primary rounded-lg p-2 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-text-muted text-xs">
                  <strong className="text-primary font-semibold">{draftCount}</strong> selected ·{" "}
                  {appliedCount} applied
                </span>
                {dirty && (
                  <span className="border-warning/25 bg-warning/10 text-warning inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
                    <span className="bg-warning size-1.5 rounded-full" />
                    Unapplied changes
                  </span>
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 scrollbar-none space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              {draftCount > 0 && (
                <div className="border-primary/20 bg-primary/5 rounded-xl border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-text-primary text-xs font-semibold">Selected filters</span>
                    <button
                      type="button"
                      onClick={reset}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {draftEntries.map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => remove(key)}
                        aria-label={`Remove ${LABELS[key] ?? key} filter`}
                        className="border-border bg-card text-text-primary hover:border-danger/40 hover:text-danger inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors"
                      >
                        <span className="max-w-[220px] truncate">
                          <span className="text-text-muted">{LABELS[key] ?? key}: </span>
                          {lookupLabel(key, value)}
                        </span>
                        <X aria-hidden="true" className="size-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Section
                id="essentials"
                title="Quick filters"
                subtitle="Brand, model, status and location"
                count={
                  ["brand", "model", "status", "location"].filter((key) => hasValue(draft[key as FilterKey]))
                    .length
                }
                expanded={expanded.essentials}
                onToggle={() => setExpanded((s) => ({ ...s, essentials: !s.essentials }))}
              >
                {selection("brand", "Brand", lookups.brands, "All brands")}
                {selection(
                  "model",
                  "Model",
                  modelOptions,
                  draft.brand ? "All models" : "Choose a brand first",
                  !draft.brand,
                )}
                {selection("status", "Availability status", lookups.availabilityStatuses, "All statuses")}
                {selection("location", "Location", lookups.locations, "All locations")}
              </Section>

              <Section
                id="pricing"
                title="Price, year & mileage"
                subtitle="Set minimum and maximum values"
                count={
                  ["yearMin", "yearMax", "priceMin", "priceMax", "mileageMin", "mileageMax"].filter((key) =>
                    hasValue(draft[key as FilterKey]),
                  ).length
                }
                expanded={expanded.pricing}
                onToggle={() => setExpanded((s) => ({ ...s, pricing: !s.pricing }))}
              >
                {ranges.map(rangeInputs)}
              </Section>

              <Section
                id="vehicle"
                title="Vehicle specifications"
                subtitle="Body, engine and drivetrain"
                count={
                  ["bodyType", "fuelType", "transmission", "driveType"].filter((key) =>
                    hasValue(draft[key as FilterKey]),
                  ).length
                }
                expanded={expanded.vehicle}
                onToggle={() => setExpanded((s) => ({ ...s, vehicle: !s.vehicle }))}
              >
                {selection("bodyType", "Body type", lookups.bodyTypes, "All body types")}
                {selection("fuelType", "Fuel type", lookups.fuelTypes, "All fuel types")}
                {selection("transmission", "Transmission", lookups.transmissionTypes, "All transmissions")}
                {selection("driveType", "Drive type", lookups.driveTypes, "All drive types")}
              </Section>

              <Section
                id="features"
                title="Collections & extras"
                subtitle="Promotions, warranty and trade-in"
                count={
                  ["collection", "promotion", "warranty", "tradeIn"].filter((key) =>
                    hasValue(draft[key as FilterKey]),
                  ).length
                }
                expanded={expanded.features}
                onToggle={() => setExpanded((s) => ({ ...s, features: !s.features }))}
              >
                {selection("collection", "Collection", lookups.collections, "All collections")}
                {selection("promotion", "Promotion", lookups.promotions, "All promotions")}
                <div className="border-border bg-card-hover/40 space-y-4 rounded-lg border p-3">
                  <Switch
                    label="Warranty available"
                    checked={!!draft.warranty}
                    onCheckedChange={(checked) => set("warranty", checked || undefined)}
                  />
                  <div className="border-border border-t" />
                  <Switch
                    label="Trade-in available"
                    checked={!!draft.tradeIn}
                    onCheckedChange={(checked) => set("tradeIn", checked || undefined)}
                  />
                </div>
              </Section>
            </div>

            <footer className="border-border bg-card shrink-0 border-t px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
              {hasErrors && (
                <p role="alert" className="text-danger mb-2 flex items-center gap-2 text-xs">
                  <AlertCircle className="size-4" />
                  Correct the highlighted ranges before applying.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  className="shrink-0"
                  disabled={draftCount === 0}
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={apply}
                  disabled={hasErrors}
                  className="min-w-0 flex-1 justify-center"
                >
                  <Search className="mr-2 size-4" />
                  Apply filters{draftCount > 0 ? ` (${draftCount})` : ""}
                </Button>
              </div>
            </footer>

            {showDiscard && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby={`${titleId}-discard`}
                  aria-describedby={`${titleId}-discard-desc`}
                  className="border-border bg-card w-full max-w-sm rounded-xl border p-5 shadow-2xl"
                >
                  <div className="bg-warning/10 text-warning mb-3 flex size-10 items-center justify-center rounded-lg">
                    <AlertCircle className="size-5" />
                  </div>
                  <h3 id={`${titleId}-discard`} className="text-text-primary text-base font-semibold">
                    Discard changes?
                  </h3>
                  <p id={`${titleId}-discard-desc`} className="text-text-muted mt-2 text-sm">
                    Your filter edits havent been applied. Closing will keep your previously applied filters.
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowDiscard(false)}>
                      Keep editing
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowDiscard(false);
                        onClose();
                      }}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
