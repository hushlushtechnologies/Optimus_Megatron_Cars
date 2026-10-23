import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/lib/supabase/get-profiles";
import { AdminShell } from "@/src/components/layout/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  const roleName = (profile?.roles as unknown as { name: string } | null)?.name ?? null;

  if (!profile || !roleName) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div role="alert" className="surface-card max-w-md p-6 text-center">
          <p className="text-body text-text-primary font-medium">
            Your account doesn&apos;t have access to the admin area.
          </p>
          <p className="text-body-sm text-text-muted mt-1">
            Ask an administrator to give your account a role. If you should already have access, refresh the
            page and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell userName={profile.full_name || "Admin"} userRole={roleName} userEmail={user.email ?? ""}>
      {children}
    </AdminShell>
  );
}
