"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEAD_VIEW_COOKIE, type LeadView } from "@/src/lib/utils/lead-view";

export type { LeadView };

export function useLeadView(initialView: LeadView) {
  const router = useRouter();
  const [view, setViewState] = useState<LeadView>(initialView);
  const [isPending, startTransition] = useTransition();

  const setView = (next: LeadView) => {
    if (next === view) return;
    setViewState(next);
    // A cookie (not localStorage) so the server can see it on the next
    // request, then a refresh to fetch only the newly chosen view's data.
    document.cookie = `${LEAD_VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return { view, setView, isPending };
}
