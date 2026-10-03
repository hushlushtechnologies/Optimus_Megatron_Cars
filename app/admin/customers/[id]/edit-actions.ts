"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import { addCustomerSchema, normalizeUaePhone, type AddCustomerValues } from "@/src/lib/validation/customer";
import { addCustomerTag, removeCustomerTag } from "@/app/admin/customers/[id]/tags-actions";

function mapSaveError(error: { code?: string; message: string }): string {
  if (error.code === "23505" && error.message.includes("email")) {
    return "Another customer already uses this email address.";
  }
  console.error("Customer update error:", error);
  return "Unable to update this customer. Please try again.";
}

export async function updateCustomer(customerId: string, values: AddCustomerValues, tagIds: string[]) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const parsed = addCustomerSchema.safeParse(values);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("customer_profiles")
    .select("lifecycle_status, source_id, source:customer_sources(name)")
    .eq("id", customerId)
    .single();

  const { data: existingEmail } = await supabase
    .from("customer_profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .neq("id", customerId)
    .maybeSingle();

  if (existingEmail) {
    return { error: "Another customer already uses this email address." };
  }

  const phone = normalizeUaePhone(parsed.data.phone);

  const { error } = await supabase
    .from("customer_profiles")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      phone,
      alternative_phone: parsed.data.alternative_phone || null,
      location_id: parsed.data.location_id || null,
      address: parsed.data.address || null,
      preferred_language: parsed.data.preferred_language,
      source_id: parsed.data.source_id,
      source_detail: parsed.data.source_detail || null,
      lifecycle_status: parsed.data.lifecycle_status,
      primary_relationship_manager_id: parsed.data.primary_relationship_manager_id || null,
    })
    .eq("id", customerId);

  if (error) return { error: mapSaveError(error) };

  // Auditable-field logging — only the two fields Phase 18's list names explicitly.
  if (before && before.lifecycle_status !== parsed.data.lifecycle_status) {
    await supabase.from("customer_activity").insert({
      customer_id: customerId,
      activity_type: "status_changed",
      old_value: before.lifecycle_status,
      new_value: parsed.data.lifecycle_status,
      description: `Customer status changed from ${before.lifecycle_status} to ${parsed.data.lifecycle_status}`,
    });
  }

  if (before && before.source_id !== parsed.data.source_id) {
    const { data: newSource } = await supabase
      .from("customer_sources")
      .select("name")
      .eq("id", parsed.data.source_id)
      .single();
    const oldSourceName = (before.source as unknown as { name: string } | null)?.name ?? "None";
    await supabase.from("customer_activity").insert({
      customer_id: customerId,
      activity_type: "source_changed",
      old_value: oldSourceName,
      new_value: newSource?.name ?? "Unknown",
      description: `Source changed from ${oldSourceName} to ${newSource?.name ?? "Unknown"}`,
    });
  }

  // Diff and sync tags, reusing Phase 8's actions so each change is logged individually.
  const { data: currentLinks } = await supabase
    .from("customer_tag_links")
    .select("tag_id")
    .eq("customer_id", customerId);
  const currentTagIds = (currentLinks ?? []).map((l) => l.tag_id);
  const toAdd = tagIds.filter((id) => !currentTagIds.includes(id));
  const toRemove = currentTagIds.filter((id) => !tagIds.includes(id));

  await Promise.all([
    ...toAdd.map((tagId) => addCustomerTag(customerId, tagId)),
    ...toRemove.map((tagId) => removeCustomerTag(customerId, tagId)),
  ]);

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { error: null };
}
