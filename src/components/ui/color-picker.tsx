"use client";

import { useId } from "react";
import { AlertCircle, Pipette } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colorName?: string;
  onColorNameChange?: (name: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function ColorPicker({
  label,
  value,
  onChange,
  colorName,
  onColorNameChange,
  error,
  required,
  disabled,
  hint,
}: ColorPickerProps) {
  const id = useId();
  const colorInputId = `${id}-picker`;
  const hexInputId = `${id}-hex`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const isValidHex = HEX_PATTERN.test(value);
  const hasHexError = value.length > 0 && !isValidHex;
  const hasError = Boolean(error) || hasHexError;

  const handleHexChange = (input: string) => {
    let nextValue = input.trim().toUpperCase();

    if (nextValue && !nextValue.startsWith("#")) {
      nextValue = `#${nextValue}`;
    }

    if (nextValue.length <= 7) {
      onChange(nextValue);
    }
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {/* Label */}
      <label htmlFor={hexInputId} className="text-label flex items-center gap-1">
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

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Color swatch */}
        <label
          htmlFor={colorInputId}
          className={cn(
            "group border-border bg-card relative flex h-10 w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-md border px-2.5 transition-[border-color,background-color] duration-150",
            "hover:border-text-subtle/50 sm:w-auto",
            "focus-within:border-primary focus-within:ring-primary/10 focus-within:ring-2",
            disabled && "pointer-events-none cursor-not-allowed opacity-60",
            hasError && "border-danger",
          )}
        >
          <span
            className="shadow-soft-sm size-6 shrink-0 rounded-md border border-white/10"
            style={{
              backgroundColor: isValidHex ? value : "#000000",
            }}
            aria-hidden="true"
          />

          <span className="text-body-sm text-text-muted flex items-center gap-1.5 sm:hidden">
            <Pipette className="size-3.5" aria-hidden="true" />
            Choose color
          </span>

          <input
            id={colorInputId}
            type="color"
            value={isValidHex ? value : "#000000"}
            disabled={disabled}
            aria-label={`${label} color picker`}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {/* HEX */}
        <div className="relative shrink-0 sm:w-32">
          <span
            aria-hidden="true"
            className="text-text-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium"
          >
            HEX
          </span>

          <input
            id={hexInputId}
            type="text"
            value={value}
            disabled={disabled}
            required={required}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            placeholder="#000000"
            aria-invalid={hasError ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            onChange={(event) => handleHexChange(event.target.value)}
            className={cn(
              "border-border bg-card text-text-primary h-10 w-full rounded-md border pr-3 pl-11 text-sm uppercase",
              "placeholder:text-text-subtle placeholder:text-xs",
              "transition-[border-color,background-color,box-shadow] duration-150",
              "hover:border-text-subtle/50",
              "focus:border-primary focus:ring-primary/10 focus:ring-2 focus:outline-none",
              "disabled:bg-card-hover disabled:text-text-subtle disabled:cursor-not-allowed disabled:opacity-60",
              hasError && "border-danger focus:border-danger focus:ring-danger/10",
            )}
          />
        </div>

        {/* Color name */}
        {onColorNameChange && (
          <input
            type="text"
            value={colorName ?? ""}
            disabled={disabled}
            placeholder="Color name, e.g. Nardo Grey"
            onChange={(event) => onColorNameChange(event.target.value)}
            className={cn(
              "border-border bg-card text-text-primary h-10 min-w-0 flex-1 rounded-md border px-3 text-sm",
              "placeholder:text-text-subtle placeholder:text-xs",
              "transition-[border-color,background-color,box-shadow] duration-150",
              "hover:border-text-subtle/50",
              "focus:border-primary focus:ring-primary/10 focus:ring-2 focus:outline-none",
              "disabled:bg-card-hover disabled:text-text-subtle disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />
        )}
      </div>

      {/* Error / hint */}
      {error ? (
        <p id={errorId} role="alert" className="text-body-sm text-danger flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hasHexError ? (
        <p id={errorId} role="alert" className="text-body-sm text-danger flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Enter a valid 6-digit HEX color.</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
