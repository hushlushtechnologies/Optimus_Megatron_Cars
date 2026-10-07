import type { LucideIcon } from "lucide-react";

interface LeadViewPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function LeadViewPlaceholder({ icon: Icon, title, description }: LeadViewPlaceholderProps) {
  return (
    <div className="surface-card flex min-h-[360px] flex-col items-center justify-center gap-3 p-10 text-center">
      <Icon className="text-text-subtle size-8" aria-hidden="true" />
      <div>
        <p className="text-body-lg text-text-primary">{title}</p>
        <p className="text-body-sm text-text-muted mt-1">{description}</p>
      </div>
    </div>
  );
}
