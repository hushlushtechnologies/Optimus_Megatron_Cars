"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { SortControl } from "@/src/components/shared/sort-control";
import { FilterBar } from "@/src/components/shared/filter-bar";
import { TestDriveFilterDrawer } from "@/src/components/test-drives/test-drive-filter-drawer";
import { DEFAULT_TEST_DRIVE_SORT, parseTestDriveListParams } from "@/src/lib/utils/test-drive-list-params";
import {
  EMPTY_TEST_DRIVE_FILTERS,
  UNASSIGNED_STAFF,
  countActiveTestDriveFilters,
  writeTestDriveFiltersToParams,
  type TestDriveListFilters,
} from "@/src/lib/utils/test-drive-list-filters";
import type { TestDriveFilterLookups } from "@/src/lib/supabase/test-drive-filter-lookups";
import type { TestDriveStatus } from "@/src/lib/types/test-drive";
import { cn } from "@/src/lib/utils/cn";

const SORT_OPTIONS = [
  { value: "upcoming", label: "Upcoming first" },
  { value: "newest", label: "Newest created" },
  { value: "oldest", label: "Oldest created" },
  { value: "recently-updated", label: "Recently updated" },
  { value: "date-asc", label: "Date: earliest first" },
  { value: "date-desc", label: "Date: latest first" },
];

interface FilterChip {
  key: string;
  label: string;
}

interface TestDriveToolbarProps {
  resultCount: number;
  lookups: TestDriveFilterLookups;
  lookupsFailed: boolean;
}

function nameOf(list: { id: string; name: string }[], id: string): string | null {
  return list.find((item) => item.id === id)?.name ?? null;
}

function buildChips(filters: TestDriveListFilters, lookups: TestDriveFilterLookups): FilterChip[] {
  const chips: FilterChip[] = [];

  filters.status.forEach((status) => chips.push({ key: `status:${status}`, label: `Status: ${status}` }));

  if (filters.showroom) {
    chips.push({
      key: "showroom",
      label: `Showroom: ${nameOf(lookups.showrooms, filters.showroom) ?? "Selected"}`,
    });
  }
  if (filters.staff) {
    chips.push({
      key: "staff",
      label: `Staff: ${
        filters.staff === UNASSIGNED_STAFF
          ? "Unassigned"
          : (nameOf(lookups.staff, filters.staff) ?? "Selected")
      }`,
    });
  }
  if (filters.from || filters.to) {
    const label =
      filters.from && filters.to
        ? `Date: ${filters.from} to ${filters.to}`
        : filters.from
          ? `Date: from ${filters.from}`
          : `Date: until ${filters.to}`;
    chips.push({ key: "dates", label });
  }
  if (filters.brand) {
    chips.push({ key: "brand", label: `Brand: ${nameOf(lookups.brands, filters.brand) ?? "Selected"}` });
  }
  if (filters.model) {
    chips.push({ key: "model", label: `Model: ${nameOf(lookups.models, filters.model) ?? "Selected"}` });
  }
  if (filters.vehicle) {
    chips.push({
      key: "vehicle",
      label: `Vehicle: ${
        lookups.vehicle?.id === filters.vehicle
          ? `${lookups.vehicle.display_title} (${lookups.vehicle.stock_id})`
          : "Selected"
      }`,
    });
  }
  if (filters.source) {
    chips.push({ key: "source", label: `Source: ${nameOf(lookups.sources, filters.source) ?? "Selected"}` });
  }
  if (filters.lead) {
    chips.push({ key: "lead", label: filters.lead === "linked" ? "Lead: Linked" : "Lead: Not linked" });
  }
  if (filters.checkedIn) {
    chips.push({
      key: "checkedIn",
      label: filters.checkedIn === "yes" ? "Checked in" : "Not checked in",
    });
  }

  return chips;
}

