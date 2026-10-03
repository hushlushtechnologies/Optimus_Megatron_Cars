"use client";

import { useId } from "react";
import { cn } from "@/src/lib/utils/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
}: SwitchProps) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Label */}
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-body-sm font-medium text-text-primary",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {label}
        </label>

        {description && (
          <p
            className={cn(
              "mt-0.5 text-caption text-text-subtle",
              disabled && "opacity-60",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Switch */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-[background,border-color,box-shadow] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "border-transparent bg-gradient-primary"
            : "border-border bg-card-hover hover:border-text-subtle/50",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-4 rounded-full shadow-soft-sm transition-transform duration-200 ease-out",
            checked
              ? "translate-x-6 bg-[#0b1220]"
              : "translate-x-1 bg-text-muted",
          )}
        />
      </button>
    </div>
  );
}