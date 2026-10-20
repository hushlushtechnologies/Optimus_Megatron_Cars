import Link from "next/link";
import {
  ArrowRight,
  Car,
  BookmarkPlus,
  Landmark,
  Repeat,
  ShoppingBag,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { LeadFutureAction } from "@/src/lib/supabase/lead-lookups";

const ICONS: Record<string, LucideIcon> = {
  Car,
  BookmarkPlus,
  Landmark,
  Repeat,
  ShoppingBag,
};

/** An action whose module exists: either a working link, or a reason it isn't available right now. */
export type LiveLeadAction = { href: string } | { disabledReason: string };

interface FutureModuleActionsProps {
  actions: LeadFutureAction[];
  /** Actions whose module is built, keyed by the action's key. Everything else stays locked. */
  liveActions?: Record<string, LiveLeadAction>;
}

export function FutureModuleActions({ actions, liveActions }: FutureModuleActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="surface-card p-5">
      <p className="text-label mb-1">Next Steps</p>
      <p className="text-caption text-text-subtle mb-4">
        Actions with a lock connect to modules that aren&apos;t built yet. This lead is already set up to use
        them the moment they are.
      </p>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = ICONS[action.icon_name] ?? Lock;
          const live = liveActions?.[action.key];

          if (live && "href" in live) {
            return (
              <Link
                key={action.id}
                href={live.href}
                className="group border-border bg-card hover:border-primary/40 hover:bg-card-hover focus-visible:ring-primary flex items-start gap-3 rounded-md border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
              >
                <span className="bg-primary/15 text-primary-text flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-text-primary flex items-center gap-1.5 font-medium">
                    {action.label}
                    <ArrowRight
                      className="text-text-subtle size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </p>
                  <p className="text-caption text-text-subtle mt-0.5">{action.description}</p>
                </div>
              </Link>
            );
          }

          const reason = live ? live.disabledReason : "not available yet";

          return (
            <div
              key={action.id}
              title={`${action.label}: ${reason}`}
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
                  {/* The tooltip above only works for mouse users. This says the same thing to a screen reader and on touch screens. */}
                  <span className="sr-only">({reason})</span>
                </p>
                <p className="text-caption text-text-subtle mt-0.5">{live ? reason : action.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
