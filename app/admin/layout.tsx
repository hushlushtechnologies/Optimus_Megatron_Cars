import { createClient } from "@/src/lib/supabase/server";
import { getCurrentProfile } from "@/src/lib/supabase/get-profiles";
import { AdminShell } from "@/src/components/layout/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentProfile();
  const roleName = (profile?.roles as unknown as { name: string } | null)?.name ?? "Unknown";

  return (
    <AdminShell userName={profile?.full_name || "Admin"} userRole={roleName} userEmail={user?.email ?? ""}>
      {children}
    </AdminShell>
  );
}
