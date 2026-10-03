"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

const buttonVariants = cva(
  `
    relative
    inline-flex
    shrink-0
    items-center
    justify-center
    whitespace-nowrap
    font-medium
    outline-none
    transition-[background-color,border-color,color,box-shadow,opacity]
    duration-150

    disabled:pointer-events-none
    disabled:cursor-not-allowed
    disabled:opacity-45

    focus-visible:ring-2
    focus-visible:ring-primary/30
    focus-visible:ring-offset-2
    focus-visible:ring-offset-base
  `,
  {
    variants: {
      variant: {
        primary: `
          border
          border-primary
          bg-primary
          text-[#0b1220]
          shadow-[0_1px_2px_rgba(0,0,0,0.14)]

          hover:border-primary-hover
          hover:bg-primary-hover
          hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)]

          active:shadow-none
        `,
        secondary: `
          border
          border-border
          bg-card-hover
          text-text-primary
          shadow-[0_1px_1px_rgba(0,0,0,0.06)]

          hover:border-border
          hover:bg-surface

          active:bg-card-hover
        `,
        outline: `
          border
          border-border
          bg-transparent
          text-text-primary

          hover:border-text-subtle/40
          hover:bg-card-hover

          active:bg-card-hover
        `,
        ghost: `
          border
          border-transparent
          bg-transparent
          text-text-muted

          hover:bg-card-hover
          hover:text-text-primary

          active:bg-card-hover
        `,
        destructive: `
          border
          border-danger/20
          bg-danger/10
          text-danger

          hover:border-danger/30
          hover:bg-danger/15

          active:bg-danger/20
        `,
        destructiveSolid: `
          border
          border-danger
          bg-danger
          text-white
          shadow-[0_1px_2px_rgba(0,0,0,0.12)]

          hover:brightness-95
          hover:shadow-[0_2px_6px_rgba(0,0,0,0.16)]

          active:shadow-none
        `,
        gradient: `
  border
  border-primary/30
  bg-gradient-primary
  text-[#0b1220]
  shadow-[0_2px_8px_rgba(212,175,55,0.14)]

  hover:brightness-[1.05]
  hover:shadow-[0_3px_12px_rgba(212,175,55,0.20)]

  active:brightness-[0.98]
  active:shadow-none
`,
      },
      size: {
        sm: "h-9 px-3 text-xs gap-1.5 rounded-md",
        md: "h-10 px-4 text-body gap-1.5 rounded-md",
        lg: "h-12 px-6 text-body-lg gap-1.5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children">, VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
