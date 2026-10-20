"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import {
  Archive,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";

import { Input } from "@/src/components/ui/input";
import { IconButton } from "@/src/components/ui/icon-button";
import { Button } from "@/src/components/ui/button";

import { Dropdown, DropdownContent, DropdownTrigger } from "@/src/components/ui/dropdown";

import { SortControl } from "@/src/components/shared/sort-control";
import { FilterBar } from "@/src/components/shared/filter-bar";

import { CustomerFilterDrawer } from "@/src/components/customers/customer-filter-drawer";

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

type FilterValue = string | boolean;

/* =========================================================
   FILTER LABELS
========================================================= */

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
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      const query = searchValue.trim();

      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };

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
      params.delete("archived");
    } else {
      params.set("archived", "true");
    }

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

    (Object.keys(FILTER_LABEL_MAP) as (keyof CustomerFilters)[]).forEach((key) => {
      params.delete(key);
    });

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

    (Object.keys(FILTER_LABEL_MAP) as (keyof CustomerFilters)[]).forEach((key) => {
      params.delete(key);
    });

    /*
     * archived is intentionally preserved.
     * It is a view state, not a filter.
     */

    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  /* =========================================================
     EXPORT
  ========================================================= */

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const params = new URLSearchParams(searchParams.toString());

      params.delete("page");

      params.delete("pageSize");

      params.set("format", format);

      params.set("scope", "current");

      const result = await triggerDownloadFromUrl(`/admin/customers/export?${params.toString()}`);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(format === "pdf" ? "PDF export started" : "Excel export started");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to export customers");
    }
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = () => {
    router.refresh();

    toast.success("Customer data refreshed");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3 transition-opacity duration-200",
          isPending && "opacity-75",
        )}
      >
        {/* ===================================================
            MAIN TOOLBAR
        =================================================== */}

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          {/* ===============================================
              SEARCH
          =============================================== */}

          <div className="min-w-0 flex-1 lg:max-w-[430px] xl:max-w-[500px]">
            <Input
              aria-label="Search customers"
              placeholder="Search name, ID, email or phone..."
              leftIcon={<Search className="text-text-subtle size-4" aria-hidden="true" />}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-10 rounded-lg text-[12px]"
            />
          </div>

          {/* ===============================================
              FILTER + SORT
          =============================================== */}

          <div className="scrollbar-hidden flex min-w-0 items-center gap-2 max-sm:overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="size-3.5" aria-hidden="true" />}
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "h-10 shrink-0 rounded-lg px-3 text-[11px] font-medium",

                activeFilterCount > 0 && ["border-primary/30", "text-primary"],
              )}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary/10 text-primary ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <SortControl options={SORT_OPTIONS} value={sort} onChange={updateSort} />
          </div>

          {/* ===============================================
              RIGHT SIDE
          =============================================== */}

          <div className="flex min-w-0 items-center gap-2 lg:ml-auto">
            {/* =============================================
                RESULT COUNT
            ============================================= */}

            <div className="mr-auto hidden shrink-0 items-center gap-2 sm:flex lg:mr-2">
              <span
                aria-hidden="true"
                className="bg-success size-1.5 rounded-full shadow-[0_0_8px_rgba(50,183,105,0.4)]"
              />

              <span className="text-text-subtle text-[10px] whitespace-nowrap">
                <strong className="text-text-primary font-semibold tabular-nums">
                  {resultCount.toLocaleString()}
                </strong>{" "}
                {resultCount === 1 ? "customer" : "customers"}
              </span>
            </div>

            {/* =============================================
                ARCHIVE
            ============================================= */}

            <button
              type="button"
              onClick={toggleArchivedView}
              aria-pressed={isArchivedView}
              disabled={isPending}
              className={cn(
                "hidden h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-[10px] font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 sm:inline-flex",

                isArchivedView
                  ? ["border-warning/30", "text-warning"]
                  : [
                      "border-border",
                      "text-text-muted",

                      "hover:border-text-subtle/40",
                      "hover:text-text-primary",
                    ],
              )}
            >
              <Archive className="size-3.5" aria-hidden="true" />

              <span className="hidden xl:inline">{isArchivedView ? "Archived" : "Archive"}</span>

              {isArchivedView && <Check className="size-3" aria-hidden="true" />}
            </button>

            {/* =============================================
                MORE ACTIONS
            ============================================= */}

            <div className="relative z-[100]">
              <Dropdown>
                <DropdownTrigger>
                  <IconButton
                    aria-label="More customer actions"
                    variant="outline"
                    size="sm"
                    className="size-10 rounded-lg"
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </IconButton>
                </DropdownTrigger>

                <DropdownContent
                  align="end"
                  className="border-border bg-card shadow-soft-lg z-[9999] w-64 overflow-hidden rounded-xl border p-1.5"
                >
                  {/* =====================================
                      HEADER
                  ===================================== */}

                  <div className="px-2.5 pt-1.5 pb-2">
                    <p className="text-text-muted text-[10px] font-semibold tracking-[0.08em] uppercase">
                      Customer options
                    </p>

                    <p className="text-text-subtle mt-0.5 text-[9px] leading-4">
                      Export and manage your workspace
                    </p>
                  </div>

                  <MenuDivider />

                  {/* =====================================
                      EXPORT
                  ===================================== */}

                  <MenuSectionLabel>Export</MenuSectionLabel>

                  <MenuAction
                    icon={<FileText className="size-3.5" aria-hidden="true" />}
                    iconClassName="
                      bg-danger/[0.08]
                      text-danger

                      group-hover/menu:bg-danger/[0.12]
                      group-hover/menu:text-danger
                    "
                    title="Download PDF"
                    description="Customer report"
                    trailing={
                      <Download
                        className="text-text-subtle group-hover/menu:text-danger size-3.5 transition-all duration-150 group-hover/menu:translate-y-0.5"
                        aria-hidden="true"
                      />
                    }
                    onClick={() => void handleExport("pdf")}
                  />

                  <MenuAction
                    icon={<FileSpreadsheet className="size-3.5" aria-hidden="true" />}
                    iconClassName="
                      bg-success/[0.08]
                      text-success

                      group-hover/menu:bg-success/[0.12]
                      group-hover/menu:text-success
                    "
                    title="Download Excel"
                    description="Spreadsheet data"
                    trailing={
                      <Download
                        className="text-text-subtle group-hover/menu:text-success size-3.5 transition-all duration-150 group-hover/menu:translate-y-0.5"
                        aria-hidden="true"
                      />
                    }
                    onClick={() => void handleExport("excel")}
                  />

                  <MenuDivider />

                  {/* =====================================
                      WORKSPACE
                  ===================================== */}

                  <MenuSectionLabel>Workspace</MenuSectionLabel>

                  <MenuAction
                    icon={
                      <RefreshCw
                        className="size-3.5 transition-transform duration-300 group-hover/menu:rotate-45"
                        aria-hidden="true"
                      />
                    }
                    title="Refresh data"
                    description="Reload latest customers"
                    onClick={handleRefresh}
                  />

                  {/* =====================================
                      MOBILE ARCHIVE
                  ===================================== */}

                  <div className="sm:hidden">
                    <MenuDivider />

                    <MenuSectionLabel>Customers</MenuSectionLabel>

                    <MenuAction
                      icon={<Archive className="size-3.5" aria-hidden="true" />}
                      title={isArchivedView ? "Viewing archived" : "View archived"}
                      description={
                        isArchivedView ? "Return to active customers" : "Browse archived customers"
                      }
                      active={isArchivedView}
                      onClick={toggleArchivedView}
                    />
                  </div>
                </DropdownContent>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* ===================================================
            ACTIVE FILTERS
        =================================================== */}

        {activeFilterCount > 0 && (
          <div className="border-border/70 border-t pt-3">
            <FilterBar activeFilters={activeChips} onRemoveFilter={removeFilter} onClearAll={clearAllFilters}>
              {null}
            </FilterBar>
          </div>
        )}
      </div>

      {/* =====================================================
          FILTER DRAWER
      ===================================================== */}

      <CustomerFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        selectedTagIds={selectedTagIds}
        onApply={applyFilters}
        lookups={filterLookups}
      />
    </>
  );
}

