import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const arcadeBadgeVariants = cva(
  "arcade-badge inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 rounded-[var(--radius)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--muted)] text-[var(--foreground)]",
        neon: "arcade-badge--neon bg-[var(--primary)] text-[var(--primary-foreground)]",
        pixel:
          "arcade-badge--pixel bg-[var(--primary)] text-[var(--primary-foreground)] rounded-none border-2 border-[var(--foreground)]",
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
      data-variant={variant ?? "default"}
      className={cn(arcadeBadgeVariants({ variant }), className)}
    >
      {text}
    </span>
  );
}

export { arcadeBadgeVariants };
