"use client";

import { Lock, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useActiveSection } from "@/src/hooks/use-active-section";
import { ADD_CAR_SECTIONS } from "@/src/config/add-car-sections";
import { cn } from "@/src/lib/utils/cn";

interface AddCarShellProps {
  children: React.ReactNode;
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
  const activeId = useActiveSection(ADD_CAR_SECTIONS.map((s) => s.id));

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showSingleSaveButton = mode === "edit" && isPublished;

  return (
    <div className="flex flex-col gap-4 pb-28 lg:flex-row lg:gap-6">
      <nav aria-label="Add Car sections" className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:hidden">
        {ADD_CAR_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            disabled={!section.isBuilt}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "text-body-sm shrink-0 rounded-full border px-3 py-1.5 transition-colors",
              activeId === section.id
                ? "border-primary bg-primary/10 text-primary-text"
                : "border-border text-text-muted",
              !section.isBuilt && "opacity-50",
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <nav aria-label="Add Car sections" className="hidden w-56 shrink-0 lg:block">
        <div className="surface-card sticky top-20 flex flex-col gap-0.5 p-2">
          {ADD_CAR_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              disabled={!section.isBuilt}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "text-body-sm flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors",
                activeId === section.id && section.isBuilt
                  ? "bg-primary/10 text-primary-text"
                  : "text-text-muted hover:bg-card-hover hover:text-text-primary",
                !section.isBuilt &&
                  "hover:text-text-muted cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              {section.label}
              {section.isBuilt ? (
                activeId === section.id && <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Lock className="text-text-subtle size-3" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 space-y-6">{children}</div>

      <div className="glass-panel fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:inset-x-auto lg:right-4 lg:left-[calc(224px+2rem)]">
        <p className="text-body-sm text-text-muted">
          {showSingleSaveButton
            ? "Editing a published vehicle — changes go live as soon as you save."
            : isDraftSaved
              ? "Draft saved — keep going or come back later."
              : "Your progress isn't saved yet."}
        </p>
        <div className="flex items-center gap-2">
          {showSingleSaveButton ? (
            <Button onClick={onSaveChanges} isLoading={isSavingChanges}>
              Save Changes
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onSaveDraft} isLoading={isSavingDraft}>
                Save Draft
              </Button>
              <Button
                onClick={onPublish}
                isLoading={isPublishing}
                disabled={!canPublish}
                title={canPublish ? undefined : "Save this vehicle as a draft first"}
              >
                Save &amp; Publish
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
