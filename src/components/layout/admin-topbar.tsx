"use client";

import { Menu } from "lucide-react";

import { useSidebar } from "@/src/hooks/use-sidebar";

import { IconButton } from "@/src/components/ui/icon-button";

import { PageHeading } from "@/src/components/layout/breadcrumps";
import { GlobalSearch } from "@/src/components/layout/global-search";
import { SystemStatus } from "@/src/components/layout/system-status";
import { ThemeToggle } from "@/src/components/layout/theme-toggle";

import { NotificationsDropdown } from "@/src/components/shared/notifications-dropdown";
import { ProfileDropdown } from "@/src/components/shared/profile-dropdown";

interface AdminTopbarProps {
  userName: string;
  userRole: string;
  userEmail: string;
}

export function AdminTopbar({
  userName,
  userRole,
  userEmail,
}: AdminTopbarProps) {
  const { setMobileOpen } = useSidebar();

  return (
    <header
      className="
        sticky
        top-3
        z-30
        mx-3
        mt-3
        flex
        min-h-18
        items-center
        justify-between
        gap-4
        rounded-[22px]
        border
        border-white/8
        bg-base
        px-4
        shadow-[0_18px_60px_rgba(0,0,0,0.28)]
        lg:mx-2
        lg:mr-3
        lg:px-5
      "
    >
      {/* =====================================================
          AMBIENT BACKGROUND DETAILS
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          overflow-hidden
          rounded-[22px]
        "
      >
        {/* Gold glow */}

        <div
          className="
            absolute
            -right-20
            -top-20
            size-44
            rounded-full
            bg-primary/5.5
            blur-3xl
          "
        />

        {/* Blue glow */}

        <div
          className="
            absolute
            -left-16
            -top-20
            size-40
            rounded-full
            bg-blue-500/[0.035]
            blur-3xl
          "
        />

        {/* top metallic highlight */}

        <div
          className="
            absolute
            left-10
            top-0
            h-px
            w-55
            bg-linear-to-r
            from-transparent
            via-primary/32
            to-transparent
          "
        />
      </div>

      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu */}

        <IconButton
          aria-label="Open navigation menu"
          variant="outline"
          size="sm"
          className="
            shrink-0
            border-white/[0.07]
            bg-white/2.5
            lg:hidden
          "
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-4.5" />
        </IconButton>

        {/* Page context */}

        <div className="min-w-0">
          <PageHeading />
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="flex shrink-0 items-center gap-2">
        {/* Search */}

        <div
          className="
            hidden
            md:block
          "
        >
          <GlobalSearch />
        </div>

        {/* Utility cluster */}

        <div
          className="
            flex
            items-center
            gap-1
            rounded-full
            border
            border-border
            bg-card
            px-2.5
            py-0.5
          "
        >
          {/* System status */}

          <div className="hidden xl:block">
            <SystemStatus />
          </div>

          {/* Theme */}

          <ThemeToggle />

          {/* Notifications */}

          <NotificationsDropdown />
        </div>

        {/* Separator */}

        <div
          className="
            mx-1
            hidden
            h-8
            w-px
            bg-linear-to-b
            from-transparent
            via-border
            to-transparent
            sm:block
          "
          aria-hidden="true"
        />

        {/* Profile */}

        <ProfileDropdown
          userName={userName}
          userRole={userRole}
          userEmail={userEmail}
        />
      </div>
    </header>
  );
}
