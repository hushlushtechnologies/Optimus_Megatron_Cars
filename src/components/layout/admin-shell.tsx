"use client";

import { SidebarContext, useSidebarState } from "@/src/hooks/use-sidebar";
import { AdminSidebarLayout } from "@/src/components/layout/admin-sidebar";
import { AdminTopbar } from "@/src/components/layout/admin-topbar";

interface AdminShellProps {
  userName: string;
  userRole: string;
  userEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ userName, userRole, userEmail, children }: AdminShellProps) {
  const sidebarState = useSidebarState();

  return (
    <SidebarContext.Provider value={sidebarState}>
      <div className="bg-base flex min-h-screen">
        <AdminSidebarLayout userName={userName} userRole={userRole} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar userName={userName} userRole={userRole} userEmail={userEmail} />
          <main id="main-content" tabIndex={-1} className="flex-1 p-3 lg:p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
