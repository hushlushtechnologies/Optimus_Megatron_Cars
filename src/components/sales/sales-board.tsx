"use client";

import { SalesDealCard } from "@/src/components/sales/sales-deal-card";

import { SalesStatusBadge, SALES_STATUS_META } from "@/src/components/sales/sales-status-badge";

import { Button } from "@/src/components/ui/button";

import type { SalesDealStatus } from "@/src/lib/types/sales";

import type { SalesBoardColumn } from "@/src/lib/types/sales-list";

/* =========================================================
   TYPES
========================================================= */

interface SalesBoardProps {
  columns: SalesBoardColumn[];

  onViewAll: (status: SalesDealStatus) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

/**
 * Read-only for now.
 *
 * Moving a deal between columns will arrive
 * with the Sales status workflow.
 */
export function SalesBoard({ columns, onViewAll }: SalesBoardProps) {
  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (columns.length === 0) {
    return (
      <p role="status" className="surface-card text-body-sm text-text-muted p-6 text-center">
        The board shows open deals. Use the table or grid to see completed or cancelled deals.
      </p>
    );
  }

  /* =========================================================
     BOARD
  ========================================================= */

  return (
    <div
      role="region"
      aria-label="Deal pipeline"
      tabIndex={0}
      className="scrollbar-hidden -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
    >
      {columns.map((column) => {
        /*
         * The server controls how many
         * rows are returned per board column.
         *
         * Using rows.length here avoids
         * importing BOARD_COLUMN_LIMIT from
         * the server-only query module.
         */
        const visibleCount = column.rows.length;

        const hasMore = column.total > visibleCount;

        return (
          <section
            key={column.status}
            aria-label={`${column.status}, ${column.total} deals`}
            className="bg-card/40 border-border flex w-[290px] shrink-0 snap-start flex-col gap-3 rounded-xl border p-3"
          >
            {/* ===========================================
                  HEADER
              =========================================== */}

            <header className="flex items-center justify-between gap-2">
              <SalesStatusBadge status={column.status} />

              <span className="text-body-sm text-text-muted tabular-nums">{column.total}</span>
            </header>

            {/* ===========================================
                  DESCRIPTION
              =========================================== */}

            <p className="text-caption text-text-subtle -mt-1">
              {SALES_STATUS_META[column.status].description}
            </p>

            {/* ===========================================
                  DEALS
              =========================================== */}

            {visibleCount === 0 ? (
              <p className="border-border text-caption text-text-subtle rounded-lg border border-dashed px-3 py-6 text-center">
                No deals here
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {column.rows.map((row, index) => (
                  <SalesDealCard key={row.id} row={row} compact index={index} />
                ))}
              </ul>
            )}

            {/* ===========================================
                  VIEW ALL
              =========================================== */}

            {hasMore && (
              <Button variant="ghost" size="sm" onClick={() => onViewAll(column.status)}>
                Showing {visibleCount} of {column.total}. View all
              </Button>
            )}
          </section>
        );
      })}
    </div>
  );
}
