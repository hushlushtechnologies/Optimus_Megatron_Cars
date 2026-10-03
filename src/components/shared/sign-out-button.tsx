"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { logout } from "@/app/admin/log-out-actions";

export function SignOutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" leftIcon={<LogOut className="size-4" />}>
        Sign Out
      </Button>
    </form>
  );
}