export function TestDriveToolbar({ resultCount, lookups, lookupsFailed }: TestDriveToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Parsed once per URL change, so the drawer isn't handed a new object every render.
  const parsed = useMemo(
    () => parseTestDriveListParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const { filters, sort, search: urlQuery } = parsed;
  const activeCount = countActiveTestDriveFilters(filters);
  const isArchivedView = parsed.archived;
  const chips = useMemo(() => buildChips(filters, lookups), [filters, lookups]);

  const [searchValue, setSearchValue] = useState(urlQuery);

  const navigate = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router],
  );

  /* ---------- Search ---------- */

  // Searches we sent that the URL hasn't caught up with yet. If the URL shows
  // anything else, it was changed from outside (Clear filters, Back button),
  // so the box follows it.
  const pendingQueries = useRef<string[]>([]);

  useEffect(() => {
    const index = pendingQueries.current.indexOf(urlQuery);
    if (index >= 0) {
      pendingQueries.current = pendingQueries.current.slice(index + 1);
      return;
    }
    pendingQueries.current = [];
    setSearchValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const next = searchValue.trim().slice(0, 100);
    const current = (new URLSearchParams(window.location.search).get("q") ?? "").trim();
    // Nothing to send: this is what keeps the first render from resetting page 1.
    if (next === current) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (next) params.set("q", next);
      else params.delete("q");
      params.set("page", "1");
      pendingQueries.current.push(next);
      navigate(params);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchValue, navigate]);

  /* ---------- Sort and filters ---------- */

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_TEST_DRIVE_SORT) params.delete("sort");
    else params.set("sort", value);
    params.set("page", "1");
    navigate(params);
  };

  const applyFilters = (next: TestDriveListFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    writeTestDriveFiltersToParams(params, next);
    params.set("page", "1");
    navigate(params);
  };

  const removeFilter = (key: string) => {
    const next: TestDriveListFilters = { ...filters };

    if (key.startsWith("status:")) {
      const status = key.slice("status:".length) as TestDriveStatus;
      next.status = filters.status.filter((item) => item !== status);
    } else if (key === "dates") {
      next.from = null;
      next.to = null;
    } else if (key === "brand") {
      // A model only makes sense under its brand.
      next.brand = null;
      next.model = null;
    } else if (key in next) {
      (next as unknown as Record<string, unknown>)[key] = null;
    }

    applyFilters(next);
  };

  const clearAllFilters = () => applyFilters(EMPTY_TEST_DRIVE_FILTERS);

  const toggleArchivedView = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isArchivedView) params.delete("archived");
    else params.set("archived", "true");
    params.set("page", "1");
    navigate(params);
  };

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3 transition-opacity duration-200",
          isPending && "opacity-75",
        )}
      >
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1 lg:max-w-[430px] xl:max-w-[500px]">
            <Input
              aria-label="Search test drives"
              placeholder="Search ID, customer, phone, vehicle or stock ID..."
              leftIcon={<Search className="text-text-subtle size-4" aria-hidden="true" />}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-10 rounded-lg text-[12px]"
            />
          </div>

          <div className="scrollbar-hidden flex min-w-0 items-center gap-2 max-sm:overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="size-3.5" aria-hidden="true" />}
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "h-10 shrink-0 rounded-lg px-3 text-[11px] font-medium",
                activeCount > 0 && ["border-primary/30", "text-primary"],
              )}
            >
              Filters
              {activeCount > 0 && (
                <span className="bg-primary/10 text-primary ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums">
                  {activeCount}
                </span>
              )}
            </Button>

            <SortControl options={SORT_OPTIONS} value={sort} onChange={updateSort} />
          </div>

          <div className="flex min-w-0 items-center gap-2 lg:ml-auto">
            <div className="flex shrink-0 items-center gap-2" role="status" aria-live="polite">
              <span
                aria-hidden="true"
                className="bg-success size-1.5 rounded-full shadow-[0_0_8px_rgba(50,183,105,0.4)]"
              />
              <span className="text-text-subtle text-[10px] whitespace-nowrap">
                <strong className="text-text-primary font-semibold tabular-nums">
                  {resultCount.toLocaleString()}
                </strong>{" "}
                {resultCount === 1 ? "test drive" : "test drives"}
              </span>
            </div>
          </div>
        </div>

        {lookupsFailed && (
          <p
            role="status"
            className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
            Some filter options couldn&apos;t be loaded, so those lists may be incomplete. Search and sorting
            still work. Refresh the page to try again.
          </p>
        )}

        {chips.length > 0 && (
          <div className="border-border/70 border-t pt-3">
            <FilterBar activeFilters={chips} onRemoveFilter={removeFilter} onClearAll={clearAllFilters}>
              {null}
            </FilterBar>
          </div>
        )}
      </div>

      <TestDriveFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={applyFilters}
        lookups={lookups}
      />
    </>
  );
}
