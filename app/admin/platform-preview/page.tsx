"use client";

import { useState } from "react";
import {
  createColumnHelper,
  ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Car, DollarSign, Trash2, Tag } from "lucide-react";
import { MetricCard } from "@/src/components/shared/metric-card";
import { FilterBar } from "@/src/components/shared/filter-bar";
import { SortControl } from "@/src/components/shared/sort-control";
import { ExportMenu } from "@/src/components/shared/export-menu";
import { DataTable, createSelectionColumn } from "@/src/components/shared/data-table/data-table";
import { TableCustomizer } from "@/src/components/shared/data-table/table-customizer";
import { Pagination } from "@/src/components/shared/pagination";
import { BulkActionBar } from "@/src/components/shared/bulk-action-bar";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { ColorPicker } from "@/src/components/ui/color-picker";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { SuccessDialog } from "@/src/components/shared/success-dialog";
import { ErrorDialog } from "@/src/components/shared/error-dialog";

interface MockRow {
  id: string;
  name: string;
  price: number;
  status: { label: string; colorHex: string };
}

const MOCK_ROWS: MockRow[] = [
  {
    id: "1",
    name: "Porsche 911 GT3",
    price: 720000,
    status: { label: "Available", colorHex: "#34d399" },
  },
  {
    id: "2",
    name: "Range Rover Autobiography",
    price: 540000,
    status: { label: "Reserved", colorHex: "#60a5fa" },
  },
  {
    id: "3",
    name: "Bentley Continental GT",
    price: 890000,
    status: { label: "Sold", colorHex: "#94a3b8" },
  },
  {
    id: "4",
    name: "McLaren 720S",
    price: 1150000,
    status: { label: "Coming Soon", colorHex: "#d4af37" },
  },
];

const columnHelper = createColumnHelper<MockRow>();
const columns = [
  createSelectionColumn<MockRow>(),
  columnHelper.accessor("name", { header: "Vehicle" }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: (ctx) => `AED ${ctx.getValue().toLocaleString()}`,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (ctx) => <StatusBadge label={ctx.getValue().label} colorHex={ctx.getValue().colorHex} />,
  }),
] as ColumnDef<MockRow, unknown>[];

export default function PlatformPreviewPage() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sort, setSort] = useState("newest");
  const [color, setColor] = useState("#8C9091");
  const [colorName, setColorName] = useState("Nardo Grey");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <h1 className="text-h1">Platform Components Preview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Cars"
          value={128}
          icon={<Car />}
          change={12}
          trend={[10, 14, 12, 16, 15, 18, 20]}
        />
        <MetricCard label="Revenue" value={4820000} prefix="AED " icon={<DollarSign />} change={-3} />
        <MetricCard label="Loading Example" value={0} isLoading />
      </div>

      <FilterBar
        resultCount={4}
        activeFilters={[{ key: "brand", label: "Brand: Porsche" }]}
        onClearAll={() => {}}
      >
        <SortControl
          value={sort}
          onChange={setSort}
          options={[
            { value: "newest", label: "Newest Added" },
            { value: "price-high", label: "Price: High to Low" },
          ]}
        />
        <TableCustomizer
          columns={[
            { id: "price", label: "Price" },
            { id: "status", label: "Status" },
          ]}
          visibility={{ price: true, status: true }}
          onVisibilityChange={() => {}}
          onReset={() => {}}
        />
        <ExportMenu
          onExportPDF={() => new Promise((r) => setTimeout(r, 1000))}
          onExportExcel={() => new Promise((r) => setTimeout(r, 1000))}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={MOCK_ROWS}
        getRowId={(row) => row.id}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        sorting={sorting}
        onSortingChange={setSorting}
      />

      <Pagination page={1} pageSize={10} totalItems={4} onPageChange={() => {}} onPageSizeChange={() => {}} />

      <ColorPicker
        label="Exterior Color"
        value={color}
        onChange={setColor}
        colorName={colorName}
        onColorNameChange={setColorName}
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Open Confirm Dialog
        </Button>
        <Button onClick={() => setSuccessOpen(true)}>Open Success Dialog</Button>
        <Button variant="outline" onClick={() => setErrorOpen(true)}>
          Open Error Dialog
        </Button>
      </div>

      <BulkActionBar
        selectedCount={selectedCount}
        onClearSelection={() => setRowSelection({})}
        actions={[
          { label: "Assign Collection", icon: Tag, onClick: () => {} },
          {
            label: "Delete",
            icon: Trash2,
            variant: "destructive",
            onClick: () => setConfirmOpen(true),
          },
        ]}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title={`Delete ${selectedCount || 1} Vehicle${selectedCount === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
      <SuccessDialog
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Vehicle Created Successfully"
        description="The new listing is now visible in your inventory."
      />
      <ErrorDialog
        isOpen={errorOpen}
        onClose={() => setErrorOpen(false)}
        onRetry={() => setErrorOpen(false)}
      />
    </div>
  );
}
