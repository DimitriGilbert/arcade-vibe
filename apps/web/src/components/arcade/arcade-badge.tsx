import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const arcadeBadgeVariants = cva(
  "inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)]/10 text-[var(--primary)] rounded-full",
        neon: "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full shadow-[0_0_10px_var(--glow-color,oklch(0.68_0.28_345/0.5))]",
        pixel:
          "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-none border-2 border-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ArcadeBadgeProps extends VariantProps<typeof arcadeBadgeVariants> {
  text: string;
  className?: string;
}

export function ArcadeBadge({ text, variant, className }: ArcadeBadgeProps) {
  return (
    <span
      data-slot="arcade-badge"
      className={cn(arcadeBadgeVariants({ variant }), className)}
    >
      {text}
    </span>
  );
}

export { arcadeBadgeVariants };
