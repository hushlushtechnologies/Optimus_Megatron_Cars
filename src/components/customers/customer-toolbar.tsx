"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { SortControl } from "@/src/components/shared/sort-control";
import { FilterBar } from "@/src/components/shared/filter-bar";
import { CustomerFilterDrawer } from "@/src/components/customers/customer-filter-drawer";
import {
  parseCustomerFilters,
  countActiveCustomerFilters,
  parseTagIds,
  type CustomerFilters,
} from "@/src/lib/utils/customer-filters";
import type { CustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";
import { cn } from "@/src/lib/utils/cn";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Customer" },
  { value: "oldest", label: "Oldest Customer" },
  { value: "recently-active", label: "Recently Active" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

type FilterValue = string | boolean;

const FILTER_LABEL_MAP: Record<
  keyof CustomerFilters,
  (value: FilterValue, lookups: CustomerFilterLookups) => string
> = {
  status: (v) => `Status: ${v}`,
  accountStatus: (v) => `Account: ${v}`,
  source: (v, l) => `Source: ${l.sources.find((s) => s.id === v)?.name ?? v}`,
  location: (v, l) => `Location: ${l.locations.find((x) => x.id === v)?.name ?? v}`,
  prm: (v, l) => `Manager: ${l.staff.find((s) => s.id === v)?.full_name ?? v}`,
  joinedFrom: (v) => `Joined after ${v}`,
  joinedTo: (v) => `Joined before ${v}`,
  tags: () => "",
  hasActiveDeals: () => "Has Active Deals",
  hasPurchased: () => "Has Purchased Vehicles",
};

interface CustomerToolbarProps {
  resultCount: number;
  filterLookups: CustomerFilterLookups;
}

interface FilterChip {
  key: string;
  label: string;
}

export function CustomerToolbar({ resultCount, filterLookups }: CustomerToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  const sort = searchParams.get("sort") ?? "newest";
  const filters = parseCustomerFilters(Object.fromEntries(searchParams.entries()));
  const selectedTagIds = parseTagIds(filters);
  const activeFilterCount = countActiveCustomerFilters(filters);

  // Plain filter chips — `key` is widened to `string` right here, inside the
  // map callback, not just on the outer variable. That's what actually lets
  // these concat cleanly with the tag chips below: the narrow keyof-union
  // type was being captured at the point of construction, before the outer
  // `activeChips` annotation ever got a chance to apply.
  const plainChips: FilterChip[] = (Object.keys(filters) as (keyof CustomerFilters)[])
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

  const applyFilters = (next: CustomerFilters, tagIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    (Object.keys(FILTER_LABEL_MAP) as (keyof CustomerFilters)[]).forEach((key) => params.delete(key));
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    if (tagIds.length > 0) params.set("tags", tagIds.join(","));
    else params.delete("tags");
    params.set("page", "1");
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
    (Object.keys(FILTER_LABEL_MAP) as (keyof CustomerFilters)[]).forEach((key) => params.delete(key));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input
            aria-label="Search customers"
            placeholder="Search by name, ID, email, phone..."
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
        <SortControl options={SORT_OPTIONS} value={sort} onChange={updateSort} />
        <span className={cn("text-body-sm text-text-muted", isPending && "opacity-50")}>
          {resultCount} {resultCount === 1 ? "customer" : "customers"}
        </span>
      </div>

      {activeChips.length > 0 && (
        <FilterBar activeFilters={activeChips} onRemoveFilter={removeFilter} onClearAll={clearAllFilters}>
          {null}
        </FilterBar>
      )}

      <CustomerFilterDrawer
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
