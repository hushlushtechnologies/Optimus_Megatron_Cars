import type { LucideIcon } from "lucide-react";

interface FutureLeadTabProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FutureLeadTab({ icon: Icon, title, description }: FutureLeadTabProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="text-text-subtle size-8" aria-hidden="true" />
      <div>
        <p className="text-body-lg text-text-primary">{title}</p>
        <p className="text-body-sm text-text-muted mt-1">{description}</p>
      </div>
    </div>
  );
}
