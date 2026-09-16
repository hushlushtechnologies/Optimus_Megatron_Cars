import { forwardRef, useId } from "react";
import { cn } from "@/src/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-label">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 text-text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              "h-10 w-full rounded-full border border-border bg-card text-sm text-text-primary placeholder:text-text-subtle placeholder:text-xs transition-colors",
              "focus-visible:outline-none  focus-visible:ring-primary focus-visible:border-primary",
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              error && "border-danger focus-visible:ring-danger",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="pointer-events-none absolute right-3 text-text-muted">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-body-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
