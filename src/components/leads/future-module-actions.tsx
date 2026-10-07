import { Car, BookmarkPlus, Landmark, Repeat, ShoppingBag, Lock, type LucideIcon } from "lucide-react";
import type { LeadFutureAction } from "@/src/lib/supabase/lead-lookups";

const ICONS: Record<string, LucideIcon> = {
  Car,
  BookmarkPlus,
  Landmark,
  Repeat,
  ShoppingBag,
};

export function FutureModuleActions({ actions }: { actions: LeadFutureAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="surface-card p-5">
      <p className="text-label mb-1">Next Steps</p>
      <p className="text-caption text-text-subtle mb-4">
        These connect to modules that arent built yet — this lead is already set up to use them the moment
        they are.
      </p>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = ICONS[action.icon_name] ?? Lock;
          return (
            <div
              key={action.id}
              title={`${action.label} — not available yet`}
              aria-disabled="true"
              className="border-border bg-card-hover/40 flex cursor-not-allowed items-start gap-3 rounded-md border border-dashed p-3 opacity-60"
            >
              <span className="bg-card-hover text-text-subtle flex size-8 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-body-sm text-text-primary flex items-center gap-1.5 font-medium">
                  {action.label}
                  <Lock className="text-text-subtle size-3" aria-hidden="true" />
                </p>
                <p className="text-caption text-text-subtle mt-0.5">{action.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
