"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Archive } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { SortControl } from "@/src/components/shared/sort-control";
import { FilterBar } from "@/src/components/shared/filter-bar";
import { LeadFilterDrawer } from "@/src/components/leads/lead-filter-drawer";
import { ExportMenu } from "@/src/components/shared/export-menu";
import { triggerDownloadFromUrl } from "@/src/lib/utils/trigger-download";
import {
  parseLeadFilters,
  countActiveLeadFilters,
  parseLeadTagIds,
  type LeadFilters,
} from "@/src/lib/utils/lead-filters";
import type { LeadFilterLookups } from "@/src/lib/supabase/lead-lookups";
import { cn } from "@/src/lib/utils/cn";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "recently-updated", label: "Recently Updated" },
  { value: "next-follow-up", label: "Next Follow-Up" },
  { value: "hot-leads", label: "Hot Leads First" },
  { value: "customer-name", label: "Customer Name" },
];

type FilterValue = string;

const FILTER_LABEL_MAP: Record<
  keyof LeadFilters,
  (value: FilterValue, lookups: LeadFilterLookups) => string
> = {
  stage: (v, l) => `Stage: ${l.stages.find((s) => s.id === v)?.name ?? v}`,
  assignedStaff: (v, l) => `Staff: ${l.staff.find((s) => s.id === v)?.full_name ?? v}`,
  source: (v, l) => `Source: ${l.sources.find((s) => s.id === v)?.name ?? v}`,
  temperature: (v) => `Temperature: ${v}`,
  tags: () => "",
  brand: (v, l) => `Brand: ${l.brands.find((b) => b.id === v)?.name ?? v}`,
  vehicle: () => `Vehicle filter`,
  location: (v, l) => `Location: ${l.locations.find((x) => x.id === v)?.name ?? v}`,
  followUpStatus: (v) => `Follow-Up: ${v}`,
  createdFrom: (v) => `Created after ${v}`,
  createdTo: (v) => `Created before ${v}`,
  lostReason: (v, l) => `Lost Reason: ${l.lostReasons.find((r) => r.id === v)?.name ?? v}`,
};

interface FilterChip {
  key: string;
  label: string;
}

interface LeadToolbarProps {
  resultCount: number;
  filterLookups: LeadFilterLookups;
}

export function LeadToolbar({ resultCount, filterLookups }: LeadToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  const isArchivedView = searchParams.get("archived") === "true";
  const sort = searchParams.get("sort") ?? "newest";
  const filters = parseLeadFilters(Object.fromEntries(searchParams.entries()));
  const selectedTagIds = parseLeadTagIds(filters);
  const activeFilterCount = countActiveLeadFilters(filters);

  const plainChips: FilterChip[] = (Object.keys(filters) as (keyof LeadFilters)[])
    .filter((key) => key !== "tags")
    .map((key) => ({
      key: key as string,
      label: FILTER_LABEL_MAP[key](filters[key] as FilterValue, filterLookups),
    }));

  const tagChips: FilterChip[] = selectedTagIds.map((tagId) => ({
    key: `tag:${tagId}`,
    label: `Tag: ${filterLookups.tags.find((t) => t.id === tagId)?.name ?? tagId}`,
  }));

  const activeChips: FilterChip[] = [...plainChips, ...tagChips];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) params.set("q", searchValue);
      else params.delete("q");
      params.set("page", "1");
      startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const handleExport = async (format: "pdf" | "excel") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("pageSize");
    params.set("format", format);
    params.set("scope", "current");

    const result = await triggerDownloadFromUrl(`/admin/leads/export?${params.toString()}`);
    if (result.error) throw new Error(result.error);
  };

  const applyFilters = (next: LeadFilters, tagIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    (Object.keys(FILTER_LABEL_MAP) as (keyof LeadFilters)[]).forEach((key) => params.delete(key));
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    if (tagIds.length > 0) params.set("tags", tagIds.join(","));
    else params.delete("tags");
    params.set("page", "1");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const toggleArchivedView = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isArchivedView) params.delete("archived");
    else params.set("archived", "true");
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key.startsWith("tag:")) {
      const tagId = key.slice(4);
      const remaining = selectedTagIds.filter((id) => id !== tagId);
      if (remaining.length > 0) params.set("tags", remaining.join(","));
      else params.delete("tags");
    } else {
      params.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    (Object.keys(FILTER_LABEL_MAP) as (keyof LeadFilters)[]).forEach((key) => params.delete(key));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input
            aria-label="Search leads"
            placeholder="Search by lead ID, customer, phone, vehicle..."
            leftIcon={<Search className="size-4" />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? "outline" : "secondary"}
          leftIcon={<Filter className="size-4" />}
          onClick={() => setIsFilterOpen(true)}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
        <Button
          variant={isArchivedView ? "outline" : "ghost"}
          size="sm"
          leftIcon={<Archive className="size-4" />}
          onClick={toggleArchivedView}
        >
          {isArchivedView ? "Viewing Archived" : "Archived"}
        </Button>
        <ExportMenu onExportPDF={() => handleExport("pdf")} onExportExcel={() => handleExport("excel")} />
        <SortControl options={SORT_OPTIONS} value={sort} onChange={updateSort} />
        <span className={cn("text-body-sm text-text-muted", isPending && "opacity-50")}>
          {resultCount} {resultCount === 1 ? "lead" : "leads"}
        </span>
      </div>

      {activeChips.length > 0 && (
        <FilterBar activeFilters={activeChips} onRemoveFilter={removeFilter} onClearAll={clearAllFilters}>
          {null}
        </FilterBar>
      )}

      <LeadFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        selectedTagIds={selectedTagIds}
        onApply={applyFilters}
        lookups={filterLookups}
      />
    </div>
  );
}
