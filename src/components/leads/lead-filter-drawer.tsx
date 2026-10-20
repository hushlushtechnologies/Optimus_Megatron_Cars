"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { Button } from "@/src/components/ui/button";
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

const FILTER_FIELDS = [
  "stage",
  "assignedStaff",
  "source",
  "temperature",
  "brand",
  "location",
  "followUpStatus",
  "lostReason",
  "createdFrom",
  "createdTo",
] as const satisfies readonly (keyof LeadFilters)[];

type FilterKey = (typeof FILTER_FIELDS)[number];

function cleanFilters(value: LeadFilters): LeadFilters {
  const next = { ...value };
  for (const key of FILTER_FIELDS) {
    if (next[key] === "" || next[key] === null) delete next[key];
  }
  return next;
}

function sameTags(a: string[], b: string[]) {
  const sortedB = [...b].sort();
  return a.length === b.length && [...a].sort().every((id, i) => id === sortedB[i]);
}

function sameFilters(a: LeadFilters, b: LeadFilters) {
  return (
    JSON.stringify(Object.entries(cleanFilters(a)).sort(([a], [b]) => a.localeCompare(b))) ===
    JSON.stringify(Object.entries(cleanFilters(b)).sort(([a], [b]) => a.localeCompare(b)))
  );
}

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

