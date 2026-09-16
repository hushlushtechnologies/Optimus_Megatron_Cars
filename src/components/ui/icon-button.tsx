"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils/cn";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost: "text-text-muted hover:bg-card-hover hover:text-text-primary",
        outline: "border border-border text-text-primary hover:bg-card-hover",
      },
      size: {
        sm: "size-8",
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
  extends
    Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof iconButtonVariants> {
  /** Required — icon-only buttons must have an accessible label */
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.12 }}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
IconButton.displayName = "IconButton";
