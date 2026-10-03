"use client";

import Link from "next/link";
import {
  CarFront,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  ShieldCheck,
  Repeat,
  MapPin,
  Gauge,
} from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { IconButton } from "@/src/components/ui/icon-button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { cn } from "@/src/lib/utils/cn";
import type { InventoryCarRow } from "@/src/lib/supabase/inventory-queries";

interface VehicleCardProps {
  car: InventoryCarRow;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

function formatAED(value: number | null) {
  return value === null ? "Price on request" : `AED ${value.toLocaleString()}`;
}

export function VehicleCard({
  car,
  isSelected,
  onToggleSelect,
  onDuplicate,
  onArchive,
  onRestore,
  onRequestDelete,
}: VehicleCardProps) {
  const isArchived = !!car.archived_at;
  const featured = car.media?.find((m) => m.is_featured) ?? car.media?.[0];
  const subtitle = [car.brand?.name, car.model?.name, car.variant?.name].filter(Boolean).join(" · ");

  return (
    <Card
      variant="elevated"
      padding="sm"
      className={cn(
        "group relative flex flex-col gap-3 overflow-visible",
        isSelected && "ring-primary ring-2",
      )}
    >
      <div className="bg-card-hover relative -m-3 mb-0 aspect-[4/3] overflow-hidden rounded-t-lg">
        {featured ? (
          <img
            src={featured.url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <CarFront className="text-text-subtle size-10" aria-hidden="true" />
          </div>
        )}

        <div
          className={cn(
            "absolute top-2 left-2 transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
          )}
        >
          <input
            type="checkbox"
            aria-label={`Select ${car.display_title}`}
            checked={isSelected}
            onChange={onToggleSelect}
            className="accent-primary size-4 rounded border-white/40 bg-black/30"
          />
        </div>

        {car.availability_status && (
          <div className="absolute top-2 right-2">
            <StatusBadge
              label={car.availability_status.name}
              colorHex={car.availability_status.color_hex}
              className="glass-panel shadow-soft-sm border-0"
            />
          </div>
        )}

        {car.collection?.name && (
          <div className="absolute bottom-2 left-2">
            <span className="glass-panel text-caption text-text-primary shadow-soft-sm rounded-full border-0 px-2.5 py-1">
              {car.collection.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <Link href={`/admin/inventory/${car.id}`} className="hover:text-primary-text">
            <h3 className="text-body-lg text-text-primary truncate font-medium">{car.display_title}</h3>
          </Link>
          {subtitle && (
            <p className="text-caption truncate">
              {subtitle}
              {car.manufacturing_year ? ` · ${car.manufacturing_year}` : ""}
            </p>
          )}
        </div>

        <p className="text-h3 text-text-primary tabular-nums">{formatAED(car.regular_price)}</p>

        <div className="text-caption text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1">
          {car.mileage_km !== null && (
            <span className="flex items-center gap-1">
              <Gauge className="size-3.5" aria-hidden="true" />
              {car.mileage_km.toLocaleString()} km
            </span>
          )}
          {car.location?.name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {car.location.name}
            </span>
          )}
          {car.warranty_available && (
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Warranty
            </span>
          )}
          {car.trade_in_available && (
            <span className="flex items-center gap-1 text-blue-400">
              <Repeat className="size-3.5" aria-hidden="true" />
              Trade-In
            </span>
          )}
        </div>
      </div>

      <div className="border-border flex items-center gap-2 border-t pt-3">
        <Link
          href={`/admin/inventory/${car.id}`}
          className="border-border text-body-sm text-text-primary hover:bg-card-hover flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 transition-colors"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View
        </Link>
        <Link
          href={`/admin/inventory/${car.id}/edit`}
          className="border-border text-body-sm text-text-primary hover:bg-card-hover flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 transition-colors"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Link>
        <Dropdown>
          <DropdownTrigger>
            <IconButton aria-label="More actions" variant="outline" size="sm">
              <MoreVertical className="size-4" />
            </IconButton>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-40 py-1">
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
              onClick={() => onRequestDelete(car.id)}
              className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left text-red-400"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          </DropdownContent>
        </Dropdown>
      </div>
    </Card>
  );
}
