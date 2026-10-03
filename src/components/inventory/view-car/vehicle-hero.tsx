"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Archive, ArchiveRestore, CarFront, Check, ChevronDown, Pencil, Trash2 } from "lucide-react";

import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { StatusBadge } from "@/src/components/ui/status-badge";

import { Dropdown, DropdownContent, DropdownTrigger } from "@/src/components/ui/dropdown";

import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";

import { archiveCars, deleteCars, restoreCars } from "@/app/admin/inventory/actions";

import { updateCarAvailabilityStatus } from "@/app/admin/inventory/[id]/actions";

import type { AddCarLookups } from "@/src/lib/supabase/inventory-lookups";

interface VehicleHeroProps {
  carId: string;
  displayTitle: string;
  stockId: string;
  subtitle: string;
  regularPrice: number | null;
  featuredImageUrl: string | null;

  availabilityStatus: {
    id: string;
    name: string;
    color_hex: string;
  } | null;

  publishingStatus: {
    name: string;
    color_hex: string;
  } | null;

  collectionName: string | null;

  availabilityStatuses: AddCarLookups["availabilityStatuses"];

  isArchived: boolean;
}

function formatAED(value: number | null) {
  return value === null ? "Price on request" : `AED ${value.toLocaleString()}`;
}

export function VehicleHero({
  carId,
  displayTitle,
  stockId,
  subtitle,
  regularPrice,
  featuredImageUrl,
  availabilityStatus,
  publishingStatus,
  collectionName,
  availabilityStatuses,
  isArchived,
}: VehicleHeroProps) {
  const router = useRouter();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [isArchiving, setIsArchiving] = useState(false);

  /* =======================================================
     STATUS
  ======================================================= */

  const handleStatusChange = async (statusId: string) => {
    if (isChangingStatus || statusId === availabilityStatus?.id) {
      return;
    }

    setIsChangingStatus(true);

    try {
      const result = await updateCarAvailabilityStatus(carId, statusId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Unable to update vehicle status");
    } finally {
      setIsChangingStatus(false);
    }
  };

  /* =======================================================
     ARCHIVE
  ======================================================= */

  const handleArchiveToggle = async () => {
    if (isArchiving) {
      return;
    }

    setIsArchiving(true);

    try {
      const result = isArchived ? await restoreCars([carId]) : await archiveCars([carId]);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isArchived ? "Vehicle restored successfully" : "Vehicle archived successfully");

      router.refresh();
    } catch {
      toast.error(isArchived ? "Unable to restore vehicle" : "Unable to archive vehicle");
    } finally {
      setIsArchiving(false);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteCars([carId]);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setConfirmDeleteOpen(false);

      toast.success("Vehicle deleted successfully");

      router.push("/admin/inventory");
    } catch {
      toast.error("Unable to delete vehicle");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card variant="flat" padding="sm" className="flex flex-col gap-4 overflow-visible lg:flex-row lg:gap-5">
        {/* =================================================
            IMAGE
        ================================================= */}

        <div className="border-border bg-card-hover relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg border sm:aspect-[16/9] lg:aspect-[4/3] lg:w-72">
          {featuredImageUrl ? (
            <img src={featuredImageUrl} alt={displayTitle} className="size-full object-cover" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2">
              <CarFront className="text-text-subtle size-9" strokeWidth={1.5} aria-hidden="true" />

              <span className="text-caption">No image</span>
            </div>
          )}

          {isArchived && (
            <span className="border-border bg-card/90 text-warning absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium backdrop-blur-sm">
              <Archive className="size-3" aria-hidden="true" />
              Archived
            </span>
          )}
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="flex min-w-0 flex-1 flex-col px-1 py-1">
          {/* =================================================
              TOP
          ================================================= */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* TITLE */}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h2 text-text-primary">{displayTitle}</h1>

                {publishingStatus && (
                  <StatusBadge label={publishingStatus.name} colorHex={publishingStatus.color_hex} />
                )}
              </div>

              {/* STOCK / SUBTITLE */}

              <div className="text-body-sm text-text-muted mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  Stock ID <span className="text-text-primary font-medium">{stockId}</span>
                </span>

                {subtitle && (
                  <>
                    <span aria-hidden="true" className="text-text-subtle">
                      •
                    </span>

                    <span>{subtitle}</span>
                  </>
                )}
              </div>
            </div>

            {/* PRICE */}

            <div className="shrink-0 sm:text-right">
              <p className="text-text-subtle text-[10px] font-medium tracking-[0.06em] uppercase">Price</p>

              <p className="text-text-primary mt-0.5 text-xl font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums">
                {formatAED(regularPrice)}
              </p>
            </div>
          </div>

          {/* =================================================
              META
          ================================================= */}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* AVAILABILITY */}

            {availabilityStatus && (
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-subtle">Availability</span>

                <StatusBadge label={availabilityStatus.name} colorHex={availabilityStatus.color_hex} />
              </div>
            )}

            {/* SEPARATOR */}

            {availabilityStatus && collectionName && (
              <span aria-hidden="true" className="bg-border hidden h-4 w-px sm:block" />
            )}

            {/* COLLECTION */}

            {collectionName && (
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-subtle">Collection</span>

                <span className="text-body-sm text-text-primary font-medium">{collectionName}</span>
              </div>
            )}
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="mt-auto pt-5">
            <div className="bg-border/80 mb-3 h-px" />

            <div className="flex flex-wrap items-center gap-2">
              {/* EDIT */}

              <Link href={`/admin/inventory/${carId}/edit`}>
                <Button size="sm" leftIcon={<Pencil className="size-3.5" aria-hidden="true" />}>
                  Edit Vehicle
                </Button>
              </Link>

              {/* STATUS */}

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isChangingStatus}
                    rightIcon={<ChevronDown className="size-3.5" aria-hidden="true" />}
                  >
                    Change Status
                  </Button>
                </DropdownTrigger>

                <DropdownContent
                  align="start"
                  className="border-border bg-card shadow-soft-lg z-[9999] w-60 overflow-hidden rounded-xl border p-1.5"
                >
                  {/* HEADER */}

                  <div className="px-2.5 pt-1.5 pb-2">
                    <p className="text-text-muted text-[10px] font-semibold tracking-[0.08em] uppercase">
                      Availability status
                    </p>

                    <p className="text-text-subtle mt-0.5 text-[9px]">Select the current vehicle status</p>
                  </div>

                  <div className="bg-border/70 my-1 h-px" />

                  {/* OPTIONS */}

                  <div className="py-0.5">
                    {availabilityStatuses.map((status) => {
                      const isCurrent = status.id === availabilityStatus?.id;

                      return (
                        <button
                          key={status.id}
                          type="button"
                          role="menuitem"
                          disabled={isChangingStatus || isCurrent}
                          onClick={() => void handleStatusChange(status.id)}
                          className="hover:bg-card-hover flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 disabled:cursor-default"
                        >
                          <span className="text-body-sm text-text-primary min-w-0 flex-1 truncate">
                            {status.name}
                          </span>

                          {isCurrent && (
                            <Check
                              className="text-primary size-3.5 shrink-0"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </DropdownContent>
              </Dropdown>

              {/* ARCHIVE */}

              <Button
                size="sm"
                variant="outline"
                leftIcon={
                  isArchived ? (
                    <ArchiveRestore className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Archive className="size-3.5" aria-hidden="true" />
                  )
                }
                isLoading={isArchiving}
                onClick={() => void handleArchiveToggle()}
              >
                {isArchived ? "Restore" : "Archive"}
              </Button>

              {/* DELETE */}

              <Button
                size="sm"
                variant="destructive"
                leftIcon={<Trash2 className="size-3.5" aria-hidden="true" />}
                onClick={() => setConfirmDeleteOpen(true)}
                className="sm:ml-auto"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ===================================================
          DELETE DIALOG
      =================================================== */}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this vehicle?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
