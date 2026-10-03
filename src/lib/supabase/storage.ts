"use client";

import { createClient } from "@/src/lib/supabase/client";

export type UploadMediaType = "image" | "video" | "audio";

const LIMITS: Record<UploadMediaType, { maxBytes: number; mimeTypes: string[]; label: string }> = {
  image: {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "JPG, PNG, or WebP under 10 MB",
  },
  video: {
    maxBytes: 200 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    label: "MP4, WebM, or MOV under 200 MB",
  },
  audio: {
    maxBytes: 20 * 1024 * 1024,
    mimeTypes: ["audio/mpeg", "audio/wav", "audio/aac"],
    label: "MP3, WAV, or AAC under 20 MB",
  },
};

export function validateMediaFile(file: File, type: UploadMediaType): string | null {
  const rule = LIMITS[type];
  if (!rule.mimeTypes.includes(file.type)) {
    return `"${file.name}" isn't a supported format. Accepted: ${rule.label}.`;
  }
  if (file.size > rule.maxBytes) {
    return `"${file.name}" is too large. Maximum allowed: ${rule.label}.`;
  }
  return null;
}

export async function uploadCarMediaFile(carId: string, file: File, type: UploadMediaType) {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${carId}/${type}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("car-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return {
      url: null,
      error: "Upload failed. Please check your connection and try again.",
    };
  }

  const { data } = supabase.storage.from("car-media").getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

export async function deleteCarMediaFile(path: string) {
  const supabase = createClient();
  await supabase.storage.from("car-media").remove([path]);
}

export function getMediaLimitLabel(type: UploadMediaType) {
  return LIMITS[type].label;
}
