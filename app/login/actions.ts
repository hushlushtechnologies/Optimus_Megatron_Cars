"use server";

import { createClient } from "@/src/lib/supabase/server";
import { loginSchema } from "@/src/lib/validation/auth";

export async function login(values: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid email or password format." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  return { error: null };
}
