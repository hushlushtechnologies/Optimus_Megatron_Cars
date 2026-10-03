import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, required, error, leftIcon, rightIcon, hint, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-label flex items-center gap-1">
            <span>{label}</span>

            {required && (
              <>
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">Required</span>
              </>
            )}
          </label>
        )}

        {/* Input */}
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className={cn(
                "text-text-muted pointer-events-none absolute left-3 flex size-4 items-center justify-center",
                error && "text-danger",
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={descriptionId}
            className={cn(
              "border-border bg-card text-text-primary h-10 w-full rounded-md border px-3 text-sm",
              "placeholder:text-text-subtle placeholder:text-xs",
              "transition-[border-color,background-color,box-shadow] duration-150",
              "hover:border-text-subtle/50",
              "focus:border-primary focus:ring-primary/10 focus:ring-2 focus:outline-none",
              "disabled:bg-card-hover disabled:text-text-subtle disabled:cursor-not-allowed disabled:opacity-60",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && ["border-danger", "focus:border-danger", "focus:ring-danger/10"],
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className={cn(
                "text-text-muted pointer-events-none absolute right-3 flex size-4 items-center justify-center",
                error && "text-danger",
              )}
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error */}
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-body-sm text-danger flex items-center gap-1.5"
          >
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-caption text-text-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
