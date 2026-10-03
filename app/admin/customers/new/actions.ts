"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { addCustomerSchema, normalizeUaePhone, type AddCustomerValues } from "@/src/lib/validation/customer";

function mapSaveError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    if (error.message.includes("email")) return "A customer with this email already exists.";
    return "This customer conflicts with an existing record.";
  }
  console.error("Customer save error:", error);
  return "Unable to save this customer. Please try again.";
}

export async function createCustomer(values: AddCustomerValues, tagIds: string[]) {
  const parsed = addCustomerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", customerId: null };
  }

  const supabase = await createClient();
  const phone = normalizeUaePhone(parsed.data.phone);

  let userId: string | null = null;
  let accountStatus: "No Account" | "Pending Setup" = "No Account";

  if (parsed.data.create_login) {
    const adminClient = createAdminClient();
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      parsed.data.email,
    );

    if (inviteError) {
      return {
        error: inviteError.message.includes("already been registered")
          ? "A login account already exists for this email address."
          : "Unable to create a login account for this customer. Please try again.",
        customerId: null,
      };
    }

    userId = invited.user.id;
    accountStatus = "Pending Setup";
  }

  const { data: customer, error } = await supabase
    .from("customer_profiles")
    .insert({
      user_id: userId,
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
      account_status: accountStatus,
      primary_relationship_manager_id: parsed.data.primary_relationship_manager_id || null,
    })
    .select("id")
    .single();

  if (error) {
    // If the customer row failed but we already created an auth user, remove
    // the orphaned auth user rather than leaving a login with no profile.
    if (userId) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(userId);
    }
    return { error: mapSaveError(error), customerId: null };
  }

  if (parsed.data.internal_notes?.trim()) {
    await supabase.from("customer_notes").insert({
      customer_id: customer.id,
      note_text: parsed.data.internal_notes.trim(),
    });
  }

  if (tagIds.length > 0) {
    await supabase
      .from("customer_tag_links")
      .insert(tagIds.map((tagId) => ({ customer_id: customer.id, tag_id: tagId })));
  }

  revalidatePath("/admin/customers");
  return { error: null, customerId: customer.id };
}
