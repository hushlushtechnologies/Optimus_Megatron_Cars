"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
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
import { useMotion } from "@/src/hooks/use-motion";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { SearchSelect } from "@/src/components/test-drives/form/search-select";
import {
  searchSalesFilterCustomersAction,
  searchSalesFilterVehiclesAction,
} from "@/app/admin/sales/filter-actions";
import {
  EMPTY_SALES_FILTERS,
  UNASSIGNED_OWNER,
  countActiveSalesFilters,
  salesFiltersKey,
  type SalesFilterCustomerOption,
  type SalesFilterVehicleOption,
  type SalesListFilters,
} from "@/src/lib/utils/sales-list-filters";
import { SALES_DEAL_STATUSES, type SalesDealStatus } from "@/src/lib/types/sales";
import type { SalesFilterLookups } from "@/src/lib/supabase/sales-filter-lookups";
import { cn } from "@/src/lib/utils/cn";

interface SalesFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SalesListFilters;
  onApply: (filters: SalesListFilters) => void;
  lookups: SalesFilterLookups;
}

const BALANCE_OPTIONS = [
  { value: "outstanding", label: "Balance outstanding" },
  { value: "settled", label: "Paid in full" },
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
      <summary className="focus-visible:outline-primary flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
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
export function SalesFilterDrawer(props: SalesFilterDrawerProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {props.isOpen && <SalesFilterDrawerContent key="sales-filters" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}

function SalesFilterDrawerContent({ onClose, filters, onApply, lookups }: SalesFilterDrawerProps) {
  const { reduce, transition } = useMotion();
  const [draft, setDraft] = useState<SalesListFilters>(filters);
  const [draftCustomer, setDraftCustomer] = useState<SalesFilterCustomerOption | null>(
    filters.customer && lookups.customer?.id === filters.customer ? lookups.customer : null,
  );
  const [draftVehicle, setDraftVehicle] = useState<SalesFilterVehicleOption | null>(
    filters.vehicle && lookups.vehicle?.id === filters.vehicle ? lookups.vehicle : null,
  );
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const dirty = salesFiltersKey(draft) !== salesFiltersKey(filters);
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
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const patch = (change: Partial<SalesListFilters>) => setDraft((prev) => ({ ...prev, ...change }));

  const toggleStatus = (status: SalesDealStatus) =>
    setDraft((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((item) => item !== status)
        : SALES_DEAL_STATUSES.filter((item) => item === status || prev.status.includes(item)),
    }));

  const selectedCount = countActiveSalesFilters(draft);
  const appliedCount = countActiveSalesFilters(filters);
  const invalidDates = Boolean(draft.from && draft.to && draft.from > draft.to);

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
        transition={transition(0.2)}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
        transition={transition(0.28)}
        className="border-border bg-card relative z-10 flex h-dvh w-full max-w-[460px] flex-col overflow-hidden border-l shadow-2xl"
      >
        <div className="bg-gradient-primary h-1 shrink-0" />
        <header className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div>
            <div className="text-primary mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" /> Sales workspace
            </div>
            <h2 id={titleId} className="text-text-primary text-xl font-semibold tracking-tight">
              Filter deals
            </h2>
            <p className="text-text-muted mt-1 text-xs">Narrow the list without losing your place.</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close deal filters"
            className="border-border text-text-muted hover:border-primary/40 hover:bg-card-hover hover:text-text-primary flex size-11 shrink-0 items-center justify-center rounded-md border transition-colors sm:size-9"
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
            title="Status & payment"
            icon={<SlidersHorizontal className="size-4" aria-hidden="true" />}
            count={draft.status.length + (draft.balance ? 1 : 0)}
            defaultOpen
          >
            <div role="group" aria-label="Choose statuses" className="flex flex-wrap gap-2">
              {SALES_DEAL_STATUSES.map((status) => {
                const selected = draft.status.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      "focus-visible:outline-primary inline-flex min-h-11 items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-2 sm:min-h-9",
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
              label="Payment"
              placeholder="Any"
              options={BALANCE_OPTIONS}
              value={draft.balance ?? ""}
              onChange={(e) =>
                patch({
                  balance:
                    e.target.value === "outstanding" || e.target.value === "settled" ? e.target.value : null,
                })
              }
            />
          </Section>

          <Section
            title="Where & who"
            icon={<MapPin className="size-4" aria-hidden="true" />}
            count={[draft.showroom, draft.owner].filter(Boolean).length}
          >
            <Select
              label="Showroom"
              placeholder="Any showroom"
              options={lookups.showrooms.map((s) => ({ value: s.id, label: s.name }))}
              value={draft.showroom ?? ""}
              onChange={(e) => patch({ showroom: e.target.value || null })}
            />
            <Select
              label="Owner"
              placeholder="Anyone"
              options={[
                { value: UNASSIGNED_OWNER, label: "Unassigned" },
                ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
              ]}
              value={draft.owner ?? ""}
              onChange={(e) => patch({ owner: e.target.value || null })}
            />
          </Section>

          <Section
            title="Created date"
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
            title="Vehicle & customer"
            icon={<Car className="size-4" aria-hidden="true" />}
            count={[draft.brand, draft.vehicle, draft.customer].filter(Boolean).length}
          >
            <Select
              label="Brand"
              placeholder="Any brand"
              options={lookups.brands.map((b) => ({ value: b.id, label: b.name }))}
              value={draft.brand ?? ""}
              onChange={(e) => patch({ brand: e.target.value || null })}
            />
            <SearchSelect<SalesFilterVehicleOption>
              label="Specific vehicle"
              placeholder="Search by name or stock ID…"
              value={draftVehicle}
              onChange={(vehicle) => {
                setDraftVehicle(vehicle);
                patch({ vehicle: vehicle?.id ?? null });
              }}
              search={searchSalesFilterVehiclesAction}
              renderOption={(vehicle) => (
                <PickerRow
                  title={vehicle.display_title}
                  detail={`${vehicle.stock_id}${vehicle.brand_name ? ` · ${vehicle.brand_name}` : ""}`}
                />
              )}
              renderSelected={(vehicle) => (
                <PickerRow title={vehicle.display_title} detail={vehicle.stock_id} />
              )}
              emptyMessage="No vehicles found. Check the name or stock ID."
            />
            <SearchSelect<SalesFilterCustomerOption>
              label="Specific customer"
              placeholder="Search by name, customer ID or phone…"
              value={draftCustomer}
              onChange={(customer) => {
                setDraftCustomer(customer);
                patch({ customer: customer?.id ?? null });
              }}
              search={searchSalesFilterCustomersAction}
              renderOption={(customer) => (
                <PickerRow title={customer.full_name} detail={customer.customer_number} />
              )}
              renderSelected={(customer) => (
                <PickerRow title={customer.full_name} detail={customer.customer_number} />
              )}
              emptyMessage="No customers found."
            />
          </Section>
        </div>

        <footer className="border-border bg-card shrink-0 border-t px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setDraft(EMPTY_SALES_FILTERS);
                setDraftCustomer(null);
                setDraftVehicle(null);
              }}
              disabled={selectedCount === 0}
              className="text-text-muted hover:text-primary inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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

function PickerRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-w-0">
      <p className="text-text-primary truncate font-medium">{title}</p>
      <p className="text-caption text-text-subtle truncate">{detail}</p>
    </div>
  );
}
