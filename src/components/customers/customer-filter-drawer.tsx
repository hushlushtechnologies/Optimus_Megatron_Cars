"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/src/components/ui/switch";
import { CustomerTagPill } from "@/src/components/customers/customer-tag-pill";
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

type SectionKey = "profile" | "ownership" | "dates" | "tags";
const LIFECYCLE_OPTIONS = ["Prospect", "Active", "VIP", "Inactive", "Do Not Contact"].map((value) => ({
  value,
  label: value,
}));
const ACCOUNT_OPTIONS = ["No Account", "Pending Setup", "Active", "Disabled"].map((value) => ({
  value,
  label: value,
}));
const FILTER_KEYS = [
  "status",
  "accountStatus",
  "source",
  "location",
  "prm",
  "joinedFrom",
  "joinedTo",
  "hasActiveDeals",
  "hasPurchased",
] as const;
const LABELS: Record<(typeof FILTER_KEYS)[number], string> = {
  status: "Customer status",
  accountStatus: "Account status",
  source: "Source",
  location: "Location",
  prm: "Relationship manager",
  joinedFrom: "Joined from",
  joinedTo: "Joined to",
  hasActiveDeals: "Active deals",
  hasPurchased: "Purchased vehicles",
};

function cleanFilters(value: CustomerFilters): CustomerFilters {
  const result: CustomerFilters = {};
  for (const key of FILTER_KEYS) {
    const current = value[key];
    if (current !== undefined && current !== null && current !== "" && current !== false) {
      // CustomerFilters is a fixed collection of optional string and boolean fields.
      Object.assign(result, { [key]: current });
    }
  }
  return result;
}

function signature(filters: CustomerFilters, tags: string[]) {
  const normalized = cleanFilters(filters);
  return JSON.stringify({
    filters: FILTER_KEYS.map((key) => [key, normalized[key] ?? null]),
    tags: [...new Set(tags)].sort(),
  });
}

