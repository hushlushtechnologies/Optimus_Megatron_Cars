"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { assertCanManageCustomers, assertCanDeleteCustomers } from "@/src/lib/supabase/customer-permissions";

async function logBulk(customerIds: string[], activityType: string, description: string) {
  const supabase = await createClient();
  await supabase
    .from("customer_activity")
    .insert(customerIds.map((customer_id) => ({ customer_id, activity_type: activityType, description })));
}

export async function bulkAddTag(customerIds: string[], tagId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { data: tag } = await supabase.from("customer_tags").select("name").eq("id", tagId).single();

  // Skip customers who already have this tag rather than erroring on the unique constraint.
  const { data: existing } = await supabase
    .from("customer_tag_links")
    .select("customer_id")
    .eq("tag_id", tagId)
    .in("customer_id", customerIds);
  const alreadyTagged = new Set((existing ?? []).map((r) => r.customer_id));
  const toInsert = customerIds.filter((id) => !alreadyTagged.has(id));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("customer_tag_links")
      .insert(toInsert.map((customer_id) => ({ customer_id, tag_id: tagId })));
    if (error) {
      console.error("bulkAddTag error:", error);
      return { error: "Unable to add tag to the selected customers. Please try again." };
    }
    await logBulk(toInsert, "tag_added", `Tag added: ${tag?.name ?? "Unknown"}`);
  }

  revalidatePath("/admin/customers");
  return { error: null };
}

export async function bulkChangeStatus(customerIds: string[], status: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_profiles")
    .update({ lifecycle_status: status })
    .in("id", customerIds);
  if (error) {
    console.error("bulkChangeStatus error:", error);
    return { error: "Unable to update status for the selected customers. Please try again." };
  }

  await logBulk(customerIds, "status_changed", `Customer status changed to ${status}`);
  revalidatePath("/admin/customers");
  return { error: null };
}

export async function bulkAssignPrm(customerIds: string[], staffId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { data: staff } = await supabase.from("profiles").select("full_name").eq("id", staffId).single();

  const { error } = await supabase
    .from("customer_profiles")
    .update({ primary_relationship_manager_id: staffId })
    .in("id", customerIds);
  if (error) {
    console.error("bulkAssignPrm error:", error);
    return { error: "Unable to assign Primary Relationship Manager. Please try again." };
  }

  await logBulk(
    customerIds,
    "prm_changed",
    `Primary Relationship Manager changed to ${staff?.full_name ?? "Unknown"}`,
  );
  revalidatePath("/admin/customers");
  return { error: null };
}

export async function bulkDisableAccount(customerIds: string[]) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customer_profiles")
    .select("id, user_id")
    .in("id", customerIds)
    .not("user_id", "is", null);

  const eligible = customers ?? [];
  if (eligible.length === 0) {
    return { error: "None of the selected customers have a login account to disable." };
  }

  const adminClient = createAdminClient();
  const results = await Promise.all(
    eligible.map(async (c) => {
      const { error } = await adminClient.auth.admin.updateUserById(c.user_id!, { ban_duration: "876000h" });
      return { id: c.id, ok: !error };
    }),
  );

  const succeeded = results.filter((r) => r.ok).map((r) => r.id);
  const failedCount = results.length - succeeded.length;

  if (succeeded.length > 0) {
    const { error } = await supabase
      .from("customer_profiles")
      .update({ account_status: "Disabled" })
      .in("id", succeeded);
    if (error) {
      console.error("bulkDisableAccount error:", error);
      return { error: "Unable to update account status. Please try again." };
    }
    await logBulk(succeeded, "account_disabled", "Account disabled");
  }

  revalidatePath("/admin/customers");

  const skipped = customerIds.length - eligible.length;
  const parts: string[] = [];
  if (succeeded.length > 0) parts.push(`Disabled ${succeeded.length} account(s)`);
  if (skipped > 0) parts.push(`${skipped} had no account`);
  if (failedCount > 0) parts.push(`${failedCount} failed`);

  return {
    error: succeeded.length === 0 ? "Unable to disable any of the selected accounts." : null,
    summary: parts.join(" · "),
  };
}

export async function bulkArchiveCustomers(customerIds: string[]) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_profiles")
    .update({ archived_at: new Date().toISOString() })
    .in("id", customerIds);
  if (error) {
    console.error("bulkArchiveCustomers error:", error);
    return { error: "Unable to archive the selected customers. Please try again." };
  }

  await Promise.all(
    customerIds.map((customer_id) =>
      supabase.from("customer_activity").insert({
        customer_id,
        activity_type: "archived",
        old_value: "Active",
        new_value: "Archived",
        description: "Customer archived",
      }),
    ),
  );
  revalidatePath("/admin/customers");
  return { error: null };
}

export async function bulkRestoreCustomers(customerIds: string[]) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_profiles")
    .update({ archived_at: null })
    .in("id", customerIds);
  if (error) {
    console.error("bulkRestoreCustomers error:", error);
    return { error: "Unable to restore the selected customers. Please try again." };
  }

  await Promise.all(
    customerIds.map((customer_id) =>
      supabase.from("customer_activity").insert({
        customer_id,
        activity_type: "restored",
        old_value: "Archived",
        new_value: "Active",
        description: "Customer restored",
      }),
    ),
  );
  revalidatePath("/admin/customers");
  return { error: null };
}

export async function deleteCustomers(customerIds: string[]) {
  const permission = await assertCanDeleteCustomers();
  if (!permission.allowed) return { error: permission.error };
  if (customerIds.length === 0) return { error: "No customers selected." };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_profiles").delete().in("id", customerIds);
  if (error) {
    console.error("deleteCustomers error:", error);
    return { error: "Unable to delete the selected customer(s). Please try again." };
  }

  revalidatePath("/admin/customers");
  return { error: null };
}
