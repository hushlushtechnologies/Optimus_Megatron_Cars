"use client";

import { AlertOctagon, WifiOff, type LucideIcon } from "lucide-react";
import { Illustration } from "@/src/components/shared/illustration";
import { Button } from "@/src/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: "generic" | "network";
  onRetry?: () => void;
}

export function ErrorState({ title, description, icon, variant = "generic", onRetry }: ErrorStateProps) {
  const isNetwork = variant === "network";

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Illustration
        lottieSrc="/lottie/error.json"
        fallbackIcon={icon ?? (isNetwork ? WifiOff : AlertOctagon)}
        tone="danger"
      />
      <div className="max-w-sm">
        <h3 className="text-h3">{title ?? (isNetwork ? "Connection issue" : "Something went wrong")}</h3>
        <p className="text-body-sm text-text-muted mt-1">
          {description ??
            (isNetwork
              ? "Check your internet connection and try again."
              : "An unexpected error occurred. Please try again.")}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
