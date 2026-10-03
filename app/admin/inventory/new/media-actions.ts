"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import type { CarMedia } from "@/src/lib/types/inventory";

interface CreateMediaInput {
  carId: string;
  mediaType: "image" | "video" | "audio";
  url: string;
  storagePath: string;
  title?: string | null;
  subtype?: string | null;
  fileSizeBytes: number;
  isFeatured?: boolean;
}

export async function createCarMediaRecord(input: CreateMediaInput) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("car_media")
    .select("*", { count: "exact", head: true })
    .eq("car_id", input.carId)
    .eq("media_type", input.mediaType);

  const { data, error } = await supabase
    .from("car_media")
    .insert({
      car_id: input.carId,
      media_type: input.mediaType,
      url: input.url,
      title: input.title ?? null,
      subtype: input.subtype ?? null,
      file_size_bytes: input.fileSizeBytes,
      is_featured: input.isFeatured ?? false,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createCarMediaRecord error:", error);
    return {
      error: "Unable to save this file. Please try again.",
      media: null,
    };
  }

  revalidatePath("/admin/inventory");
  return { error: null, media: data as CarMedia };
}

export async function deleteCarMediaRecord(mediaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("car_media").delete().eq("id", mediaId);

  if (error) {
    console.error("deleteCarMediaRecord error:", error);
    return { error: "Unable to delete this file. Please try again." };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function setFeaturedCarImage(carId: string, mediaId: string) {
  const supabase = await createClient();

  await supabase
    .from("car_media")
    .update({ is_featured: false })
    .eq("car_id", carId)
    .eq("media_type", "image");
  const { error } = await supabase.from("car_media").update({ is_featured: true }).eq("id", mediaId);

  if (error) {
    console.error("setFeaturedCarImage error:", error);
    return { error: "Unable to set featured image. Please try again." };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function reorderCarMedia(updates: { id: string; sort_order: number }[]) {
  const supabase = await createClient();

  const results = await Promise.all(
    updates.map((u) => supabase.from("car_media").update({ sort_order: u.sort_order }).eq("id", u.id)),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("reorderCarMedia error:", failed.error);
    return { error: "Unable to save the new order. Please try again." };
  }

  return { error: null };
}

export async function updateCarMediaMeta(
  mediaId: string,
  values: { title?: string | null; subtype?: string | null },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("car_media").update(values).eq("id", mediaId);

  if (error) {
    return { error: "Unable to update this file's details. Please try again." };
  }
  return { error: null };
}