/* =========================================================
   DROPDOWN ACTION
========================================================= */

interface MenuActionProps {
  icon: ReactNode;

  title: string;

  description?: string;

  trailing?: ReactNode;

  iconClassName?: string;

  active?: boolean;

  onClick: () => void;
}

function MenuAction({
  icon,
  title,
  description,
  trailing,
  iconClassName,
  active = false,
  onClick,
}: MenuActionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "group/menu hover:bg-card-hover flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",

        active && "bg-warning/[0.06]",
      )}
    >
      {/* ICON */}

      <span
        className={cn(
          "bg-surface text-text-muted group-hover/menu:text-primary flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150",

          iconClassName,

          active && ["bg-warning/[0.08]", "text-warning", "group-hover/menu:text-warning"],
        )}
      >
        {icon}
      </span>

      {/* CONTENT */}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "text-text-primary block truncate text-[11px] font-medium",

            active && "text-warning",
          )}
        >
          {title}
        </span>

        {description && (
          <span className="text-text-subtle mt-0.5 block truncate text-[9px] leading-3">{description}</span>
        )}
      </span>

      {/* TRAILING */}

      {trailing && <span className="flex shrink-0 items-center justify-center">{trailing}</span>}
    </button>
  );
}

/* =========================================================
   MENU SECTION LABEL
========================================================= */

function MenuSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pt-2 pb-1">
      <p className="text-text-subtle text-[9px] font-semibold tracking-[0.08em] uppercase">{children}</p>
    </div>
  );
}

/* =========================================================
   MENU DIVIDER
========================================================= */

function MenuDivider() {
  return <div aria-hidden="true" className="bg-border/70 my-1 h-px" />;
}
