"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { slugify } from "@/src/lib/utils/slugify";
import { addCarDraftSchema, getPublishBlockers, type AddCarDraftValues } from "@/src/lib/validation/car";

function mapSaveError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    if (error.message.includes("stock_id")) return "This Stock ID is already in use by another vehicle.";
    if (error.message.includes("vin")) return "This VIN is already in use by another vehicle.";
    if (error.message.includes("slug")) return "This slug is already in use by another vehicle.";
    return "This vehicle conflicts with an existing record.";
  }
  if (error.code === "23514") {
    return "Available Units cannot exceed Total Units.";
  }
  console.error("Car save error:", error);
  return "Unable to save this vehicle. Please try again.";
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeCarId?: string,
): Promise<string> {
  const cleanBase = slugify(base) || "vehicle";
  let candidate = cleanBase;

  for (let attempt = 0; attempt < 5; attempt++) {
    let query = supabase.from("cars").select("id").eq("slug", candidate);
    if (excludeCarId) query = query.neq("id", excludeCarId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${cleanBase}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${cleanBase}-${Date.now()}`;
}

// Authoritative check: queries car_media directly rather than trusting
// client-side state, which goes stale the moment MediaSection manages its
// own internal state without reporting back to the parent form.
async function hasAtLeastOneImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  carId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from("car_media")
    .select("*", { count: "exact", head: true })
    .eq("car_id", carId)
    .eq("media_type", "image");
  return (count ?? 0) > 0;
}

function cleanDraftValues(values: AddCarDraftValues) {
  const uuidOrEnumKeys: (keyof AddCarDraftValues & string)[] = [
    "variant_id",
    "collection_id",
    "car_condition",
    "regional_spec",
    "fuel_type_id",
    "transmission_id",
    "drive_type_id",
    "body_type_id",
    "paint_finish_id",
    "promotion_id",
    "warranty_type_id",
  ];
  const cleaned: Record<string, unknown> = { ...values };
  for (const key of uuidOrEnumKeys) {
    if (cleaned[key] === "") cleaned[key] = null;
  }
  if (cleaned.vin === "") cleaned.vin = null;

  const dateKeys: (keyof AddCarDraftValues & string)[] = [
    "warranty_start_date",
    "warranty_expiry_date",
    "inspection_date",
    "publish_date",
  ];
  for (const key of dateKeys) {
    if (cleaned[key] === "") cleaned[key] = null;
  }

  return cleaned;
}

export async function saveCarDraft(carId: string | null, values: AddCarDraftValues) {
  const parsed = addCarDraftSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", carId: null };
  }

  const supabase = await createClient();
  const cleaned = cleanDraftValues(parsed.data);

  if (!carId) {
    const { data: draftStatus } = await supabase
      .from("vehicle_statuses")
      .select("id")
      .eq("category", "publishing")
      .eq("slug", "draft")
      .single();

    const slug = await generateUniqueSlug(supabase, parsed.data.display_title);

    const { data, error } = await supabase
      .from("cars")
      .insert({ ...cleaned, slug, publishing_status_id: draftStatus?.id })
      .select("id")
      .single();

    if (error) return { error: mapSaveError(error), carId: null };

    revalidatePath("/admin/inventory");
    return { error: null, carId: data.id };
  }

  const { error } = await supabase.from("cars").update(cleaned).eq("id", carId);
  if (error) return { error: mapSaveError(error), carId };

  revalidatePath("/admin/inventory");
  return { error: null, carId };
}

interface SaveOptions {
  publish?: boolean;
  /**
   * @deprecated No longer used for the actual blocker check — kept only so
   * existing call sites don't need to change their props. The real check
   * (hasAtLeastOneImage) queries car_media directly, server-side, which is
   * always accurate regardless of whatever the client's local state thinks.
   */
  hasImages?: boolean;
}

export async function saveCarRecord(
  carId: string | null,
  values: AddCarDraftValues,
  options: SaveOptions = {},
) {
  const parsed = addCarDraftSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      carId: null,
      blockers: [] as string[],
    };
  }

  const supabase = await createClient();

  if (options.publish) {
    // carId is always present by this point in practice — the Publish
    // button is disabled until a first Save Draft succeeds and assigns one.
    // Fall back to false only in the (should-be-impossible) case it's null.
    const hasImages = carId ? await hasAtLeastOneImage(supabase, carId) : false;
    const blockers = getPublishBlockers(parsed.data, hasImages);
    if (blockers.length > 0) {
      return {
        error: "This vehicle isn't ready to publish yet.",
        carId,
        blockers,
      };
    }
  }

  const cleaned = cleanDraftValues(parsed.data);

  if (options.publish) {
    const { data: publishedStatus } = await supabase
      .from("vehicle_statuses")
      .select("id")
      .eq("category", "publishing")
      .eq("slug", "published")
      .single();
    cleaned.publishing_status_id = publishedStatus?.id;
    if (!cleaned.publish_date) cleaned.publish_date = new Date().toISOString().slice(0, 10);
  }

  if (!carId) {
    const { data: draftStatus } = await supabase
      .from("vehicle_statuses")
      .select("id")
      .eq("category", "publishing")
      .eq("slug", "draft")
      .single();

    const slug = await generateUniqueSlug(supabase, parsed.data.slug || parsed.data.display_title);

    const { data, error } = await supabase
      .from("cars")
      .insert({
        ...cleaned,
        slug,
        publishing_status_id: options.publish ? cleaned.publishing_status_id : draftStatus?.id,
      })
      .select("id")
      .single();

    if (error) return { error: mapSaveError(error), carId: null, blockers: [] };

    revalidatePath("/admin/inventory");
    return { error: null, carId: data.id, blockers: [] };
  }

  const slug = await generateUniqueSlug(supabase, parsed.data.slug || parsed.data.display_title, carId);
  const { error } = await supabase
    .from("cars")
    .update({ ...cleaned, slug })
    .eq("id", carId);
  if (error) return { error: mapSaveError(error), carId, blockers: [] };

  revalidatePath("/admin/inventory");
  return { error: null, carId, blockers: [] };
}

export async function createBrand(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({ name, slug: slugify(name) })
    .select("id, name")
    .single();

  if (error)
    return {
      error: "Unable to create brand. It may already exist.",
      brand: null,
    };
  return { error: null, brand: data };
}

export async function createModel(brandId: string, name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("models")
    .insert({ brand_id: brandId, name, slug: slugify(name) })
    .select("id, name, brand_id")
    .single();

  if (error)
    return {
      error: "Unable to create model. It may already exist for this brand.",
      model: null,
    };
  return { error: null, model: data };
}

export async function createVariant(modelId: string, name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("variants")
    .insert({ model_id: modelId, name })
    .select("id, name, model_id")
    .single();

  if (error)
    return {
      error: "Unable to create variant. It may already exist for this model.",
      variant: null,
    };
  return { error: null, variant: data };
}
