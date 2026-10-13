import type { ReactNode } from "react";

export function LeadPipeline({ children }: { children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label="Lead pipeline. Scroll horizontally to see every stage."
      tabIndex={0}
      className="focus-visible:ring-primary flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-md pb-4 focus-visible:ring-2 focus-visible:outline-none sm:snap-none"
    >
      {children}
    </div>
  );
}
