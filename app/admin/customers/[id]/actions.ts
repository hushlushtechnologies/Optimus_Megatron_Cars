"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

async function logActivity(customerId: string, activityType: string, description: string) {
  const supabase = await createClient();
  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: activityType,
    description,
  });
}

export async function activateAccount(customerId: string, userId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (authError) {
    console.error("activateAccount auth error:", authError);
    return { error: "Unable to activate this account. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_profiles")
    .update({ account_status: "Active" })
    .eq("id", customerId);
  if (error) {
    console.error("activateAccount error:", error);
    return { error: "Unable to update account status. Please try again." };
  }

  await logActivity(customerId, "account_activated", "Account activated");
  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}

export async function disableAccount(customerId: string, userId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (authError) {
    console.error("disableAccount auth error:", authError);
    return { error: "Unable to disable this account. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_profiles")
    .update({ account_status: "Disabled" })
    .eq("id", customerId);
  if (error) {
    console.error("disableAccount error:", error);
    return { error: "Unable to update account status. Please try again." };
  }

  await logActivity(customerId, "account_disabled", "Account disabled");
  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}

export async function sendPasswordReset(customerId: string, email: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    console.error("sendPasswordReset error:", error);
    return {
      error: "Unable to send the password reset email. Please try again.",
    };
  }

  await logActivity(customerId, "password_reset_sent", "Password reset email sent");
  return { error: null };
}

export async function sendAccountSetupEmail(customerId: string, email: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    console.error("sendAccountSetupEmail error:", inviteError);
    return {
      error: inviteError.message.includes("already been registered")
        ? "A login account already exists for this email address."
        : "Unable to send the account setup email. Please try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_profiles")
    .update({ user_id: invited.user.id, account_status: "Pending Setup" })
    .eq("id", customerId);

  if (error) {
    console.error("sendAccountSetupEmail update error:", error);
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return { error: "Unable to link the new account. Please try again." };
  }

  await logActivity(customerId, "account_setup_sent", "Account setup email sent");
  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}


export async function updatePrimaryRelationshipManager(customerId: string, staffId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("customer_profiles")
    .select("primary_relationship_manager:profiles!customer_profiles_primary_relationship_manager_id_fkey(full_name)")
    .eq("id", customerId)
    .single();
  const { data: after } = await supabase.from("profiles").select("full_name").eq("id", staffId).single();

  const { error } = await supabase
    .from("customer_profiles")
    .update({ primary_relationship_manager_id: staffId })
    .eq("id", customerId);

  if (error) {
    console.error("updatePrimaryRelationshipManager error:", error);
    return { error: "Unable to assign Primary Relationship Manager. Please try again." };
  }

  const previousName = (before?.primary_relationship_manager as unknown as { full_name: string } | null)?.full_name;
  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: "prm_changed",
    old_value: previousName ?? null,
    new_value: after?.full_name ?? null,
    description: `Primary Relationship Manager changed${previousName ? ` from ${previousName}` : ""} to ${after?.full_name ?? "Unknown"}`,
  });

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}
