"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import {
  CalendarDays,
  Car,
  ChevronDown,
  Filter,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { SearchSelect } from "@/src/components/test-drives/form/search-select";
import { searchTestDriveFilterVehiclesAction } from "@/app/admin/test-drives/filter-actions";
import {
  EMPTY_TEST_DRIVE_FILTERS,
  TEST_DRIVE_STATUS_OPTIONS,
  UNASSIGNED_STAFF,
  countActiveTestDriveFilters,
  testDriveFiltersKey,
  type TestDriveFilterVehicleOption,
  type TestDriveListFilters,
} from "@/src/lib/utils/test-drive-list-filters";
import type { TestDriveFilterLookups } from "@/src/lib/supabase/test-drive-filter-lookups";
import { cn } from "@/src/lib/utils/cn";

interface TestDriveFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TestDriveListFilters;
  onApply: (filters: TestDriveListFilters) => void;
  lookups: TestDriveFilterLookups;
}

const LEAD_OPTIONS = [
  { value: "linked", label: "Linked to a lead" },
  { value: "none", label: "Not linked to a lead" },
];

const CHECK_IN_OPTIONS = [
  { value: "yes", label: "Checked in" },
  { value: "no", label: "Not checked in" },
];

function Section({
  title,
  icon,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group border-border bg-card/60 rounded-lg border"
      ref={(node) => {
        if (node && !node.dataset.initialized) {
          node.open = defaultOpen;
          node.dataset.initialized = "true";
        }
      }}
    >
      <summary className="focus-visible:outline-primary flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 marker:hidden focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        <span className="text-primary">{icon}</span>
        <span className="text-text-primary flex-1 text-sm font-semibold">{title}</span>
        {count > 0 && (
          <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-semibold">
            {count}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className="text-text-muted size-4 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="border-border space-y-4 border-t px-4 py-4">{children}</div>
    </details>
  );
}

// The content mounts only while the drawer is open, so the draft starts from the
// applied filters each time it opens and is never reset while it stays open.
export function TestDriveFilterDrawer(props: TestDriveFilterDrawerProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {props.isOpen && <TestDriveFilterDrawerContent key="test-drive-filters" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}

function TestDriveFilterDrawerContent({ onClose, filters, onApply, lookups }: TestDriveFilterDrawerProps) {
  const [draft, setDraft] = useState<TestDriveListFilters>(filters);
  const [draftVehicle, setDraftVehicle] = useState<TestDriveFilterVehicleOption | null>(
    filters.vehicle && lookups.vehicle?.id === filters.vehicle ? lookups.vehicle : null,
  );
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();

  const dirty = testDriveFiltersKey(draft) !== testDriveFiltersKey(filters);
  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);
  useFocusTrap(panelRef, true, requestClose);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, []);

  const patch = (change: Partial<TestDriveListFilters>) => setDraft((prev) => ({ ...prev, ...change }));

  const toggleStatus = (status: (typeof TEST_DRIVE_STATUS_OPTIONS)[number]) =>
    setDraft((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((item) => item !== status)
        : TEST_DRIVE_STATUS_OPTIONS.filter((item) => item === status || prev.status.includes(item)),
    }));

  const changeBrand = (brandId: string) => {
    const brand = brandId || null;
    const modelStillFits =
      !!draft.model && !!brand && lookups.models.some((m) => m.id === draft.model && m.brand_id === brand);
    patch({ brand, model: modelStillFits ? draft.model : null });
  };

  const selectedCount = countActiveTestDriveFilters(draft);
  const appliedCount = countActiveTestDriveFilters(filters);
  const invalidDates = Boolean(draft.from && draft.to && draft.from > draft.to);
  const modelOptions = draft.brand
    ? lookups.models.filter((m) => m.brand_id === draft.brand).map((m) => ({ value: m.id, label: m.name }))
    : [];

  const apply = () => {
    if (invalidDates) return;
    onApply(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
        onClick={requestClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="border-border bg-card relative z-10 flex h-dvh h-full w-full max-w-[460px] flex-col overflow-hidden border-l shadow-2xl"
      >
        <div className="bg-gradient-primary h-1 shrink-0" />
        <header className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div>
            <div className="text-primary mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] uppercase">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" /> Test drive workspace
            </div>
            <h2 id={titleId} className="text-text-primary text-xl font-semibold tracking-tight">
              Filter test drives
            </h2>
            <p className="text-text-muted mt-1 text-xs">Narrow the list without losing your place.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Close test drive filters"
            className="border-border text-text-muted hover:border-primary/40 hover:bg-card-hover hover:text-text-primary focus-visible:outline-primary flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-2"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 scrollbar-none space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <div className="border-border bg-base/60 flex items-center justify-between rounded-lg border px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <Filter className="text-primary size-4" aria-hidden="true" />
              <div>
                <p className="text-text-primary text-sm font-medium">Selected filters</p>
                <p className="text-text-muted text-xs">
                  {appliedCount} currently applied{dirty ? " · changes pending" : ""}
                </p>
              </div>
            </div>
            <span className="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums">
              {selectedCount}
            </span>
          </div>

          <Section
            title="Status & check-in"
            icon={<SlidersHorizontal className="size-4" aria-hidden="true" />}
            count={draft.status.length + (draft.checkedIn ? 1 : 0)}
            defaultOpen
          >
            <div role="group" aria-label="Choose statuses" className="flex flex-wrap gap-2">
              {TEST_DRIVE_STATUS_OPTIONS.map((status) => {
                const selected = draft.status.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      "focus-visible:outline-primary inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-2",
                      selected
                        ? "border-primary/50 bg-primary/10 text-text-primary"
                        : "border-border bg-base text-text-muted hover:border-primary/30 hover:text-text-primary",
                    )}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            <Select
              label="Check-in"
              placeholder="Any"
              options={CHECK_IN_OPTIONS}
              value={draft.checkedIn ?? ""}
              onChange={(e) =>
                patch({
                  checkedIn: e.target.value === "yes" || e.target.value === "no" ? e.target.value : null,
                })
              }
            />
          </Section>

          <Section
            title="Where & who"
            icon={<MapPin className="size-4" aria-hidden="true" />}
            count={[draft.showroom, draft.staff, draft.source, draft.lead].filter(Boolean).length}
          >
            <Select
              label="Showroom"
              placeholder="Any showroom"
              options={lookups.showrooms.map((s) => ({ value: s.id, label: s.name }))}
              value={draft.showroom ?? ""}
              onChange={(e) => patch({ showroom: e.target.value || null })}
            />
            <Select
              label="Host"
              placeholder="Anyone"
              options={[
                { value: UNASSIGNED_STAFF, label: "Unassigned" },
                ...lookups.staff.map((s) => ({ value: s.id, label: s.name })),
              ]}
              value={draft.staff ?? ""}
              onChange={(e) => patch({ staff: e.target.value || null })}
            />
            <Select
              label="Request source"
              placeholder="Any source"
              options={lookups.sources.map((s) => ({ value: s.id, label: s.name }))}
              value={draft.source ?? ""}
              onChange={(e) => patch({ source: e.target.value || null })}
            />
            <Select
              label="Related lead"
              placeholder="Any"
              options={LEAD_OPTIONS}
              value={draft.lead ?? ""}
              onChange={(e) =>
                patch({
                  lead: e.target.value === "linked" || e.target.value === "none" ? e.target.value : null,
                })
              }
            />
          </Section>

          <Section
            title="Test drive date"
            icon={<CalendarDays className="size-4" aria-hidden="true" />}
            count={draft.from || draft.to ? 1 : 0}
          >
            <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
              <Input
                label="From"
                type="date"
                value={draft.from ?? ""}
                onChange={(e) => patch({ from: e.target.value || null })}
              />
              <Input
                label="To"
                type="date"
                value={draft.to ?? ""}
                onChange={(e) => patch({ to: e.target.value || null })}
              />
            </div>
            <p className="text-text-subtle text-xs">Dates are Dubai time.</p>
            {invalidDates && (
              <p role="alert" className="text-danger text-xs font-medium">
                End date must be on or after the start date.
              </p>
            )}
          </Section>

          <Section
            title="Vehicle"
            icon={<Car className="size-4" aria-hidden="true" />}
            count={[draft.brand, draft.model, draft.vehicle].filter(Boolean).length}
          >
            <Select
              label="Brand"
              placeholder="Any brand"
              options={lookups.brands.map((b) => ({ value: b.id, label: b.name }))}
              value={draft.brand ?? ""}
              onChange={(e) => changeBrand(e.target.value)}
            />
            <Select
              label="Model"
              placeholder={draft.brand ? "Any model" : "Choose a brand first"}
              options={modelOptions}
              value={draft.model ?? ""}
              onChange={(e) => patch({ model: e.target.value || null })}
            />
            <SearchSelect<TestDriveFilterVehicleOption>
              label="Specific vehicle"
              placeholder="Search by name or stock ID…"
              value={draftVehicle}
              onChange={(vehicle) => {
                setDraftVehicle(vehicle);
                patch({ vehicle: vehicle?.id ?? null });
              }}
              search={searchTestDriveFilterVehiclesAction}
              renderOption={(vehicle) => <VehicleRow vehicle={vehicle} />}
              renderSelected={(vehicle) => <VehicleRow vehicle={vehicle} />}
              emptyMessage="No vehicles found. Check the name or stock ID."
            />
            {draft.vehicle && !draftVehicle && (
              <p className="text-text-muted text-xs">
                A vehicle filter is applied, but its name couldn&apos;t be loaded.{" "}
                <button
                  type="button"
                  onClick={() => patch({ vehicle: null })}
                  className="text-primary font-medium underline"
                >
                  Remove it
                </button>
              </p>
            )}
          </Section>
        </div>

        <footer className="border-border bg-card shrink-0 border-t px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setDraft(EMPTY_TEST_DRIVE_FILTERS);
                setDraftVehicle(null);
              }}
              disabled={selectedCount === 0}
              className="text-text-muted hover:text-primary inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> Clear all
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={requestClose}>
                Cancel
              </Button>
              <Button onClick={apply} disabled={invalidDates}>
                Apply{selectedCount ? ` (${selectedCount})` : " filters"}
              </Button>
            </div>
          </div>
          {invalidDates && (
            <p className="text-danger mt-2 text-xs">Correct the date range to apply these filters.</p>
          )}
        </footer>
      </motion.div>
      <ConfirmDialog
        isOpen={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onClose();
        }}
        title="Discard your changes?"
        description="You have filter changes that haven't been applied."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="danger"
      />
    </div>
  );
}

function VehicleRow({ vehicle }: { vehicle: TestDriveFilterVehicleOption }) {
  return (
    <div className="min-w-0">
      <p className="text-text-primary truncate font-medium">{vehicle.display_title}</p>
      <p className="text-caption text-text-subtle truncate">
        {vehicle.stock_id}
        {vehicle.brand_name ? ` · ${vehicle.brand_name}` : ""}
      </p>
    </div>
  );
}
