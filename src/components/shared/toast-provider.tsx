"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/src/hooks/use-theme";

export function ToastProvider() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}
