"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEST_DRIVE_VIEW_COOKIE, type TestDriveView } from "@/src/lib/utils/test-drive-view";

export type { TestDriveView };

export function useTestDriveView(initialView: TestDriveView) {
  const router = useRouter();
  const [view, setViewState] = useState<TestDriveView>(initialView);
  const [isPending, startTransition] = useTransition();

  const setView = (next: TestDriveView) => {
    if (next === view) return;
    setViewState(next);
    // A cookie (not localStorage) so the server can see it on the next
    // request, then a refresh to load only the newly chosen view's data.
    document.cookie = `${TEST_DRIVE_VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return { view, setView, isPending };
}
