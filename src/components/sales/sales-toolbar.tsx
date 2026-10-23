"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { SortControl } from "@/src/components/shared/sort-control";
import { FilterBar } from "@/src/components/shared/filter-bar";
import { SalesFilterDrawer } from "@/src/components/sales/sales-filter-drawer";
import { SalesStatusTabs } from "@/src/components/sales/sales-status-tabs";
import { DEFAULT_SALES_SORT, parseSalesListParams } from "@/src/lib/utils/sales-list-params";
import {
  EMPTY_SALES_FILTERS,
  UNASSIGNED_OWNER,
  countActiveSalesFilters,
  writeSalesFiltersToParams,
  type SalesListFilters,
} from "@/src/lib/utils/sales-list-filters";
import type { SalesFilterLookups } from "@/src/lib/supabase/sales-filter-lookups";
import type { SalesDealStatus } from "@/src/lib/types/sales";
import { cn } from "@/src/lib/utils/cn";

const SORT_OPTIONS = [
  { value: "recently-updated", label: "Recently updated" },
  { value: "newest", label: "Newest created" },
  { value: "oldest", label: "Oldest created" },
  { value: "value-desc", label: "Price: high to low" },
  { value: "value-asc", label: "Price: low to high" },
  { value: "balance-desc", label: "Most outstanding" },
];

interface FilterChip {
  key: string;
  label: string;
}

function nameOf(list: { id: string; name: string }[], id: string): string | null {
  return list.find((item) => item.id === id)?.name ?? null;
}

function buildChips(filters: SalesListFilters, lookups: SalesFilterLookups): FilterChip[] {
  const chips: FilterChip[] = [];
  filters.status.forEach((status) => chips.push({ key: `status:${status}`, label: `Status: ${status}` }));
  if (filters.showroom)
    chips.push({
      key: "showroom",
      label: `Showroom: ${nameOf(lookups.showrooms, filters.showroom) ?? "Selected"}`,
    });
  if (filters.owner)
    chips.push({
      key: "owner",
      label: `Owner: ${filters.owner === UNASSIGNED_OWNER ? "Unassigned" : (nameOf(lookups.owners, filters.owner) ?? "Selected")}`,
    });
  if (filters.from || filters.to) {
    chips.push({
      key: "dates",
      label:
        filters.from && filters.to
          ? `Created: ${filters.from} to ${filters.to}`
          : filters.from
            ? `Created: from ${filters.from}`
            : `Created: until ${filters.to}`,
    });
  }
  if (filters.brand)
    chips.push({ key: "brand", label: `Brand: ${nameOf(lookups.brands, filters.brand) ?? "Selected"}` });
  if (filters.vehicle)
    chips.push({
      key: "vehicle",
      label: `Vehicle: ${lookups.vehicle?.id === filters.vehicle ? `${lookups.vehicle.display_title} (${lookups.vehicle.stock_id})` : "Selected"}`,
    });
  if (filters.customer)
    chips.push({
      key: "customer",
      label: `Customer: ${lookups.customer?.id === filters.customer ? lookups.customer.full_name : "Selected"}`,
    });
  if (filters.balance)
    chips.push({
      key: "balance",
      label: filters.balance === "outstanding" ? "Payment: Outstanding" : "Payment: Settled",
    });
  return chips;
}

interface SalesToolbarProps {
  resultCount: number;
  lookups: SalesFilterLookups;
  lookupsFailed: boolean;
}

export function SalesToolbar({ resultCount, lookups, lookupsFailed }: SalesToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const parsed = useMemo(
    () => parseSalesListParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const { filters, sort, search: urlQuery } = parsed;
  const activeCount = countActiveSalesFilters(filters);
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

  // Searches we sent that the URL hasn't caught up with yet. Anything else in the URL
  // came from outside (Clear filters, Back button), so the box follows it.
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
    if (next === current) return; // keeps the first render from resetting the page

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

  const applyFilters = (next: SalesListFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    writeSalesFiltersToParams(params, next);
    params.set("page", "1");
    navigate(params);
  };

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_SALES_SORT) params.delete("sort");
    else params.set("sort", value);
    params.set("page", "1");
    navigate(params);
  };

  const removeFilter = (key: string) => {
    const next: SalesListFilters = { ...filters };
    if (key.startsWith("status:")) {
      const status = key.slice("status:".length) as SalesDealStatus;
      next.status = filters.status.filter((item) => item !== status);
    } else if (key === "dates") {
      next.from = null;
      next.to = null;
    } else if (key in next) {
      (next as unknown as Record<string, unknown>)[key] = null;
    }
    applyFilters(next);
  };

  const selectStatusTab = (status: SalesDealStatus | null) =>
    applyFilters({ ...filters, status: status ? [status] : [] });

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3 transition-opacity duration-200",
          isPending && "opacity-75",
        )}
      >
        <SalesStatusTabs selected={filters.status} onSelect={selectStatusTab} />

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1 lg:max-w-[460px]">
            <Input
              aria-label="Search deals"
              placeholder="Search deal, customer, phone, vehicle or stock ID..."
              leftIcon={<Search className="text-text-subtle size-4" aria-hidden="true" />}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-11 rounded-lg text-base sm:h-10 sm:text-sm"
            />
          </div>

          <div className="scrollbar-hidden flex min-w-0 items-center gap-2 max-sm:overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="size-3.5" aria-hidden="true" />}
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "h-11 shrink-0 rounded-lg px-3 text-xs font-medium sm:h-10",
                activeCount > 0 && ["border-primary/30", "text-primary"],
              )}
            >
              Filters
              {activeCount > 0 && (
                <span className="bg-primary/10 text-primary ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                  {activeCount}
                </span>
              )}
            </Button>
            <SortControl options={SORT_OPTIONS} value={sort} onChange={updateSort} />
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:ml-auto" role="status" aria-live="polite">
            <span
              aria-hidden="true"
              className="bg-success size-1.5 rounded-full shadow-[0_0_8px_rgba(50,183,105,0.4)]"
            />
            <span className="text-text-subtle text-xs whitespace-nowrap">
              <strong className="text-text-primary font-semibold tabular-nums">
                {resultCount.toLocaleString()}
              </strong>{" "}
              {resultCount === 1 ? "deal" : "deals"}
            </span>
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
          <FilterBar
            activeFilters={chips}
            onRemoveFilter={removeFilter}
            onClearAll={() => applyFilters(EMPTY_SALES_FILTERS)}
          >
            {null}
          </FilterBar>
        )}
      </div>

      <SalesFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={applyFilters}
        lookups={lookups}
      />
    </>
  );
}
