"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { IconButton } from "@/src/components/ui/icon-button";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;

  onPageSizeChange?: (size: number) => void;

  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  /* =======================================================
     PAGINATION VALUES
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const end = Math.min(currentPage * pageSize, totalItems);

  const isPreviousDisabled = currentPage <= 1;

  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="border-border/70 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* =================================================
          RESULT INFORMATION
      ================================================= */}

      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="bg-success size-1.5 shrink-0 rounded-full shadow-[0_0_7px_rgba(50,183,105,0.35)]"
        />

        <p className="text-text-subtle text-[10px] whitespace-nowrap">
          Showing{" "}
          <span className="text-text-primary font-medium tabular-nums">
            {start.toLocaleString()}–{end.toLocaleString()}
          </span>{" "}
          of <span className="text-text-primary font-medium tabular-nums">{totalItems.toLocaleString()}</span>{" "}
          {totalItems === 1 ? "vehicle" : "vehicles"}
        </p>
      </div>

      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {/* ===============================================
            ROWS PER PAGE
        =============================================== */}

        {onPageSizeChange && (
          <label className="text-text-subtle flex shrink-0 items-center gap-2 text-[10px]">
            <span className="hidden md:inline">Rows per page</span>

            <span className="md:hidden">Rows</span>

            <div className="relative">
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(event) => {
                  onPageSizeChange(Number(event.target.value));
                }}
                className="border-border bg-card text-text-primary hover:border-text-subtle/40 focus-visible:border-primary focus-visible:ring-primary/15 h-8 min-w-[58px] cursor-pointer appearance-none rounded-md border py-1 pr-7 pl-2.5 text-[10px] font-medium tabular-nums transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <ChevronDownIcon />
            </div>
          </label>
        )}

        {/* ===============================================
            DIVIDER
        =============================================== */}

        {onPageSizeChange && <div aria-hidden="true" className="bg-border/70 hidden h-5 w-px sm:block" />}

        {/* ===============================================
            PAGE NAVIGATION
        =============================================== */}

        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            aria-label="Previous page"
            variant="outline"
            size="sm"
            disabled={isPreviousDisabled}
            onClick={() => onPageChange(currentPage - 1)}
            className="size-8 rounded-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </IconButton>

          {/* =============================================
              CURRENT PAGE
          ============================================= */}

          <div className="text-text-subtle flex min-w-[74px] items-center justify-center px-1 text-[10px]">
            <span className="hidden sm:inline">Page&nbsp;</span>

            <span className="text-text-primary font-semibold tabular-nums">{currentPage}</span>

            <span className="text-text-subtle mx-1">/</span>

            <span className="text-text-muted tabular-nums">{totalPages}</span>
          </div>

          <IconButton
            aria-label="Next page"
            variant="outline"
            size="sm"
            disabled={isNextDisabled}
            onClick={() => onPageChange(currentPage + 1)}
            className="size-8 rounded-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SELECT CHEVRON
========================================================= */

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="text-text-subtle pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2"
    >
      <path
        d="M6 8L10 12L14 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
