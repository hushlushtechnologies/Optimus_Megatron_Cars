"use client";

import { useId, type ReactNode } from "react";

interface FormSectionProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ step, title, description, children }: FormSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="surface-card flex flex-col gap-4 p-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-primary/15 text-body-sm text-primary-text flex size-7 shrink-0 items-center justify-center rounded-full font-semibold"
        >
          {step}
        </span>
        <div>
          <h2 id={headingId} className="text-h3">
            {title}
          </h2>
          {description && <p className="text-body-sm text-text-muted">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
