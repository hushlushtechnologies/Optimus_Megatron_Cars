"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Car, Eye, MoreVertical, UserRound } from "lucide-react";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/src/components/ui/dropdown";
import { SalesStatusBadge } from "@/src/components/sales/sales-status-badge";
import { SalesPaymentBar } from "@/src/components/sales/sales-payment-bar";
import { SalesExpiryChip } from "@/src/components/sales/sales-expiry-chip";
import { formatMoney } from "@/src/lib/utils/sales-format";
import { formatDay, formatDateTimeFull } from "@/src/lib/utils/test-drive-format";
import type { SalesListRow } from "@/src/lib/types/sales-list";

const columnHelper = createColumnHelper<SalesListRow>();

export function getSalesColumns(): ColumnDef<SalesListRow, unknown>[] {
  const columns = [
    columnHelper.display({
      id: "deal_number",
      header: "Deal ID",
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <Link
          href={`/admin/sales/${row.original.id}`}
          className="text-text-primary hover:text-primary-text font-medium whitespace-nowrap"
        >
          {row.original.deal_number}
        </Link>
      ),
    }),

    columnHelper.display({
      id: "customer",
      header: "Customer",
      enableSorting: false,
      size: 230,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <CustomerAvatar
            fullName={row.original.customer_name}
            photoUrl={row.original.customer_photo_url}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              href={`/admin/customers/${row.original.customer_id}`}
              className="text-text-primary hover:text-primary-text block truncate font-medium"
            >
              {row.original.customer_name}
            </Link>
            <p className="text-caption text-text-subtle truncate">{row.original.customer_number}</p>
          </div>
        </div>
      ),
    }),

    columnHelper.display({
      id: "vehicle",
      header: "Vehicle",
      enableSorting: false,
      size: 240,
      cell: ({ row }) => (
        <div className="min-w-0">
          <Link
            href={`/admin/inventory/${row.original.car_id}`}
            className="text-text-primary hover:text-primary-text block truncate font-medium"
          >
            {row.original.vehicle_title}
          </Link>
          <p className="text-caption text-text-subtle truncate">
            {row.original.stock_id}
            {row.original.brand_name ? ` · ${row.original.brand_name}` : ""}
          </p>
        </div>
      ),
    }),

    columnHelper.display({
      id: "status",
      header: "Status",
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <SalesStatusBadge status={row.original.status} size="sm" />
          <SalesExpiryChip
            expiresAt={row.original.reservation_expires_at}
            reservationStatus={row.original.reservation_status}
          />
        </div>
      ),
    }),

    columnHelper.display({
      id: "owner",
      header: "Owner",
      enableSorting: false,
      size: 160,
      cell: ({ row }) =>
        row.original.owner_name ? (
          <span className="truncate">{row.original.owner_name}</span>
        ) : (
          <span className="text-text-subtle">Unassigned</span>
        ),
    }),

    columnHelper.display({
      id: "price",
      header: "Price",
      enableSorting: false,
      size: 160,
      cell: ({ row }) => {
        const price = row.original.agreed_price ?? row.original.proposed_price;
        return (
          <div>
            <p className="text-text-primary font-medium whitespace-nowrap tabular-nums">
              {formatMoney(price, row.original.currency)}
            </p>
            <p className="text-caption text-text-subtle">
              {row.original.agreed_price !== null ? "Agreed" : "Proposed"}
            </p>
          </div>
        );
      },
    }),

    columnHelper.display({
      id: "payment",
      header: "Payment",
      enableSorting: false,
      size: 170,
      cell: ({ row }) => <SalesPaymentBar row={row.original} />,
    }),

    columnHelper.accessor("location_name", {
      id: "showroom",
      header: "Showroom",
      enableSorting: false,
      size: 150,
    }),

    columnHelper.display({
      id: "created_at",
      header: "Created",
      enableSorting: false,
      size: 130,
      cell: ({ row }) => (
        <span className="whitespace-nowrap" title={formatDateTimeFull(row.original.created_at)}>
          {formatDay(row.original.created_at)}
        </span>
      ),
    }),

    columnHelper.display({
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const deal = row.original;
        const itemClass =
          "text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2";
        return (
          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label={`Actions for ${deal.deal_number}`} variant="ghost" size="sm">
                <MoreVertical className="size-4" aria-hidden="true" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-56 py-1">
              <Link href={`/admin/sales/${deal.id}`} role="menuitem" className={itemClass}>
                <Eye className="text-text-muted size-4" aria-hidden="true" />
                View deal
              </Link>
              <Link href={`/admin/customers/${deal.customer_id}`} role="menuitem" className={itemClass}>
                <UserRound className="text-text-muted size-4" aria-hidden="true" />
                View customer
              </Link>
              <Link href={`/admin/inventory/${deal.car_id}`} role="menuitem" className={itemClass}>
                <Car className="text-text-muted size-4" aria-hidden="true" />
                View vehicle
              </Link>
            </DropdownContent>
          </Dropdown>
        );
      },
    }),
  ];

  return columns as ColumnDef<SalesListRow, unknown>[];
}

export const DEFAULT_SALES_COLUMN_ORDER = [
  "deal_number",
  "customer",
  "vehicle",
  "status",
  "owner",
  "price",
  "payment",
  "showroom",
  "created_at",
  "actions",
];

export const DEFAULT_SALES_COLUMN_VISIBILITY: Record<string, boolean> = {
  deal_number: true,
  customer: true,
  vehicle: true,
  status: true,
  owner: true,
  price: true,
  payment: true,
  showroom: false,
  created_at: false,
  actions: true,
};

// Deal ID and Customer always stay visible: they identify the row.
export const CUSTOMIZABLE_SALES_COLUMNS = [
  { id: "vehicle", label: "Vehicle" },
  { id: "status", label: "Status" },
  { id: "owner", label: "Owner" },
  { id: "price", label: "Price" },
  { id: "payment", label: "Payment" },
  { id: "showroom", label: "Showroom" },
  { id: "created_at", label: "Created Date" },
];
