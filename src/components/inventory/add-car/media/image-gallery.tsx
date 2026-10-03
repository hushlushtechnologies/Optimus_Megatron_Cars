"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ImageIcon, ImageOff, Loader2, Star, Trash2 } from "lucide-react";

import { MediaDropzone } from "@/src/components/inventory/add-car/media/media-dropzone";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { uploadCarMediaFile, validateMediaFile, getMediaLimitLabel } from "@/src/lib/supabase/storage";
import {
  createCarMediaRecord,
  deleteCarMediaRecord,
  setFeaturedCarImage,
  reorderCarMedia,
} from "@/app/admin/inventory/new/media-actions";
import { cn } from "@/src/lib/utils/cn";
import type { CarMedia } from "@/src/lib/types/inventory";

interface ImageGalleryProps {
  carId: string;
  images: CarMedia[];
  onImagesChange: (updater: (prev: CarMedia[]) => CarMedia[]) => void;
}

const MAX_IMAGES = 40;

export function ImageGallery({ carId, images, onImagesChange }: ImageGalleryProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleFiles = async (files: File[]) => {
    if (images.length + uploadingCount + files.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images per vehicle.`);
      return;
    }

    for (const file of files) {
      const validationError = validateMediaFile(file, "image");

      if (validationError) {
        toast.error(validationError);
        continue;
      }

      setUploadingCount((count) => count + 1);

      try {
        const uploadResult = await uploadCarMediaFile(carId, file, "image");

        if (uploadResult.error || !uploadResult.url) {
          toast.error(uploadResult.error ?? "Image upload failed.");
          continue;
        }

        const record = await createCarMediaRecord({
          carId,
          mediaType: "image",
          url: uploadResult.url,
          storagePath: uploadResult.path!,
          fileSizeBytes: file.size,
          isFeatured: images.length === 0,
        });

        if (record.error || !record.media) {
          toast.error(record.error ?? "Unable to save this image.");
          continue;
        }

        onImagesChange((prev) => [...prev, record.media!]);
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleSetFeatured = async (mediaId: string) => {
    const previousImages = images;

    onImagesChange((prev) =>
      prev.map((image) => ({
        ...image,
        is_featured: image.id === mediaId,
      })),
    );

    const result = await setFeaturedCarImage(carId, mediaId);

    if (result.error) {
      onImagesChange(() => previousImages);
      toast.error(result.error);
      return;
    }

    toast.success("Featured image updated");
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    const mediaId = pendingDeleteId;
    const previousImages = images;

    setPendingDeleteId(null);
    onImagesChange((prev) => prev.filter((image) => image.id !== mediaId));

    const result = await deleteCarMediaRecord(mediaId);

    if (result.error) {
      onImagesChange(() => previousImages);
      toast.error(result.error);
      return;
    }

    toast.success("Image deleted");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((image) => image.id === active.id);
    const newIndex = images.findIndex((image) => image.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const previousImages = images;
    const reordered = [...images];
    const [moved] = reordered.splice(oldIndex, 1);

    reordered.splice(newIndex, 0, moved);
    onImagesChange(() => reordered);

    const result = await reorderCarMedia(
      reordered.map((image, index) => ({
        id: image.id,
        sort_order: index,
      })),
    );

    if (result?.error) {
      onImagesChange(() => previousImages);
      toast.error(result.error);
    }
  };

  const totalCount = images.length + uploadingCount;
  const isAtLimit = totalCount >= MAX_IMAGES;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label">Image Gallery</p>

          <p className="text-body-sm text-text-muted mt-1">
            Upload vehicle photos, choose the cover image, and drag to reorder.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ImageIcon className="text-text-subtle size-3.5" aria-hidden="true" />

          <span className="text-caption text-text-muted tabular-nums">
            {totalCount} / {MAX_IMAGES} images
          </span>
        </div>
      </div>

      {/* Upload */}
      {!isAtLimit ? (
        <MediaDropzone
          accept="image/jpeg,image/png,image/webp"
          hint={`${getMediaLimitLabel("image")} · JPG, PNG or WebP · Recommended 2000px+ width`}
          onFilesSelected={handleFiles}
        />
      ) : (
        <div className="border-border bg-card-hover/30 flex items-center gap-2 rounded-lg border px-4 py-3">
          <Check className="text-success size-4 shrink-0" aria-hidden="true" />

          <p className="text-body-sm text-text-muted">Maximum of {MAX_IMAGES} images reached.</p>
        </div>
      )}

      {/* Gallery */}
      {(images.length > 0 || uploadingCount > 0) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-caption text-text-subtle">Drag images to change their display order.</p>

            {images.length > 1 && (
              <p className="text-caption text-text-subtle hidden sm:block">
                First image is not automatically the cover
              </p>
            )}
          </div>

          <DndContext
            id="car-image-gallery-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
              <div className="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image, index) => (
                  <SortableImageCard
                    key={image.id}
                    image={image}
                    index={index}
                    onSetFeatured={() => void handleSetFeatured(image.id)}
                    onDelete={() => setPendingDeleteId(image.id)}
                  />
                ))}

                {Array.from({ length: uploadingCount }).map((_, index) => (
                  <UploadingImageCard key={`uploading-${index}`} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && uploadingCount === 0 && (
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
          <div className="bg-card-hover mb-3 flex size-10 items-center justify-center rounded-full">
            <ImageOff className="text-text-subtle size-4" aria-hidden="true" />
          </div>

          <p className="text-body-sm text-text-primary font-medium">No vehicle images yet</p>

          <p className="text-caption text-text-subtle mt-1 max-w-sm">
            Upload clear exterior and interior photos to build the vehicle gallery.
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this image?"
        description="This image will be permanently removed from the vehicle gallery."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

function SortableImageCard({
  image,
  index,
  onSetFeatured,
  onDelete,
}: {
  image: CarMedia;
  index: number;
  onSetFeatured: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card relative overflow-hidden rounded-lg border transition-[border-color,box-shadow,opacity] duration-150",
        image.is_featured ? "border-primary/50" : "border-border hover:border-text-subtle/40",
        isDragging && "shadow-soft-lg z-20 opacity-60",
      )}
    >
      {/* Image */}
      <div className="bg-card-hover relative aspect-[4/3] overflow-hidden">
        <img
          src={image.url}
          alt={`Vehicle image ${index + 1}`}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          draggable={false}
        />

        {/* Gradient only for action readability */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
        />

        {/* Order */}
        <span className="absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center rounded-md bg-black/55 px-1.5 text-[10px] font-semibold text-white tabular-nums backdrop-blur-sm">
          {index + 1}
        </span>

        {/* Actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Drag image to reorder"
            {...attributes}
            {...listeners}
            className="flex size-7 touch-none items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
          >
            <GripVertical className="size-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={image.is_featured ? "Featured image" : "Set as featured image"}
            onClick={onSetFeatured}
            disabled={image.is_featured}
            className={cn(
              "flex size-7 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-colors",
              image.is_featured ? "text-primary cursor-default" : "hover:text-primary hover:bg-black/75",
            )}
          >
            <Star
              className="size-3.5"
              fill={image.is_featured ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            aria-label="Delete image"
            onClick={onDelete}
            className="hover:bg-danger flex size-7 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-colors hover:text-white"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Featured */}
        {image.is_featured && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Star className="fill-primary text-primary size-3" aria-hidden="true" />
              Featured
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadingImageCard() {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="bg-card-hover/60 relative flex aspect-[4/3] items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="text-primary size-5 animate-spin" aria-hidden="true" />

          <span className="text-caption text-text-muted">Uploading...</span>
        </div>
      </div>
    </div>
  );
}