export function LeadFilterDrawer(props: LeadFilterDrawerProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {props.isOpen && <LeadFilterDrawerContent key="lead-filters" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}

function LeadFilterDrawerContent({
  onClose,
  filters,
  selectedTagIds,
  onApply,
  lookups,
}: LeadFilterDrawerProps) {
  const [draft, setDraft] = useState<LeadFilters>(() => cleanFilters(filters));
  const [draftTags, setDraftTags] = useState<string[]>(selectedTagIds);
  const [tagSearch, setTagSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();

  const dirty = !sameFilters(draft, filters) || !sameTags(draftTags, selectedTagIds);
  const requestClose = useCallback(() => {
    if (dirty && !window.confirm("Discard your unapplied filter changes?")) return;
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

  const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value === "" || value === null ? undefined : value }));
  };
  const toggleTag = (id: string) =>
    setDraftTags((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  const selectedCount =
    FILTER_FIELDS.filter((key) => draft[key] !== undefined && draft[key] !== "").length + draftTags.length;
  const appliedCount =
    FILTER_FIELDS.filter((key) => filters[key] !== undefined && filters[key] !== "").length +
    selectedTagIds.length;
  const invalidDates = Boolean(draft.createdFrom && draft.createdTo && draft.createdFrom > draft.createdTo);

  const chips = useMemo(() => {
    const optionName = (items: { value: string; label: string }[], value: string) =>
      items.find((o) => o.value === value)?.label ?? value;
    const entries: { key: FilterKey; label: string; value: string }[] = [
      {
        key: "stage",
        label: "Stage",
        value: optionName(
          lookups.stages.map((v) => ({ value: v.id, label: v.name })),
          draft.stage ?? "",
        ),
      },
      {
        key: "assignedStaff",
        label: "Staff",
        value: optionName(
          lookups.staff.map((v) => ({ value: v.id, label: v.full_name })),
          draft.assignedStaff ?? "",
        ),
      },
      {
        key: "source",
        label: "Source",
        value: optionName(
          lookups.sources.map((v) => ({ value: v.id, label: v.name })),
          draft.source ?? "",
        ),
      },
      {
        key: "temperature",
        label: "Temperature",
        value: optionName(lookups.temperatures, draft.temperature ?? ""),
      },
      {
        key: "brand",
        label: "Brand",
        value: optionName(
          lookups.brands.map((v) => ({ value: v.id, label: v.name })),
          draft.brand ?? "",
        ),
      },
      {
        key: "location",
        label: "Location",
        value: optionName(
          lookups.locations.map((v) => ({ value: v.id, label: v.name })),
          draft.location ?? "",
        ),
      },
      {
        key: "followUpStatus",
        label: "Follow-up",
        value: optionName(FOLLOW_UP_OPTIONS, draft.followUpStatus ?? ""),
      },
      {
        key: "lostReason",
        label: "Lost reason",
        value: optionName(
          lookups.lostReasons.map((v) => ({ value: v.id, label: v.name })),
          draft.lostReason ?? "",
        ),
      },
      { key: "createdFrom", label: "From", value: draft.createdFrom ?? "" },
      { key: "createdTo", label: "To", value: draft.createdTo ?? "" },
    ];
    return entries.filter((entry) => draft[entry.key] !== undefined && draft[entry.key] !== "");
  }, [draft, lookups]);

  const visibleTags = lookups.tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.trim().toLowerCase()),
  );
  const apply = () => {
    if (invalidDates) return;
    onApply(cleanFilters(draft), draftTags);
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
              <SlidersHorizontal className="size-3.5" /> Sales workspace
            </div>
            <h2 id={titleId} className="text-text-primary text-xl font-semibold tracking-tight">
              Filter leads
            </h2>
            <p className="text-text-muted mt-1 text-xs">Refine your pipeline without losing your place.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Close lead filters"
            className="border-border text-text-muted hover:border-primary/40 hover:bg-card-hover hover:text-text-primary focus-visible:outline-primary flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-2"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 scrollbar-none space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <div className="border-border bg-base/60 flex items-center justify-between rounded-lg border px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <Filter className="text-primary size-4" />
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

          {selectedCount > 0 && (
            <div aria-label="Selected filters" className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => set(chip.key, undefined)}
                  aria-label={`Remove ${chip.label}: ${chip.value}`}
                  className="border-primary/25 bg-primary/5 text-text-primary hover:bg-primary/10 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                >
                  <span className="truncate">
                    <span className="text-text-muted">{chip.label}:</span> {chip.value}
                  </span>
                  <X className="text-primary size-3 shrink-0" />
                </button>
              ))}
              {draftTags.map((id) => {
                const tag = lookups.tags.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTag(id)}
                    aria-label={`Remove tag ${tag?.name ?? id}`}
                    className="border-border bg-card-hover text-text-primary hover:border-primary/40 inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs"
                  >
                    <Tag className="text-primary size-3" />
                    {tag?.name ?? id}
                    <X className="text-text-muted size-3" />
                  </button>
                );
              })}
            </div>
          )}

          <Section
            title="Pipeline & priority"
            icon={<SlidersHorizontal className="size-4" />}
            count={
              [draft.stage, draft.temperature, draft.followUpStatus, draft.lostReason].filter(Boolean).length
            }
            defaultOpen
          >
            <Select
              label="Stage"
              placeholder="Any stage"
              options={lookups.stages.map((s) => ({ value: s.id, label: s.name }))}
              value={draft.stage ?? ""}
              onChange={(e) => set("stage", e.target.value)}
            />
            <Select
              label="Temperature"
              placeholder="Any temperature"
              options={lookups.temperatures}
              value={draft.temperature ?? ""}
              onChange={(e) => set("temperature", e.target.value)}
            />
            <Select
              label="Follow-up status"
              placeholder="Any follow-up"
              options={FOLLOW_UP_OPTIONS}
              value={draft.followUpStatus ?? ""}
              onChange={(e) => set("followUpStatus", e.target.value as LeadFilters["followUpStatus"])}
            />
            <Select
              label="Lost reason"
              placeholder="Any reason"
              options={lookups.lostReasons.map((r) => ({ value: r.id, label: r.name }))}
              value={draft.lostReason ?? ""}
              onChange={(e) => set("lostReason", e.target.value)}
            />
            <p className="text-text-subtle text-xs leading-relaxed">
              Lost reason is useful when reviewing lost opportunities.
            </p>
          </Section>

          <Section
            title="Ownership & origin"
            icon={<UserRound className="size-4" />}
            count={[draft.assignedStaff, draft.source, draft.location, draft.brand].filter(Boolean).length}
          >
            <Select
              label="Assigned staff"
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
          </Section>

          <Section
            title="Created date"
            icon={<CalendarDays className="size-4" />}
            count={[draft.createdFrom, draft.createdTo].filter(Boolean).length}
          >
            <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
              <Input
                label="From"
                type="date"
                value={draft.createdFrom ?? ""}
                onChange={(e) => set("createdFrom", e.target.value)}
              />
              <Input
                label="To"
                type="date"
                value={draft.createdTo ?? ""}
                onChange={(e) => set("createdTo", e.target.value)}
              />
            </div>
            {invalidDates && (
              <p role="alert" className="text-danger text-xs font-medium">
                End date must be on or after the start date.
              </p>
            )}
          </Section>

          <Section title="Lead tags" icon={<Tag className="size-4" />} count={draftTags.length}>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <input
                aria-label="Search lead tags"
                type="search"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="border-border bg-base text-text-primary placeholder:text-text-subtle focus:border-primary focus:ring-primary h-10 w-full rounded-md border pr-3 pl-9 text-sm outline-none focus:ring-1"
              />
            </div>
            {lookups.tags.length === 0 ? (
              <p className="text-text-muted text-xs">No lead tags available.</p>
            ) : visibleTags.length === 0 ? (
              <p className="text-text-muted text-xs">No matching tags found.</p>
            ) : (
              <div
                role="group"
                aria-label="Choose lead tags"
                className="flex max-h-48 scrollbar-none flex-wrap content-start gap-2 overflow-y-auto"
              >
                {visibleTags.map((tag) => {
                  const selected = draftTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTag(tag.id)}
                      className={`focus-visible:outline-primary inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-2 ${selected ? "border-primary/50 bg-primary/10 text-text-primary" : "border-border bg-base text-text-muted hover:border-primary/30 hover:text-text-primary"}`}
                      style={{ "--omc-status-raw": tag.color_hex } as CSSProperties}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: tag.color_hex }}
                        aria-hidden="true"
                      />
                      {tag.name}
                      {selected && <Check aria-hidden="true" className="text-primary size-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-text-subtle text-xs">Select multiple tags to refine your leads.</p>
          </Section>
        </div>

        <footer className="border-border bg-card shrink-0 border-t px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setDraft({});
                setDraftTags([]);
              }}
              disabled={selectedCount === 0}
              className="text-text-muted hover:text-primary inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" /> Clear all
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
    </div>
  );
}
