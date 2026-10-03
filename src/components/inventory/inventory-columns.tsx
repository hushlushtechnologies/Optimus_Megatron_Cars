"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
  CarFront,
  Eye,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreVertical,
  ShieldCheck,
  Repeat,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { createSelectionColumn } from "@/src/components/shared/data-table/data-table";
import type { InventoryCarRow } from "@/src/lib/supabase/inventory-queries";

export type { InventoryCarRow };

const columnHelper = createColumnHelper<InventoryCarRow>();

function formatAED(value: number | null) {
  return value === null ? "—" : `AED ${value.toLocaleString()}`;
}

interface InventoryColumnActions {
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function getInventoryColumns({
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: InventoryColumnActions): ColumnDef<InventoryCarRow, unknown>[] {
  const columns = [
    createSelectionColumn<InventoryCarRow>(),
    columnHelper.display({
      id: "image",
      header: "",
      size: 64,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const featured = row.original.media?.find((m) => m.is_featured) ?? row.original.media?.[0];
        return (
          <div className="bg-card-hover flex size-12 items-center justify-center overflow-hidden rounded-md">
            {featured ? (
              <img src={featured.url} alt="" className="size-full object-cover" />
            ) : (
              <CarFront className="text-text-subtle size-5" aria-hidden="true" />
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("display_title", {
      id: "name",
      header: "Vehicle",
      enableSorting: false,
      size: 240,
      cell: ({ row }) => {
        const car = row.original;
        const subtitle = [car.brand?.name, car.model?.name, car.variant?.name, car.manufacturing_year]
          .filter(Boolean)
          .join(" · ");
        return (
          <Link href={`/admin/inventory/${car.id}`} className="hover:text-primary-text block">
            <p className="text-text-primary truncate font-medium">{car.display_title}</p>
            {subtitle && <p className="text-caption truncate">{subtitle}</p>}
          </Link>
        );
      },
    }),
    columnHelper.accessor("stock_id", {
      id: "stock_id",
      header: "Stock ID",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.brand?.name, {
      id: "brand",
      header: "Brand",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.model?.name, {
      id: "model",
      header: "Model",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.variant?.name, {
      id: "variant",
      header: "Variant",
      enableSorting: false,
    }),
    columnHelper.accessor("manufacturing_year", {
      id: "year",
      header: "Year",
      enableSorting: false,
    }),
    columnHelper.accessor("regular_price", {
      id: "price",
      header: "Price",
      enableSorting: false,
      cell: (ctx) => <span className="tabular-nums">{formatAED(ctx.getValue())}</span>,
    }),
    columnHelper.accessor("mileage_km", {
      id: "mileage",
      header: "Mileage",
      enableSorting: false,
      cell: (ctx) => (ctx.getValue() !== null ? `${ctx.getValue()!.toLocaleString()} km` : "—"),
    }),
    columnHelper.accessor((row) => row.location?.name, {
      id: "location",
      header: "Location",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.collection?.name, {
      id: "collection",
      header: "Collection",
      enableSorting: false,
      cell: (ctx) => ctx.getValue() ?? "—",
    }),
    columnHelper.accessor((row) => row.fuel_type?.name, {
      id: "fuel",
      header: "Fuel",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.transmission?.name, {
      id: "transmission",
      header: "Transmission",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.drive_type?.name, {
      id: "drive_type",
      header: "Drive Type",
      enableSorting: false,
    }),
    columnHelper.display({
      id: "exterior_color",
      header: "Exterior Color",
      enableSorting: false,
      cell: ({ row }) => {
        const car = row.original;
        if (!car.exterior_color_name) return "—";
        return (
          <span className="flex items-center gap-2">
            {car.exterior_color_hex && (
              <span
                aria-hidden="true"
                className="border-border size-3 shrink-0 rounded-full border"
                style={{ backgroundColor: car.exterior_color_hex }}
              />
            )}
            {car.exterior_color_name}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.availability_status;
        return status ? <StatusBadge label={status.name} colorHex={status.color_hex} /> : "—";
      },
    }),
    columnHelper.accessor("warranty_available", {
      id: "warranty",
      header: "Warranty",
      enableSorting: false,
      cell: (ctx) =>
        ctx.getValue() ? (
          <ShieldCheck className="size-4 text-emerald-400" aria-label="Warranty available" />
        ) : (
          <span className="text-text-subtle" aria-label="No warranty">
            —
          </span>
        ),
    }),
    columnHelper.accessor("trade_in_available", {
      id: "trade_in",
      header: "Trade-In",
      enableSorting: false,
      cell: (ctx) =>
        ctx.getValue() ? (
          <Repeat className="size-4 text-blue-400" aria-label="Trade-in available" />
        ) : (
          <span className="text-text-subtle" aria-label="Trade-in not available">
            —
          </span>
        ),
    }),
    columnHelper.accessor("created_at", {
      id: "created_at",
      header: "Created",
      enableSorting: false,
      cell: (ctx) => formatDistanceToNow(new Date(ctx.getValue()), { addSuffix: true }),
    }),
    columnHelper.accessor("updated_at", {
      id: "updated_at",
      header: "Updated",
      enableSorting: false,
      cell: (ctx) => formatDistanceToNow(new Date(ctx.getValue()), { addSuffix: true }),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const car = row.original;
        const isArchived = !!car.archived_at;

        return (
          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label="Row actions" variant="ghost" size="sm">
                <MoreVertical className="size-4" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-44 py-1">
              <Link
                href={`/admin/inventory/${car.id}`}
                role="menuitem"
                className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
              >
                <Eye className="text-text-muted size-4" aria-hidden="true" />
                View
              </Link>
              <Link
                href={`/admin/inventory/${car.id}/edit`}
                role="menuitem"
                className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
              >
                <Pencil className="text-text-muted size-4" aria-hidden="true" />
                Edit
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => onDuplicate(car.id)}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <Copy className="text-text-muted size-4" aria-hidden="true" />
                Duplicate
              </button>
              {isArchived ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onRestore(car.id)}
                  className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                >
                  <ArchiveRestore className="text-text-muted size-4" aria-hidden="true" />
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onArchive(car.id)}
                  className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
                >
                  <Archive className="text-text-muted size-4" aria-hidden="true" />
                  Archive
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => onDelete(car.id)}
                className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left text-red-400"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </button>
            </DropdownContent>
          </Dropdown>
        );
      },
    }),
  ];

  // TanStack's columnHelper produces column defs typed with their specific
  // value type (string/number/boolean), which TypeScript's strict function
  // variance checking won't implicitly widen to ColumnDef<TData, unknown> —
  // even with the return type annotated above. This cast is the standard,
  // safe fix: the shapes are genuinely structurally compatible, just not
  // provably so under TS's contravariant check on the `footer`/`cell`
  // function parameters.
  return columns as ColumnDef<InventoryCarRow, unknown>[];
}

export const DEFAULT_COLUMN_ORDER = [
  "select",
  "image",
  "name",
  "stock_id",
  "brand",
  "model",
  "variant",
  "year",
  "price",
  "mileage",
  "location",
  "collection",
  "fuel",
  "transmission",
  "drive_type",
  "exterior_color",
  "status",
  "warranty",
  "trade_in",
  "created_at",
  "updated_at",
  "actions",
];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  select: true,
  image: true,
  name: true,
  stock_id: true,
  brand: true,
  model: false,
  variant: false,
  year: false,
  price: true,
  mileage: true,
  location: true,
  collection: false,
  fuel: false,
  transmission: false,
  drive_type: false,
  exterior_color: false,
  status: true,
  warranty: false,
  trade_in: false,
  created_at: true,
  updated_at: false,
  actions: true,
};

export const CUSTOMIZABLE_COLUMNS = [
  { id: "image", label: "Vehicle Image" },
  { id: "stock_id", label: "Stock ID" },
  { id: "brand", label: "Brand" },
  { id: "model", label: "Model" },
  { id: "variant", label: "Variant" },
  { id: "year", label: "Year" },
  { id: "price", label: "Price" },
  { id: "mileage", label: "Mileage" },
  { id: "location", label: "Location" },
  { id: "collection", label: "Collection" },
  { id: "fuel", label: "Fuel" },
  { id: "transmission", label: "Transmission" },
  { id: "drive_type", label: "Drive Type" },
  { id: "exterior_color", label: "Exterior Color" },
  { id: "status", label: "Status" },
  { id: "warranty", label: "Warranty" },
  { id: "trade_in", label: "Trade-In" },
  { id: "created_at", label: "Created Date" },
  { id: "updated_at", label: "Updated Date" },
];
