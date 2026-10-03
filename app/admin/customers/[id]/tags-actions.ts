"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

export async function addCustomerTag(customerId: string, tagId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_tag_links").insert({ customer_id: customerId, tag_id: tagId });

  if (error) {
    console.error("addCustomerTag error:", error);
    return { error: "Unable to add tag. Please try again." };
  }

  const { data: tag } = await supabase.from("customer_tags").select("name").eq("id", tagId).single();
  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: "tag_added",
    description: `Tag added: ${tag?.name ?? "Unknown"}`,
  });

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}

export async function removeCustomerTag(customerId: string, tagId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();
  const { data: tag } = await supabase.from("customer_tags").select("name").eq("id", tagId).single();

  const { error } = await supabase
    .from("customer_tag_links")
    .delete()
    .eq("customer_id", customerId)
    .eq("tag_id", tagId);

  if (error) {
    console.error("removeCustomerTag error:", error);
    return { error: "Unable to remove tag. Please try again." };
  }

  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: "tag_removed",
    description: `Tag removed: ${tag?.name ?? "Unknown"}`,
  });

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}