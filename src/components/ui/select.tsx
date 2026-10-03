import {
  forwardRef,
  useId,
 
  type SelectHTMLAttributes,
} from "react";

import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: SelectOption[];
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      required,
      error,
      hint,
      placeholder,
      options,
      id,
      disabled,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    const descriptionId = error
      ? `${selectId}-error`
      : hint
        ? `${selectId}-hint`
        : undefined;

    const isPlaceholderSelected =
      value === "" || (value === undefined && defaultValue === "");

    return (
      <div className="flex w-full flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="flex items-center gap-1 text-label"
          >
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

        {/* Select */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={descriptionId}
            className={cn(
              "h-10 w-full appearance-none rounded-md border border-border bg-card py-0 pl-3 pr-9 text-sm text-text-primary",
              "transition-[border-color,background-color,box-shadow] duration-150",
              "hover:border-text-subtle/50",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10",
              "disabled:cursor-not-allowed disabled:bg-card-hover disabled:text-text-subtle disabled:opacity-60",
              isPlaceholderSelected && "text-text-subtle",
              error && "border-danger focus:border-danger focus:ring-danger/10",
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted",
              disabled && "opacity-50",
              error && "text-danger",
            )}
          />
        </div>

        {/* Error / Hint */}
        {error ? (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-body-sm text-danger"
          >
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p
            id={`${selectId}-hint`}
            className="text-caption text-text-subtle"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";