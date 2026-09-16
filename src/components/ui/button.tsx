"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-[#0b1220] hover:bg-primary-hover",
        secondary:
          "bg-card-hover text-text-primary border border-border hover:bg-card",
        outline: "border border-border text-text-primary hover:bg-card-hover",
        ghost: "text-text-primary hover:bg-card-hover",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "h-9 px-3 text-body-sm rounded-md",
        md: "h-10 px-4 text-body rounded-md",
        lg: "h-12 px-6 text-body-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    Omit<HTMLMotionProps<"button">, "ref" | "children">,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
