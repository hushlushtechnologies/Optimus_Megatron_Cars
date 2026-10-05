"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { Search, Filter, Archive, RotateCcw } from "lucide-react";

import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";

import { SortControl } from "@/src/components/shared/sort-control";
import { FilterBar } from "@/src/components/shared/filter-bar";

import { CustomerFilterDrawer } from "@/src/components/customers/customer-filter-drawer";
import { ExportMenu } from "@/src/components/shared/export-menu";
import { triggerDownloadFromUrl } from "@/src/lib/utils/trigger-download";

import {
  parseCustomerFilters,
  countActiveCustomerFilters,
  parseTagIds,
  type CustomerFilters,
} from "@/src/lib/utils/customer-filters";

import type { CustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

import { cn } from "@/src/lib/utils/cn";

/* =========================================================
   SORT OPTIONS
========================================================= */

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest Customer",
  },
  {
    value: "oldest",
    label: "Oldest Customer",
  },
  {
    value: "recently-active",
    label: "Recently Active",
  },
  {
    value: "name-asc",
    label: "Name A–Z",
  },
  {
    value: "name-desc",
    label: "Name Z–A",
  },
];

/* =========================================================
   FILTER LABELS
========================================================= */

type FilterValue = string | boolean;

const FILTER_LABEL_MAP: Record<
  keyof CustomerFilters,
  (value: FilterValue, lookups: CustomerFilterLookups) => string
> = {
  status: (value) => `Status: ${value}`,

  accountStatus: (value) => `Account: ${value}`,

  source: (value, lookups) =>
    `Source: ${lookups.sources.find((source) => source.id === value)?.name ?? value}`,

  location: (value, lookups) =>
    `Location: ${lookups.locations.find((location) => location.id === value)?.name ?? value}`,

  prm: (value, lookups) =>
    `Manager: ${lookups.staff.find((staff) => staff.id === value)?.full_name ?? value}`,

  joinedFrom: (value) => `Joined after ${value}`,

  joinedTo: (value) => `Joined before ${value}`,

  tags: () => "",

  hasActiveDeals: () => "Has Active Deals",

  hasPurchased: () => "Has Purchased Vehicles",
};

/* =========================================================
   TYPES
========================================================= */

interface CustomerToolbarProps {
  resultCount: number;
  filterLookups: CustomerFilterLookups;
}

interface FilterChip {
  key: string;
  label: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export function CustomerToolbar({ resultCount, filterLookups }: CustomerToolbarProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  /* =========================================================
     URL STATE
  ========================================================= */

  const sort = searchParams.get("sort") ?? "newest";

  /*
   * Phase 14:
   * archived=true means we are viewing
   * archived customers.
   */
  const isArchivedView = searchParams.get("archived") === "true";

  const filters = parseCustomerFilters(Object.fromEntries(searchParams.entries()));

  const selectedTagIds = parseTagIds(filters);

  const activeFilterCount = countActiveCustomerFilters(filters);

  /* =========================================================
     ACTIVE FILTER CHIPS
  ========================================================= */

  const plainChips: FilterChip[] = (Object.keys(filters) as (keyof CustomerFilters)[])
    .filter((key) => key !== "tags")
    .map((key) => ({
      key: key as string,

      label: FILTER_LABEL_MAP[key](filters[key] as FilterValue, filterLookups),
    }));

  const tagChips: FilterChip[] = selectedTagIds.map((tagId) => ({
    key: `tag:${tagId}`,

    label: `Tag: ${filterLookups.tags.find((tag) => tag.id === tagId)?.name ?? tagId}`,
  }));

  const activeChips: FilterChip[] = [...plainChips, ...tagChips];

  /* =========================================================
     SEARCH
  ========================================================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchValue) {
        params.set("q", searchValue);
      } else {
        params.delete("q");
      }

      /*
       * Always reset pagination when
       * the search changes.
       */
      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 350);

    return () => clearTimeout(timeout);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  /* =========================================================
     SORT
  ========================================================= */

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("sort", value);

    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  /* =========================================================
     ARCHIVED VIEW
  ========================================================= */

  const toggleArchivedView = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (isArchivedView) {
      /*
       * Returning to the normal
       * customer list.
       *
       * No archived param means:
       * archived = false.
       */
      params.delete("archived");
    } else {
      /*
       * Switch to archived customers.
       */
      params.set("archived", "true");
    }

    /*
     * Always return to page 1
     * when changing views.
     */
    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  /* =========================================================
     APPLY FILTERS
  ========================================================= */

  const applyFilters = (next: CustomerFilters, tagIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    (Object.keys(FILTER_LABEL_MAP) as (keyof CustomerFilters)[]).forEach((key) => params.delete(key));

    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });

    if (tagIds.length > 0) {
      params.set("tags", tagIds.join(","));
    } else {
      params.delete("tags");
    }

    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleExport = async (format: "pdf" | "excel") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("pageSize");
    params.set("format", format);
    params.set("scope", "current");

    const result = await triggerDownloadFromUrl(`/admin/customers/export?${params.toString()}`);
    if (result.error) throw new Error(result.error);
  };

  /* =========================================================
     REMOVE FILTER
  ========================================================= */

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key.startsWith("tag:")) {
      const tagId = key.slice(4);

      const remaining = selectedTagIds.filter((id) => id !== tagId);

      if (remaining.length > 0) {
        params.set("tags", remaining.join(","));
      } else {
        params.delete("tags");
      }
    } else {
      params.delete(key);
    }

    /*
     * Reset pagination after
     * removing a filter.
     */
    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    (Object.keys(FILTER_LABEL_MAP) as (keyof CustomerFilters)[]).forEach((key) => params.delete(key));

    /*
     * Important:
     * Do NOT delete "archived".
     *
     * Archived view is a view state,
     * not a customer filter.
     */

    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* SEARCH */}

        <div className="w-full max-w-xs">
          <Input
            aria-label="Search customers"
            placeholder="Search by name, ID, email, phone..."
            leftIcon={<Search className="size-4" />}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        {/* FILTERS */}

        <Button
          variant={activeFilterCount > 0 ? "outline" : "secondary"}
          leftIcon={<Filter className="size-4" />}
          onClick={() => setIsFilterOpen(true)}
        >
          Filters
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>

        {/* SORT */}

        <SortControl options={SORT_OPTIONS} value={sort} onChange={updateSort} />

        <ExportMenu onExportPDF={() => handleExport("pdf")} onExportExcel={() => handleExport("excel")} />

        {/* ARCHIVED VIEW TOGGLE */}

        <Button
          variant={isArchivedView ? "outline" : "secondary"}
          leftIcon={isArchivedView ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
          onClick={toggleArchivedView}
          disabled={isPending}
        >
          {isArchivedView ? "Active Customers" : "Archived"}
        </Button>

        {/* RESULT COUNT */}

        <span className={cn("text-body-sm text-text-muted", isPending && "opacity-50")}>
          {resultCount} {resultCount === 1 ? "customer" : "customers"}
        </span>
      </div>

      {/* ACTIVE FILTER CHIPS */}

      {activeChips.length > 0 && (
        <FilterBar activeFilters={activeChips} onRemoveFilter={removeFilter} onClearAll={clearAllFilters}>
          {null}
        </FilterBar>
      )}

      {/* FILTER DRAWER */}

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
