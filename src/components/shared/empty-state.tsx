"use client";

import { useRouter } from "next/navigation";

import { ArrowRight, Plus } from "lucide-react";

import { EmptyStateVisual, type EmptyStateVisualIcon } from "@/src/components/shared/empty-state-visual";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/cn";

/* =========================================================
   TYPES
========================================================= */

export type EmptyStateIcon = EmptyStateVisualIcon;

interface EmptyStateProps {
  title: string;

  description?: string;

  icon?: EmptyStateIcon;

  action?: {
    label: string;
    href: string;
  };

  /**
   * Controls the amount of vertical space.
   *
   * compact:
   * Used inside smaller panels.
   *
   * default:
   * Used for inventory tables and primary empty states.
   */
  size?: "compact" | "default";

  className?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export function EmptyState({
  title,
  description,
  icon = "Inbox",
  action,
  size = "default",
  className,
}: EmptyStateProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        `relative flex min-w-0 flex-col items-center justify-center overflow-hidden text-center`,

        size === "compact" ? "px-5 py-10" : `min-h-[360px] px-5 py-12 sm:px-8 sm:py-14`,

        className,
      )}
    >
      {/* ===================================================
          VERY SUBTLE BACKGROUND
      =================================================== */}

      <div
        aria-hidden="true"
        className="bg-primary/[0.025] pointer-events-none absolute top-[42%] left-1/2 h-32 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="relative z-10 flex w-full max-w-[390px] flex-col items-center">
        {/* Illustration */}

        <EmptyStateVisual icon={icon} className={cn(size === "compact" && "scale-90")} />

        {/* ===============================================
            COPY
        =============================================== */}

        <div
          className={cn(
            `flex flex-col items-center`,

            size === "compact" ? "mt-1" : "mt-2",
          )}
        >
          <h3 className="text-text-primary text-[14px] leading-5 font-semibold tracking-[-0.01em] sm:text-[15px]">
            {title}
          </h3>

          {description && (
            <p className="text-text-muted mt-1.5 max-w-[340px] text-[11px] leading-[1.6] sm:text-[12px]">
              {description}
            </p>
          )}
        </div>

        {/* ===============================================
            ACTION
        =============================================== */}

        {action && (
          <div className="mt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(action.href)}
              className="group border-border h-9 rounded-md border px-3.5 text-[11px] font-medium"
            >
              <Plus className="text-text-muted mr-1.5 size-3.5" strokeWidth={1.8} aria-hidden="true" />

              {action.label}

              <ArrowRight
                className="text-text-subtle ml-1.5 size-3 transition-transform duration-150 group-hover:translate-x-0.5"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
