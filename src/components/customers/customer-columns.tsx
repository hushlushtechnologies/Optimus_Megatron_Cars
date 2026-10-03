"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Archive, Trash2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import {
  CustomerLifecycleBadge,
  CustomerAccountStatusBadge,
} from "@/src/components/customers/customer-status-badge";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { createSelectionColumn } from "@/src/components/shared/data-table/data-table";
import type { CustomerRow } from "@/src/lib/supabase/customer-queries";

export type { CustomerRow };

const columnHelper = createColumnHelper<CustomerRow>();

// Pulled directly from the badge components' own prop types, rather than
// redeclared as a separate union here — if those components' accepted
// status values ever change, this stays correct automatically instead of
// silently drifting out of sync with a hand-copied list.
type LifecycleStatusValue = React.ComponentProps<typeof CustomerLifecycleBadge>["status"];
type AccountStatusValue = React.ComponentProps<typeof CustomerAccountStatusBadge>["status"];

interface CustomerColumnActions {
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function getCustomerColumns({
  onArchive,
  onDelete,
}: CustomerColumnActions): ColumnDef<CustomerRow, unknown>[] {
  const columns = [
    createSelectionColumn<CustomerRow>(),
    columnHelper.display({
      id: "avatar",
      header: "",
      size: 48,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => (
        <CustomerAvatar
          fullName={row.original.full_name}
          photoUrl={row.original.profile_photo_url}
          size="sm"
        />
      ),
    }),
    columnHelper.accessor("full_name", {
      id: "name",
      header: "Customer",
      enableSorting: false,
      size: 220,
      cell: ({ row }) => (
        <Link href={`/admin/customers/${row.original.id}`} className="hover:text-primary-text block">
          <p className="text-text-primary truncate font-medium">{row.original.full_name}</p>
          <p className="text-caption truncate">{row.original.customer_number}</p>
        </Link>
      ),
    }),
    columnHelper.accessor("customer_number", {
      id: "customer_number",
      header: "Customer ID",
      enableSorting: false,
    }),
    columnHelper.accessor("email", {
      id: "email",
      header: "Email",
      enableSorting: false,
    }),
    columnHelper.accessor("phone", {
      id: "phone",
      header: "Phone",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.source?.name, {
      id: "source",
      header: "Source",
      enableSorting: false,
      cell: (ctx) => ctx.getValue() ?? "—",
    }),
    columnHelper.accessor((row) => row.location?.name, {
      id: "location",
      header: "Location",
      enableSorting: false,
      cell: (ctx) => ctx.getValue() ?? "—",
    }),
    columnHelper.display({
      id: "lifecycle_status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <CustomerLifecycleBadge status={row.original.lifecycle_status as LifecycleStatusValue} />
      ),
    }),
    columnHelper.display({
      id: "account_status",
      header: "Account",
      enableSorting: false,
      cell: ({ row }) => (
        <CustomerAccountStatusBadge status={row.original.account_status as AccountStatusValue} />
      ),
    }),
    columnHelper.accessor("activeDealsCount", {
      id: "active_deals",
      header: "Active Deals",
      enableSorting: false,
    }),
    columnHelper.accessor("purchasedCount", {
      id: "purchased_count",
      header: "Purchased Cars",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.primary_relationship_manager?.full_name, {
      id: "prm",
      header: "Relationship Manager",
      enableSorting: false,
      cell: (ctx) => ctx.getValue() ?? "—",
    }),
    columnHelper.accessor("created_at", {
      id: "joined",
      header: "Joined",
      enableSorting: false,
      cell: (ctx) => formatDistanceToNow(new Date(ctx.getValue()), { addSuffix: true }),
    }),
    columnHelper.accessor("last_activity_at", {
      id: "last_activity",
      header: "Last Activity",
      enableSorting: false,
      cell: (ctx) =>
        ctx.getValue() ? formatDistanceToNow(new Date(ctx.getValue()!), { addSuffix: true }) : "—",
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label="Row actions" variant="ghost" size="sm">
                <MoreVertical className="size-4" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-44 py-1">
              <Link
                href={`/admin/customers/${customer.id}`}
                role="menuitem"
                className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
              >
                <Eye className="text-text-muted size-4" aria-hidden="true" />
                View
              </Link>
              <Link
                href={`/admin/customers/${customer.id}/edit`}
                role="menuitem"
                className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
              >
                <Pencil className="text-text-muted size-4" aria-hidden="true" />
                Edit
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => onArchive(customer.id)}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <Archive className="text-text-muted size-4" aria-hidden="true" />
                Archive
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => onDelete(customer.id)}
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

  // Same TanStack column-def variance limitation as inventory-columns.tsx —
  // see that file's comment for the full explanation.
  return columns as ColumnDef<CustomerRow, unknown>[];
}

export const DEFAULT_CUSTOMER_COLUMN_ORDER = [
  "select",
  "avatar",
  "name",
  "customer_number",
  "email",
  "phone",
  "source",
  "location",
  "lifecycle_status",
  "account_status",
  "active_deals",
  "purchased_count",
  "prm",
  "joined",
  "last_activity",
  "actions",
];

export const DEFAULT_CUSTOMER_COLUMN_VISIBILITY: Record<string, boolean> = {
  select: true,
  avatar: true,
  name: true,
  customer_number: true,
  email: true,
  phone: true,
  source: false,
  location: true,
  lifecycle_status: true,
  account_status: false,
  active_deals: true,
  purchased_count: false,
  prm: false,
  joined: true,
  last_activity: false,
  actions: true,
};

export const CUSTOMIZABLE_CUSTOMER_COLUMNS = [
  { id: "avatar", label: "Avatar" },
  { id: "customer_number", label: "Customer ID" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "source", label: "Source" },
  { id: "location", label: "Location" },
  { id: "lifecycle_status", label: "Customer Status" },
  { id: "account_status", label: "Account Status" },
  { id: "active_deals", label: "Active Deals" },
  { id: "purchased_count", label: "Purchased Cars" },
  { id: "prm", label: "Relationship Manager" },
  { id: "joined", label: "Joined Date" },
  { id: "last_activity", label: "Last Activity" },
];
