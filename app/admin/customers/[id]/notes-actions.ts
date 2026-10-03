"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import type { CustomerNote } from "@/src/lib/types/customer";

export async function createNote(customerId: string, noteText: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error, note: undefined };

  if (!noteText.trim()) return { error: "Note cannot be empty.", note: undefined };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_notes")
    .insert({ customer_id: customerId, note_text: noteText.trim() })
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

export async function deleteNote(noteId: string, customerId: string) {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) return { error: permission.error };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_notes").delete().eq("id", noteId);

  if (error) {
    console.error("deleteNote error:", error);
    return { error: "Unable to delete note. Please try again." };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}