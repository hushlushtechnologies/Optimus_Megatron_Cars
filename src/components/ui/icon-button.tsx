"use client";

import { forwardRef, type ReactNode } from "react";

import { motion, type HTMLMotionProps } from "motion/react";

import { cva, type VariantProps } from "class-variance-authority";

import { Loader2 } from "lucide-react";

import { cn } from "@/src/lib/utils/cn";

const iconButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost: "text-text-muted hover:bg-card-hover hover:text-text-primary",

        outline: "border border-border text-text-primary hover:bg-card-hover",
      },

      size: {
        sm: "size-8 before:absolute before:-inset-2 before:content-['']",

        md: "size-10",

        lg: "size-12",
      },
    },

    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export interface IconButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children">, VariantProps<typeof iconButtonVariants> {
  /**
   * Required because icon-only buttons
   * must have an accessible label.
   */
  "aria-label": string;

  children?: ReactNode;

  /**
   * Shows a loading spinner and prevents
   * additional clicks while loading.
   */
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, isLoading = false, disabled, children, type = "button", ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={isDisabled ? undefined : { scale: 0.94 }}
        transition={{
          duration: 0.12,
        }}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          iconButtonVariants({
            variant,
            size,
          }),
          className,
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : children}
      </motion.button>
    );
  },
);

IconButton.displayName = "IconButton";
