"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Film, Loader2, Trash2, VideoOff } from "lucide-react";

import { MediaDropzone } from "@/src/components/inventory/add-car/media/media-dropzone";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import {
  getMediaLimitLabel,
  uploadCarMediaFile,
  validateMediaFile,
} from "@/src/lib/supabase/storage";
import {
  createCarMediaRecord,
  deleteCarMediaRecord,
  updateCarMediaMeta,
} from "@/app/admin/inventory/new/media-actions";
import type { CarMedia } from "@/src/lib/types/inventory";

interface VideoGalleryProps {
  carId: string;
  videos: CarMedia[];
  onVideosChange: (updater: (prev: CarMedia[]) => CarMedia[]) => void;
}

const VIDEO_TYPES = [
  "Walkaround",
  "Interior",
  "Exterior",
  "Engine Start",
  "Exhaust",
  "Other",
];

const VIDEO_TYPE_OPTIONS = VIDEO_TYPES.map((type) => ({
  value: type,
  label: type,
}));

export function VideoGallery({
  carId,
  videos,
  onVideosChange,
}: VideoGalleryProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const validationError = validateMediaFile(file, "video");

      if (validationError) {
        toast.error(validationError);
        continue;
      }

      setUploadingCount((count) => count + 1);

      try {
        const uploadResult = await uploadCarMediaFile(carId, file, "video");

        if (uploadResult.error || !uploadResult.url) {
          toast.error(uploadResult.error ?? "Video upload failed.");
          continue;
        }

        const record = await createCarMediaRecord({
          carId,
          mediaType: "video",
          url: uploadResult.url,
          storagePath: uploadResult.path!,
          title: file.name,
          subtype: "Walkaround",
          fileSizeBytes: file.size,
        });

        if (record.error || !record.media) {
          toast.error(record.error ?? "Unable to save this video.");
          continue;
        }

        onVideosChange((prev) => [...prev, record.media!]);
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    const previousVideos = videos;

    setPendingDeleteId(null);
    onVideosChange((prev) => prev.filter((video) => video.id !== id));

    const result = await deleteCarMediaRecord(id);

    if (result.error) {
      onVideosChange(() => previousVideos);
      toast.error(result.error);
      return;
    }

    toast.success("Video deleted");
  };

  const handleTypeChange = async (id: string, subtype: string) => {
    const target = videos.find((video) => video.id === id);

    if (!target || target.subtype === subtype) return;

    const previousSubtype = target.subtype;

    onVideosChange((prev) =>
      prev.map((video) =>
        video.id === id ? { ...video, subtype } : video,
      ),
    );

    const result = await updateCarMediaMeta(id, { subtype });

    if (result.error) {
      onVideosChange((prev) =>
        prev.map((video) =>
          video.id === id
            ? { ...video, subtype: previousSubtype }
            : video,
        ),
      );

      toast.error(result.error);
    }
  };

  const handleTitleChange = async (id: string, title: string) => {
    const target = videos.find((video) => video.id === id);
    const nextTitle = title.trim();
    const previousTitle = target?.title ?? "";

    if (!target || nextTitle === previousTitle) return;

    onVideosChange((prev) =>
      prev.map((video) =>
        video.id === id ? { ...video, title: nextTitle } : video,
      ),
    );

    const result = await updateCarMediaMeta(id, {
      title: nextTitle,
    });

    if (result.error) {
      onVideosChange((prev) =>
        prev.map((video) =>
          video.id === id
            ? { ...video, title: previousTitle }
            : video,
        ),
      );

      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label">Video Gallery</p>

          <p className="mt-1 text-body-sm text-text-muted">
            Add walkarounds, interior tours, engine starts, and other vehicle videos.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Film className="size-3.5 text-text-subtle" aria-hidden="true" />

          <span className="text-caption tabular-nums text-text-muted">
            {videos.length + uploadingCount}{" "}
            {videos.length + uploadingCount === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>

      {/* Upload */}
      <MediaDropzone
        accept="video/mp4,video/webm,video/quicktime"
        hint={`${getMediaLimitLabel("video")} · MP4, WebM or MOV`}
        onFilesSelected={handleFiles}
      />

      {/* Upload states */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card-hover/30 px-4 py-3">
          <Loader2
            className="size-4 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="text-body-sm font-medium text-text-primary">
              {uploadingCount === 1
                ? "Uploading video..."
                : `Uploading ${uploadingCount} videos...`}
            </p>

            <p className="mt-0.5 text-caption text-text-subtle">
              Keep this page open until the upload finishes.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {videos.length === 0 && uploadingCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-card-hover">
            <VideoOff
              className="size-4 text-text-subtle"
              aria-hidden="true"
            />
          </div>

          <p className="text-body-sm font-medium text-text-primary">
            No vehicle videos yet
          </p>

          <p className="mt-1 max-w-sm text-caption text-text-subtle">
            Upload a walkaround or detail video to give customers a better view of the vehicle.
          </p>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="flex flex-col gap-3">
          {videos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onTitleChange={(title) =>
                void handleTitleChange(video.id, title)
              }
              onTypeChange={(subtype) =>
                void handleTypeChange(video.id, subtype)
              }
              onDelete={() => setPendingDeleteId(video.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this video?"
        description="This video will be permanently removed from the vehicle gallery."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

function VideoCard({
  video,
  index,
  onTitleChange,
  onTypeChange,
  onDelete,
}: {
  video: CarMedia;
  index: number;
  onTitleChange: (title: string) => void;
  onTypeChange: (subtype: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col lg:flex-row">
        {/* Preview */}
        <div className="relative shrink-0 bg-black lg:w-64 xl:w-72">
          <video
            src={video.url}
            controls
            preload="metadata"
            className="aspect-video size-full object-contain"
          />

          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            Video {index + 1}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
          <div>
            <p className="text-body-sm font-medium text-text-primary">
              Video details
            </p>

            <p className="mt-0.5 text-caption text-text-subtle">
              Add a clear title and categorize this video.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Input
              label="Video Title"
              defaultValue={video.title ?? ""}
              placeholder="e.g. Full exterior walkaround"
              onBlur={(event) => onTitleChange(event.target.value)}
            />

            <Select
              label="Video Type"
              value={video.subtype ?? "Walkaround"}
              onChange={(event) => onTypeChange(event.target.value)}
              options={VIDEO_TYPE_OPTIONS}
            />
          </div>

          <div className="mt-auto flex justify-end border-t border-border/70 pt-3">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-body-sm text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}