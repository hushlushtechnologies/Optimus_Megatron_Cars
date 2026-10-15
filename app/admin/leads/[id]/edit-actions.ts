"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

const updateLeadSchema = z.object({
  carId: z.string().uuid().nullable(),
  sourceId: z.string().uuid().nullable(),
  sourceDetail: z.string().max(200),
});

export interface LeadEditValues {
  carId: string | null;
  vehicleLabel: string | null;
  sourceId: string | null;
  sourceDetail: string;
}

// The dialog loads the lead's current values itself on open. They're always
// fresh, and it doesn't depend on which fields the page happened to pass down.
export async function getLeadEditValues(leadId: string): Promise<LeadEditValues | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select("car_id, source_id, source_detail, car:cars(display_title, stock_id)")
    .eq("id", leadId)
    .maybeSingle();

  if (!data) return null;

  const car = data.car as unknown as { display_title: string; stock_id: string } | null;

  return {
    carId: data.car_id,
    vehicleLabel: car ? `${car.display_title} · ${car.stock_id}` : null,
    sourceId: data.source_id,
    sourceDetail: data.source_detail ?? "",
  };
}

interface CurrentLeadRow {
  car_id: string | null;
  source_id: string | null;
  source_detail: string | null;
  archived_at: string | null;
  stage: { stage_type: string } | null;
  car: { display_title: string } | null;
  source: { name: string } | null;
}

export async function updateLead(
  leadId: string,
  input: { carId: string | null; sourceId: string | null; sourceDetail: string },
): Promise<{ error: string | null; changed: boolean }> {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error, changed: false };

  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the values and try again.", changed: false };

  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select(
      `car_id, source_id, source_detail, archived_at,
       stage:lead_stages(stage_type),
       car:cars(display_title),
       source:customer_sources(name)`,
    )
    .eq("id", leadId)
    .maybeSingle();

  const current = data as unknown as CurrentLeadRow | null;
  if (!current) return { error: "This lead could not be found.", changed: false };
  if (current.archived_at) return { error: "Restore this lead before editing it.", changed: false };

  const newCarId = parsed.data.carId;
  const newSourceId = parsed.data.sourceId;

  const carChanged = newCarId !== current.car_id;
  if (carChanged && current.stage?.stage_type !== "open") {
    return { error: "The vehicle can't be changed on a closed lead. Reopen it first.", changed: false };
  }

  let newCarTitle: string | null = null;
  if (newCarId && carChanged) {
    const { data: car } = await supabase
      .from("cars")
      .select("display_title")
      .eq("id", newCarId)
      .maybeSingle();
    if (!car) return { error: "That vehicle could not be found.", changed: false };
    newCarTitle = car.display_title;
  }

  let newSourceName: string | null = null;
  let newSourceRequiresDetail = false;
  if (newSourceId) {
    const { data: source } = await supabase
      .from("customer_sources")
      .select("name, requires_detail")
      .eq("id", newSourceId)
      .maybeSingle();
    if (!source) return { error: "That source could not be found.", changed: false };
    newSourceName = source.name;
    newSourceRequiresDetail = source.requires_detail;
  }

  // Detail text only means something for a source that asks for it ("Other").
  const newSourceDetail = newSourceRequiresDetail ? parsed.data.sourceDetail.trim() || null : null;

  const sourceChanged = newSourceId !== current.source_id;
  const detailChanged = newSourceDetail !== (current.source_detail ?? null);

  if (!carChanged && !sourceChanged && !detailChanged) {
    return { error: null, changed: false };
  }

  const update: Record<string, string | null> = {};
  if (carChanged) update.car_id = newCarId;
  if (sourceChanged || detailChanged) {
    update.source_id = newSourceId;
    update.source_detail = newSourceDetail;
  }

  const { error } = await supabase.from("leads").update(update).eq("id", leadId);

  if (error) {
    console.error("updateLead error:", error);
    return { error: "Unable to save your changes. Please try again.", changed: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activities: {
    lead_id: string;
    activity_type: string;
    description: string;
    old_value: string | null;
    new_value: string | null;
    related_car_id: string | null;
    changed_by: string | null;
  }[] = [];

  if (carChanged) {
    const oldTitle = current.car?.display_title ?? null;
    activities.push({
      lead_id: leadId,
      activity_type: "vehicle_changed",
      description:
        oldTitle && newCarTitle
          ? `Vehicle changed from ${oldTitle} to ${newCarTitle}`
          : newCarTitle
            ? `Vehicle linked: ${newCarTitle}`
            : `Vehicle removed: ${oldTitle ?? "previous vehicle"}`,
      old_value: oldTitle,
      new_value: newCarTitle,
      related_car_id: newCarId ?? current.car_id,
      changed_by: user?.id ?? null,
    });
  }

  if (sourceChanged || detailChanged) {
    const oldSourceName = current.source?.name ?? null;
    activities.push({
      lead_id: leadId,
      activity_type: "lead_updated",
      description: sourceChanged
        ? `Source changed from ${oldSourceName ?? "none"} to ${newSourceName ?? "none"}`
        : "Source detail updated",
      old_value: oldSourceName,
      new_value: newSourceName,
      related_car_id: null,
      changed_by: user?.id ?? null,
    });
  }

  const { error: activityError } = await supabase.from("lead_activities").insert(activities);
  if (activityError) console.error("updateLead activity error:", activityError);

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { error: null, changed: true };
}
