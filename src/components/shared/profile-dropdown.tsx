"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCircle,
  Settings,
  HelpCircle,
  Repeat,
  Lock,
  RefreshCw,
  Trash2,
  Wifi,
  LogOut,
} from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { createClient } from "@/src/lib/supabase/client";
import { logout } from "@/app/admin/log-out-actions";

interface ProfileDropdownProps {
  userName: string;
  userRole: string;
  userEmail: string;
}

export function ProfileDropdown({ userName, userRole, userEmail }: ProfileDropdownProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
    toast.success("Application refreshed");
  };

  const handleClearCache = () => {
    // We deliberately keep the theme preference — that's a setting, not "cache".
    const keysToKeep = new Set(["omc-theme"]);
    Object.keys(localStorage)
      .filter((key) => !keysToKeep.has(key))
      .forEach((key) => localStorage.removeItem(key));
    toast.success("Local cache cleared");
  };

  const handleReconnectSession = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      toast.error("Could not reconnect session");
    } else {
      toast.success("Session reconnected");
      router.refresh();
    }
  };

  const handleLockScreen = () => toast.info("Lock Screen is coming in a future sprint");
  const handleChangeUser = () => toast.info("Switch Account is coming in a future sprint");

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Open profile menu"
          className="hover:bg-card-hover flex items-center gap-2 rounded-md p-1 pr-2 transition-colors"
        >
          <span className="bg-primary/15 text-body-sm text-primary flex size-8 items-center justify-center rounded-full font-semibold">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-left lg:block">
            <span className="text-body-sm text-text-primary block">{userName}</span>
            <span className="text-caption block">{userRole}</span>
          </span>
        </button>
      </DropdownTrigger>

      <DropdownContent className="w-64">
        <div className="border-border border-b px-4 py-3">
          <p className="text-body-sm text-text-primary font-medium">{userName}</p>
          <p className="text-caption">{userRole}</p>
          <p className="text-caption text-text-subtle truncate">{userEmail}</p>
        </div>

        <nav aria-label="Profile menu" className="py-1">
          <ProfileMenuLink href="/admin/profile" icon={UserCircle} label="My Profile" />
          <ProfileMenuLink href="/admin/settings" icon={Settings} label="Account Settings" />
          <ProfileMenuLink href="/admin/help" icon={HelpCircle} label="Help & Support" />
          <ProfileMenuButton icon={Repeat} label="Change User / Switch Account" onClick={handleChangeUser} />
          <ProfileMenuButton icon={Lock} label="Lock Screen" onClick={handleLockScreen} />
          <ProfileMenuButton icon={RefreshCw} label="Refresh Application" onClick={handleRefresh} />
          <ProfileMenuButton icon={Trash2} label="Clear Local Cache" onClick={handleClearCache} />
          <ProfileMenuButton icon={Wifi} label="Reconnect Session" onClick={handleReconnectSession} />
        </nav>

        <div className="border-border border-t p-1">
          <form action={logout}>
            <button
              type="submit"
              className="text-body-sm hover:bg-card-hover flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-red-400"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign Out
            </button>
          </form>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

function ProfileMenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="text-body-sm text-text-primary hover:bg-card-hover flex items-center gap-2.5 px-4 py-2"
    >
      <Icon className="text-text-muted size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function ProfileMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
    >
      <Icon className="text-text-muted size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
