"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Headphones, Loader2, Music, Trash2, Volume2 } from "lucide-react";

import { MediaDropzone } from "@/src/components/inventory/add-car/media/media-dropzone";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { getMediaLimitLabel, uploadCarMediaFile, validateMediaFile } from "@/src/lib/supabase/storage";
import {
  createCarMediaRecord,
  deleteCarMediaRecord,
  updateCarMediaMeta,
} from "@/app/admin/inventory/new/media-actions";
import type { CarMedia } from "@/src/lib/types/inventory";

interface EngineAudioGalleryProps {
  carId: string;
  audioClips: CarMedia[];
  onAudioChange: (updater: (prev: CarMedia[]) => CarMedia[]) => void;
}

const AUDIO_TYPES = ["Cold Start", "Rev", "Exhaust", "Other"];

const AUDIO_TYPE_OPTIONS = AUDIO_TYPES.map((type) => ({
  value: type,
  label: type,
}));

export function EngineAudioGallery({ carId, audioClips, onAudioChange }: EngineAudioGalleryProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const validationError = validateMediaFile(file, "audio");

      if (validationError) {
        toast.error(validationError);
        continue;
      }

      setUploadingCount((count) => count + 1);

      try {
        const uploadResult = await uploadCarMediaFile(carId, file, "audio");

        if (uploadResult.error || !uploadResult.url) {
          toast.error(uploadResult.error ?? "Audio upload failed.");
          continue;
        }

        const record = await createCarMediaRecord({
          carId,
          mediaType: "audio",
          url: uploadResult.url,
          storagePath: uploadResult.path!,
          title: file.name,
          subtype: "Cold Start",
          fileSizeBytes: file.size,
        });

        if (record.error || !record.media) {
          toast.error(record.error ?? "Unable to save this audio clip.");
          continue;
        }

        onAudioChange((prev) => [...prev, record.media!]);
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    const previousClips = audioClips;

    setPendingDeleteId(null);
    onAudioChange((prev) => prev.filter((clip) => clip.id !== id));

    const result = await deleteCarMediaRecord(id);

    if (result.error) {
      onAudioChange(() => previousClips);
      toast.error(result.error);
      return;
    }

    toast.success("Audio clip deleted");
  };

  const handleTypeChange = async (id: string, subtype: string) => {
    const target = audioClips.find((clip) => clip.id === id);

    if (!target || target.subtype === subtype) return;

    const previousSubtype = target.subtype;

    onAudioChange((prev) => prev.map((clip) => (clip.id === id ? { ...clip, subtype } : clip)));

    const result = await updateCarMediaMeta(id, { subtype });

    if (result.error) {
      onAudioChange((prev) =>
        prev.map((clip) => (clip.id === id ? { ...clip, subtype: previousSubtype } : clip)),
      );

      toast.error(result.error);
    }
  };

  const handleTitleChange = async (id: string, title: string) => {
    const target = audioClips.find((clip) => clip.id === id);
    const nextTitle = title.trim();
    const previousTitle = target?.title ?? "";

    if (!target || nextTitle === previousTitle) return;

    onAudioChange((prev) => prev.map((clip) => (clip.id === id ? { ...clip, title: nextTitle } : clip)));

    const result = await updateCarMediaMeta(id, { title: nextTitle });

    if (result.error) {
      onAudioChange((prev) =>
        prev.map((clip) => (clip.id === id ? { ...clip, title: previousTitle } : clip)),
      );

      toast.error(result.error);
    }
  };

  const totalCount = audioClips.length + uploadingCount;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label">Engine Sound Experience</p>

          <p className="text-body-sm text-text-muted mt-1">
            Add authentic engine, exhaust, and cold-start recordings for this vehicle.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Headphones className="text-text-subtle size-3.5" aria-hidden="true" />

          <span className="text-caption text-text-muted tabular-nums">
            {totalCount} {totalCount === 1 ? "clip" : "clips"}
          </span>
        </div>
      </div>

      {/* Upload */}
      <MediaDropzone
        accept="audio/mpeg,audio/wav,audio/aac"
        hint={`${getMediaLimitLabel("audio")} · MP3, WAV or AAC`}
        onFilesSelected={handleFiles}
      />

      {/* Upload state */}
      {uploadingCount > 0 && (
        <div className="border-border bg-card-hover/30 flex items-center gap-3 rounded-lg border px-4 py-3">
          <Loader2 className="text-primary size-4 shrink-0 animate-spin" aria-hidden="true" />

          <div className="min-w-0">
            <p className="text-body-sm text-text-primary font-medium">
              {uploadingCount === 1
                ? "Uploading audio clip..."
                : `Uploading ${uploadingCount} audio clips...`}
            </p>

            <p className="text-caption text-text-subtle mt-0.5">
              Keep this page open until the upload finishes.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {audioClips.length === 0 && uploadingCount === 0 && (
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
          <div className="bg-card-hover mb-3 flex size-10 items-center justify-center rounded-full">
            <Music className="text-text-subtle size-4" aria-hidden="true" />
          </div>

          <p className="text-body-sm text-text-primary font-medium">No engine audio yet</p>

          <p className="text-caption text-text-subtle mt-1 max-w-sm">
            Upload a cold start, rev, or exhaust recording to capture the sound of the vehicle.
          </p>
        </div>
      )}

      {/* Audio clips */}
      {audioClips.length > 0 && (
        <div className="flex flex-col gap-3">
          {audioClips.map((clip, index) => (
            <AudioClipCard
              key={clip.id}
              clip={clip}
              index={index}
              onTitleChange={(title) => void handleTitleChange(clip.id, title)}
              onTypeChange={(subtype) => void handleTypeChange(clip.id, subtype)}
              onDelete={() => setPendingDeleteId(clip.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this audio clip?"
        description="This audio recording will be permanently removed from the vehicle."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

function AudioClipCard({
  clip,
  index,
  onTitleChange,
  onTypeChange,
  onDelete,
}: {
  clip: CarMedia;
  index: number;
  onTitleChange: (title: string) => void;
  onTypeChange: (subtype: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="flex flex-col gap-4">
        {/* Clip header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Volume2 className="size-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-body-sm text-text-primary truncate font-medium">
                {clip.title?.trim() || `Audio clip ${index + 1}`}
              </p>

              <p className="text-caption text-text-subtle mt-0.5">
                {clip.subtype ?? "Cold Start"} · Clip {index + 1}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Delete audio clip"
            onClick={onDelete}
            className="text-text-muted hover:bg-danger/10 hover:text-danger flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Player */}
        <div className="border-border/70 bg-card-hover/30 rounded-lg border px-3 py-2.5">
          <audio src={clip.url} controls preload="metadata" className="block h-10 w-full" />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <Input
            label="Audio Title"
            defaultValue={clip.title ?? ""}
            placeholder="e.g. Cold start from rear"
            onBlur={(event) => onTitleChange(event.target.value)}
          />

          <Select
            label="Sound Type"
            value={clip.subtype ?? "Cold Start"}
            onChange={(event) => onTypeChange(event.target.value)}
            options={AUDIO_TYPE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
