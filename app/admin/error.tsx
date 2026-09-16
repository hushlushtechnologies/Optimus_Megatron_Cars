"use client";

import { useEffect } from "react";
import { ErrorState } from "@/src/components/shared/error-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a future sprint, send this to real error monitoring (e.g. Sentry).
    console.error("Admin route error:", error);
  }, [error]);

  return <ErrorState onRetry={reset} />;
}
