import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCharacterCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      rows = 4,
      required,
      disabled,
      maxLength,
      showCharacterCount = false,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    const descriptionId = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    const textValue = value ?? defaultValue ?? "";
    const characterCount =
      typeof textValue === "string" || typeof textValue === "number" ? String(textValue).length : 0;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label htmlFor={textareaId} className="text-label flex items-center gap-1">
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

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={cn(
            "border-border bg-card text-text-primary min-h-24 w-full resize-y rounded-md border px-3 py-2.5 text-sm leading-6",
            "placeholder:text-text-subtle placeholder:text-xs",
            "transition-[border-color,background-color,box-shadow] duration-150",
            "hover:border-text-subtle/50",
            "focus:border-primary focus:ring-primary/10 focus:ring-2 focus:outline-none",
            "disabled:bg-card-hover disabled:text-text-subtle disabled:cursor-not-allowed disabled:resize-none disabled:opacity-60",
            error && "border-danger focus:border-danger focus:ring-danger/10",
            className,
          )}
          {...props}
        />

        {/* Bottom information */}
        <div
          className={cn(
            "flex items-start gap-3",
            (hint || error) && showCharacterCount
              ? "justify-between"
              : showCharacterCount
                ? "justify-end"
                : "justify-start",
          )}
        >
          {error ? (
            <p
              id={`${textareaId}-error`}
              role="alert"
              className="text-body-sm text-danger flex min-w-0 items-center gap-1.5"
            >
              <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />

              <span>{error}</span>
            </p>
          ) : hint ? (
            <p id={`${textareaId}-hint`} className="text-caption text-text-subtle min-w-0">
              {hint}
            </p>
          ) : null}

          {showCharacterCount && (
            <span className="text-caption text-text-subtle ml-auto shrink-0 tabular-nums">
              {characterCount}
              {maxLength ? ` / ${maxLength}` : ""}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