function Section({
  title,
  description,
  icon: Icon,
  count,
  open,
  onToggle,
  children,
  id,
}: {
  title: string;
  description: string;
  icon: typeof UserRound;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="hover:bg-card-hover focus-visible:outline-primary flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
      >
        <span className="border-primary/15 bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-text-primary flex items-center gap-2 text-sm font-semibold">
            {title}
            {count > 0 && (
              <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[11px] font-bold">
                {count}
              </span>
            )}
          </span>
          <span className="text-text-muted mt-0.5 block text-xs">{description}</span>
        </span>
        <ChevronDown
          className={`text-text-muted size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={id} className="border-border space-y-4 border-t px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}

export function CustomerFilterDrawer({
  isOpen,
  onClose,
  filters,
  selectedTagIds,
  onApply,
  lookups,
}: CustomerFilterDrawerProps) {
  const [draft, setDraft] = useState<CustomerFilters>(() => cleanFilters(filters));
  const [draftTags, setDraftTags] = useState<string[]>(selectedTagIds);
  const [tagSearch, setTagSearch] = useState("");
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    profile: true,
    ownership: true,
    dates: false,
    tags: true,
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const sectionPrefix = useId();
  const reduceMotion = useReducedMotion();
  useFocusTrap(panelRef, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    // Reset unsaved edits whenever the drawer opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(cleanFilters(filters));
    setDraftTags([...selectedTagIds]);
    setTagSearch("");
  }, [isOpen, filters, selectedTagIds]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  function set<K extends keyof CustomerFilters>(key: K, value: CustomerFilters[K]) {
    setDraft((previous) => cleanFilters({ ...previous, [key]: value }));
  }

  function toggleTag(tagId: string) {
    setDraftTags((previous) =>
      previous.includes(tagId) ? previous.filter((id) => id !== tagId) : [...previous, tagId],
    );
  }

  function toggleSection(key: SectionKey) {
    setSections((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  const tagNames = useMemo(() => new Map(lookups.tags.map((tag) => [tag.id, tag.name])), [lookups.tags]);
  const visibleTags = useMemo(
    () => lookups.tags.filter((tag) => tag.name.toLowerCase().includes(tagSearch.trim().toLowerCase())),
    [lookups.tags, tagSearch],
  );
  const count =
    FILTER_KEYS.filter(
      (key) => draft[key] !== undefined && draft[key] !== null && draft[key] !== "" && draft[key] !== false,
    ).length + draftTags.length;
  const appliedCount =
    FILTER_KEYS.filter(
      (key) =>
        filters[key] !== undefined && filters[key] !== null && filters[key] !== "" && filters[key] !== false,
    ).length + selectedTagIds.length;
  const changed = signature(draft, draftTags) !== signature(filters, selectedTagIds);
  const invalidDates = Boolean(draft.joinedFrom && draft.joinedTo && draft.joinedFrom > draft.joinedTo);
  const sectionCounts = {
    profile: [draft.status, draft.accountStatus, draft.source, draft.location, draft.prm].filter(Boolean)
      .length,
    ownership: Number(Boolean(draft.hasActiveDeals)) + Number(Boolean(draft.hasPurchased)),
    dates: Number(Boolean(draft.joinedFrom)) + Number(Boolean(draft.joinedTo)),
    tags: draftTags.length,
  };

  function clearAll() {
    setDraft({});
    setDraftTags([]);
    setTagSearch("");
  }

  function apply() {
    if (invalidDates) {
      setSections((previous) => ({ ...previous, dates: true }));
      return;
    }
    onApply(cleanFilters(draft), draftTags);
    onClose();
  }

  // Cancel and backdrop always discard draft edits; no accidental auto-apply.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="border-border bg-base relative z-10 flex h-dvh h-full w-full max-w-[460px] flex-col overflow-hidden border-l shadow-2xl"
          >
            <header className="border-border bg-card shrink-0 border-b px-5 pt-5 pb-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="border-primary/20 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl border">
                  <SlidersHorizontal className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 id={titleId} className="text-text-primary text-lg font-semibold tracking-tight">
                      Customer filters
                    </h2>
                    {appliedCount > 0 && (
                      <span className="border-primary/25 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                        {appliedCount} applied
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted mt-1 text-xs">Refine your customer directory</p>
                </div>
                <button
                  type="button"
                  aria-label="Close customer filters"
                  onClick={onClose}
                  className="text-text-muted hover:bg-card-hover hover:text-text-primary flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-text-muted flex items-center gap-2 text-xs">
                  <Filter className="text-primary size-3.5" aria-hidden="true" />
                  <span>
                    {count === 0
                      ? "No filters selected"
                      : `${count} ${count === 1 ? "filter" : "filters"} selected`}
                  </span>
                  {changed && <span className="bg-primary size-1.5 rounded-full" title="Unapplied changes" />}
                </div>
                <button
                  type="button"
                  disabled={count === 0}
                  onClick={clearAll}
                  className="text-text-muted hover:text-primary inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" /> Clear all
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 scrollbar-none space-y-3 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              {count > 0 && (
                <div className="border-primary/20 bg-primary/5 rounded-xl border p-3">
                  <p className="text-text-muted mb-2 text-[11px] font-semibold tracking-wider uppercase">
                    Selected filters
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_KEYS.filter((key) => Boolean(draft[key])).map((key) => {
                      const value = draft[key];
                      const label =
                        key === "source"
                          ? lookups.sources.find((item) => item.id === value)?.name
                          : key === "location"
                            ? lookups.locations.find((item) => item.id === value)?.name
                            : key === "prm"
                              ? lookups.staff.find((item) => item.id === value)?.full_name
                              : value === true
                                ? "Yes"
                                : String(value);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => set(key, undefined)}
                          aria-label={`Remove ${LABELS[key]} filter`}
                          className="border-border bg-card text-text-primary hover:border-primary/40 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors"
                        >
                          <span className="max-w-[220px] truncate">
                            {LABELS[key]}: {label ?? String(value)}
                          </span>
                          <X className="text-text-muted size-3 shrink-0" aria-hidden="true" />
                        </button>
                      );
                    })}
                    {draftTags.map((tagId) => (
                      <button
                        key={tagId}
                        type="button"
                        onClick={() => toggleTag(tagId)}
                        aria-label={`Remove tag ${tagNames.get(tagId) ?? tagId}`}
                        className="border-primary/25 bg-card text-text-primary hover:border-primary/50 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                      >
                        <Tag className="text-primary size-3 shrink-0" aria-hidden="true" />
                        <span className="max-w-[180px] truncate">
                          {tagNames.get(tagId) ?? "Selected tag"}
                        </span>
                        <X className="text-text-muted size-3 shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Section
                id={`${sectionPrefix}-profile`}
                title="Customer profile"
                description="Status, source, location and manager"
                icon={UserRound}
                count={sectionCounts.profile}
                open={sections.profile}
                onToggle={() => toggleSection("profile")}
              >
                <Select
                  label="Customer status"
                  placeholder="Any status"
                  options={LIFECYCLE_OPTIONS}
                  value={draft.status ?? ""}
                  onChange={(event) => set("status", event.target.value)}
                />
                <Select
                  label="Account status"
                  placeholder="Any account status"
                  options={ACCOUNT_OPTIONS}
                  value={draft.accountStatus ?? ""}
                  onChange={(event) => set("accountStatus", event.target.value)}
                />
                <Select
                  label="Source"
                  placeholder="Any source"
                  options={lookups.sources.map((item) => ({ value: item.id, label: item.name }))}
                  value={draft.source ?? ""}
                  onChange={(event) => set("source", event.target.value)}
                />
                <Select
                  label="Location"
                  placeholder="Any location"
                  options={lookups.locations.map((item) => ({ value: item.id, label: item.name }))}
                  value={draft.location ?? ""}
                  onChange={(event) => set("location", event.target.value)}
                />
                <Select
                  label="Primary relationship manager"
                  placeholder="Anyone"
                  options={lookups.staff.map((item) => ({ value: item.id, label: item.full_name }))}
                  value={draft.prm ?? ""}
                  onChange={(event) => set("prm", event.target.value)}
                />
              </Section>

              <Section
                id={`${sectionPrefix}-ownership`}
                title="Customer activity"
                description="Deals and vehicle purchase history"
                icon={Check}
                count={sectionCounts.ownership}
                open={sections.ownership}
                onToggle={() => toggleSection("ownership")}
              >
                <div className="flex flex-col gap-4">
                  <Switch
                    label="Has active deals"
                    checked={Boolean(draft.hasActiveDeals)}
                    onCheckedChange={(checked) => set("hasActiveDeals", checked ? true : undefined)}
                  />
                  <Switch
                    label="Has purchased vehicles"
                    checked={Boolean(draft.hasPurchased)}
                    onCheckedChange={(checked) => set("hasPurchased", checked ? true : undefined)}
                  />
                </div>
                <p className="text-text-subtle text-xs leading-relaxed">
                  Turn on either option to show customers matching that activity.
                </p>
              </Section>

              <Section
                id={`${sectionPrefix}-dates`}
                title="Joined date"
                description="Filter by customer registration period"
                icon={CalendarDays}
                count={sectionCounts.dates}
                open={sections.dates}
                onToggle={() => toggleSection("dates")}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="From"
                    type="date"
                    value={draft.joinedFrom ?? ""}
                    onChange={(event) => set("joinedFrom", event.target.value)}
                  />
                  <Input
                    label="To"
                    type="date"
                    value={draft.joinedTo ?? ""}
                    onChange={(event) => set("joinedTo", event.target.value)}
                  />
                </div>
                {invalidDates && (
                  <p role="alert" className="text-danger text-xs font-medium">
                    The end date must be on or after the start date.
                  </p>
                )}
              </Section>

              <Section
                id={`${sectionPrefix}-tags`}
                title="Customer tags"
                description="Find customers with selected tags"
                icon={Tag}
                count={sectionCounts.tags}
                open={sections.tags}
                onToggle={() => toggleSection("tags")}
              >
                {lookups.tags.length > 6 && (
                  <div className="relative">
                    <Search
                      className="text-text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      aria-label="Search customer tags"
                      placeholder="Search tags..."
                      value={tagSearch}
                      onChange={(event) => setTagSearch(event.target.value)}
                      className="border-border bg-base text-text-primary placeholder:text-text-subtle focus:border-primary h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none"
                    />
                  </div>
                )}
                {visibleTags.length > 0 ? (
                  <div className="flex max-h-52 scrollbar-none flex-wrap content-start gap-2 overflow-y-auto">
                    {visibleTags.map((tag) => (
                      <CustomerTagPill
                        key={tag.id}
                        tag={tag}
                        selected={draftTags.includes(tag.id)}
                        onClick={() => toggleTag(tag.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="border-border text-text-muted rounded-lg border border-dashed px-3 py-5 text-center text-xs">
                    {lookups.tags.length === 0 ? "No customer tags available" : "No matching tags"}
                  </p>
                )}
                {draftTags.length > 0 && (
                  <p className="text-text-muted text-xs">
                    {draftTags.length} {draftTags.length === 1 ? "tag" : "tags"} selected
                  </p>
                )}
              </Section>
            </div>

            <footer className="border-border bg-card shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              {invalidDates && (
                <p className="text-danger mb-2 text-xs" role="status">
                  Correct the joined date range to apply filters.
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} className="shrink-0">
                  Cancel
                </Button>
                <Button onClick={apply} disabled={invalidDates || !changed} className="min-w-0 flex-1">
                  Apply filters{count > 0 ? ` (${count})` : ""}
                </Button>
              </div>
              <p className="text-text-subtle mt-2 text-center text-[11px]">
                {changed ? "Changes apply only when you select Apply filters" : "All changes are applied"}
              </p>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
