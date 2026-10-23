"use client";

import { SearchX } from "lucide-react";
import { DataTable } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { EmptyState } from "@/src/components/shared/empty-state";
import { Button } from "@/src/components/ui/button";
import { SalesDealCard } from "@/src/components/sales/sales-deal-card";
import { useTablePreferences } from "@/src/hooks/use-table-preferences";
import {
  CUSTOMIZABLE_SALES_COLUMNS,
  DEFAULT_SALES_COLUMN_ORDER,
  DEFAULT_SALES_COLUMN_VISIBILITY,
  getSalesColumns,
} from "@/src/components/sales/sales-columns";
import type { SalesListRow } from "@/src/lib/types/sales-list";

interface SalesTableProps {
  rows: SalesListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  variant: "table" | "grid";
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hasActiveQuery: boolean;
  onClearQuery: () => void;
  canCreate: boolean;
}

export function SalesTable({
  rows,
  totalCount,
  page,
  pageSize,
  variant,
  onPageChange,
  onPageSizeChange,
  hasActiveQuery,
  onClearQuery,
  canCreate,
}: SalesTableProps) {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder, reset, isHydrated } =
    useTablePreferences("omc-sales-table", {
      columnVisibility: DEFAULT_SALES_COLUMN_VISIBILITY,
      columnOrder: DEFAULT_SALES_COLUMN_ORDER,
      sorting: [],
    });

  const columns = getSalesColumns();

  if (rows.length === 0 && hasActiveQuery) {
    return (
      <div role="status" className="surface-card flex flex-col items-center gap-4 px-6 py-12 text-center">
        <SearchX className="text-text-subtle size-8" aria-hidden="true" />
        <div>
          <p className="text-body text-text-primary font-medium">No deals match your search</p>
          <p className="text-body-sm text-text-muted mt-1">
            Try different words, or remove some of the filters.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClearQuery}>
          Clear filters
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="surface-card">
        <EmptyState
          icon="Inbox"
          title="No deals yet"
          description="Deals you create for customers and vehicles will appear here."
          action={canCreate ? { label: "New Deal", href: "/admin/sales/new" } : undefined}
        />
      </div>
    );
  }

  const cards = (className: string) => (
    <ul className={className}>
      {rows.map((row, index) => (
        <SalesDealCard key={row.id} row={row} index={index} />
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-3">
      {variant === "table" ? (
        <>
          <div className="hidden justify-end md:flex">
            <TableCustomizer
              columns={CUSTOMIZABLE_SALES_COLUMNS}
              visibility={columnVisibility}
              onVisibilityChange={(id, visible) =>
                setColumnVisibility({ ...columnVisibility, [id]: visible })
              }
              onReset={reset}
            />
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              columnVisibility={isHydrated ? columnVisibility : DEFAULT_SALES_COLUMN_VISIBILITY}
              onColumnVisibilityChange={setColumnVisibility}
              columnOrder={isHydrated ? columnOrder : DEFAULT_SALES_COLUMN_ORDER}
              onColumnOrderChange={setColumnOrder}
              enableColumnResizing
              ariaLabel="Deals table"
            />
          </div>

          <div className="md:hidden">{cards("flex flex-col gap-3")}</div>
        </>
      ) : (
        cards("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3")
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel={{ singular: "deal", plural: "deals" }}
      />
    </div>
  );
}
