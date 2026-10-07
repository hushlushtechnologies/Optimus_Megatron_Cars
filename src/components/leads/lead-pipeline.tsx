import type { ReactNode } from "react";

export function LeadPipeline({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 overflow-x-auto pb-4">{children}</div>;
}
