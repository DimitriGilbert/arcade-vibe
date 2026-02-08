import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const arcadeButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 active:scale-[0.98]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80 active:scale-[0.98]",
        outline:
          "border-2 border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10 active:scale-[0.98]",
        glow: "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_20px_var(--glow-color,oklch(0.68_0.28_345/0.5)),0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_var(--glow-color,oklch(0.68_0.28_345/0.7)),0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] active:scale-[0.98]",
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
  disabled,
  type = "button",
}: ArcadeButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="arcade-button"
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
