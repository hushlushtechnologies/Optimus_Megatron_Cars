"use client";

import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useActiveSection } from "@/src/hooks/use-active-section";
import { ADD_CAR_SECTIONS } from "@/src/config/add-car-sections";
import { cn } from "@/src/lib/utils/cn";

interface AddCarShellProps {
  children: ReactNode;
  mode: "create" | "edit";
  isPublished: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSaveChanges: () => void;
  isSavingDraft: boolean;
  isPublishing: boolean;
  isSavingChanges: boolean;
  isDraftSaved: boolean;
  canPublish: boolean;
}

export function AddCarShell({
  children,
  mode,
  isPublished,
  onSaveDraft,
  onPublish,
  onSaveChanges,
  isSavingDraft,
  isPublishing,
  isSavingChanges,
  isDraftSaved,
  canPublish,
}: AddCarShellProps) {
  const activeId = useActiveSection(ADD_CAR_SECTIONS.map((section) => section.id));

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const showSingleSaveButton = mode === "edit" && isPublished;

  const statusMessage = showSingleSaveButton
    ? "Changes will update the published vehicle when saved."
    : isDraftSaved
      ? "Draft saved. You can continue editing or return later."
      : "Your latest changes haven't been saved yet.";

  return (
    <div className="flex flex-col gap-5 pb-36 lg:flex-row lg:items-start lg:gap-6 lg:pb-28">
      {/* Mobile navigation */}
      <nav
        aria-label="Vehicle form sections"
        className="scrollbar-hidden -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden"
      >
        {ADD_CAR_SECTIONS.map((section, index) => {
          const isActive = activeId === section.id && section.isBuilt;

          return (
            <button
              key={section.id}
              type="button"
              disabled={!section.isBuilt}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "text-body-sm inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 transition-colors duration-150",
                isActive
                  ? "border-primary/40 bg-primary/10 text-text-primary font-medium"
                  : "border-border bg-card text-text-muted hover:border-text-subtle/40 hover:text-text-primary",
                !section.isBuilt && "border-border bg-card text-text-subtle cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn("text-[10px] tabular-nums", isActive ? "text-primary" : "text-text-subtle")}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              {section.label}

              {!section.isBuilt && <Lock className="text-text-subtle size-3" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {/* Desktop navigation */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav
          aria-label="Vehicle form sections"
          className="border-border bg-card sticky top-20 overflow-hidden rounded-lg border p-2"
        >
          <div className="mb-2 px-2.5 pt-1 pb-2">
            <p className="text-label">Vehicle Details</p>
            <p className="text-caption text-text-subtle mt-1">Jump to a section</p>
          </div>

          <div className="bg-border/70 h-px" />

          <div className="mt-2 flex flex-col gap-0.5">
            {ADD_CAR_SECTIONS.map((section, index) => {
              const isActive = activeId === section.id && section.isBuilt;

              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={!section.isBuilt}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "group relative flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-150",
                    isActive
                      ? "bg-card-hover text-text-primary"
                      : "text-text-muted hover:bg-card-hover/70 hover:text-text-primary",
                    !section.isBuilt &&
                      "text-text-subtle hover:text-text-subtle cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  {isActive && (
                    <span
                      className="bg-primary absolute inset-y-2 left-0 w-0.5 rounded-full"
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className={cn(
                      "w-5 shrink-0 text-[10px] tabular-nums",
                      isActive ? "text-primary" : "text-text-subtle",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="text-body-sm min-w-0 flex-1 truncate">{section.label}</span>

                  {section.isBuilt ? (
                    isActive && (
                      <Check
                        className="text-primary size-3.5 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    )
                  ) : (
                    <Lock className="text-text-subtle size-3 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Form content */}
      <main className="min-w-0 flex-1 space-y-6">{children}</main>

      {/* Persistent actions */}
      <div className="fixed inset-x-3 bottom-3 z-30 lg:right-4 lg:left-[calc(224px+2rem)]">
        <div className="border-border bg-card shadow-soft-lg mx-auto flex max-w-[1000px] flex-col gap-3 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                showSingleSaveButton || isDraftSaved ? "bg-success" : "bg-warning",
              )}
              aria-hidden="true"
            />

            <p className="text-body-sm text-text-muted truncate">{statusMessage}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showSingleSaveButton ? (
              <Button onClick={onSaveChanges} isLoading={isSavingChanges} className="w-full sm:w-auto">
                Save Changes
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={onSaveDraft}
                  isLoading={isSavingDraft}
                  className="flex-1 sm:flex-none"
                >
                  Save Draft
                </Button>

                <Button
                  onClick={onPublish}
                  isLoading={isPublishing}
                  disabled={!canPublish}
                  title={canPublish ? undefined : "Save this vehicle as a draft first"}
                  className="flex-1 sm:flex-none"
                >
                  Save &amp; Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
