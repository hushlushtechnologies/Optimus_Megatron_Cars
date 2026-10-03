import { createClient } from "@/src/lib/supabase/server";

const CUSTOMER_MANAGER_ROLES = ["Super Admin", "Admin", "Manager", "Sales Executive"];

export async function assertCanManageCustomers(): Promise<{
  allowed: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, error: "You must be signed in to do this." };
  }

  const { data: profile } = await supabase.from("profiles").select("roles(name)").eq("id", user.id).single();
  const roleName = (profile?.roles as unknown as { name: string } | null)?.name;

  if (!roleName || !CUSTOMER_MANAGER_ROLES.includes(roleName)) {
    return {
      allowed: false,
      error: "You don't have permission to perform this action.",
    };
  }

  return { allowed: true, error: null };
}
