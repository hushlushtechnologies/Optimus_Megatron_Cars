import type { LucideIcon } from "lucide-react";

interface FutureModuleTabProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function FutureModuleTab({ icon: Icon, title, description }: FutureModuleTabProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="bg-card-hover text-text-subtle flex size-14 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="max-w-sm">
        <p className="text-body-lg text-text-primary">{title}</p>
        {description && <p className="text-body-sm text-text-muted mt-1">{description}</p>}
      </div>
    </div>
  );
}
