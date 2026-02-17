import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const arcadeButtonVariants = cva(
  "arcade-button inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 cursor-pointer rounded-[var(--radius)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-105 active:scale-[0.98]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/85 active:scale-[0.98]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] active:scale-[0.98]",
        glow: "arcade-button--glow bg-[var(--primary)] text-[var(--primary-foreground)] active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ArcadeButtonProps extends VariantProps<typeof arcadeButtonVariants> {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ArcadeButton({
  variant,
  size,
  children,
  className,
  onClick,
  disabled = false,
  type = "button",
}: ArcadeButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="arcade-button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(arcadeButtonVariants({ variant, size, className }))}
    >
      {children}
    </ButtonPrimitive>
  );
}

export { arcadeButtonVariants };
