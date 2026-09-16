import { createClient } from "@/src/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role_id, roles(name)")
    .eq("id", user.id)
    .single();

  return profile;
}
