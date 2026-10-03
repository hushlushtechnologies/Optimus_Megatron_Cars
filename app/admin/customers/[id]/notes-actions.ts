"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import type { CustomerNote } from "@/src/lib/types/customer";

const ELEVATED_ROLES = ["Super Admin", "Admin", "Manager"];

async function assertCanModifyNote(noteId: string): Promise<{ allowed: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false, error: "You must be signed in to do this." };

  const [{ data: note }, { data: profile }] = await Promise.all([
    supabase.from("customer_notes").select("created_by").eq("id", noteId).single(),
    supabase.from("profiles").select("roles(name)").eq("id", user.id).single(),
  ]);

  const roleName = (profile?.roles as unknown as { name: string } | null)?.name;
  const isOwner = note?.created_by === user.id;
  const isElevated = !!roleName && ELEVATED_ROLES.includes(roleName);

  if (!isOwner && !isElevated) {
    return { allowed: false, error: "You can only edit or archive notes you created." };
  }
  return { allowed: true, error: null };
}

export async function createNote(customerId: string, noteText: string, isInternal: boolean) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error, note: undefined };

  if (!noteText.trim()) return { error: "Note cannot be empty.", note: undefined };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_notes")
    .insert({ customer_id: customerId, note_text: noteText.trim(), is_internal: isInternal })
    .select("*")
    .single();

  if (error) {
    console.error("createNote error:", error);
    return { error: "Unable to add note. Please try again.", note: undefined };
  }

  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: "note_added",
    description: "Note added",
  });

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null, note: data as CustomerNote };
}

export async function updateNote(noteId: string, customerId: string, noteText: string) {
  const permission = await assertCanModifyNote(noteId);
  if (!permission.allowed) return { error: permission.error };

  if (!noteText.trim()) return { error: "Note cannot be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("customer_notes")
    .update({ note_text: noteText.trim(), updated_at: new Date().toISOString(), updated_by: user?.id })
    .eq("id", noteId);

  if (error) {
    console.error("updateNote error:", error);
    return { error: "Unable to update note. Please try again." };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}

export async function archiveNote(noteId: string, customerId: string) {
  const permission = await assertCanModifyNote(noteId);
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_notes").update({ is_archived: true }).eq("id", noteId);

  if (error) {
    console.error("archiveNote error:", error);
    return { error: "Unable to archive note. Please try again." };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}
