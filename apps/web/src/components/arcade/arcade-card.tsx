import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const arcadeCardVariants = cva(
  "relative overflow-hidden transition-all duration-300 group/arcade-card",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--card)] border border-[var(--border)] text-[var(--card-foreground)]",
        glow: "bg-[var(--card)] border-2 border-[var(--primary)] text-[var(--card-foreground)] shadow-[0_0_30px_var(--glow-color,oklch(0.68_0.28_345/0.5))]",
        pixel:
          "bg-[var(--card)] border-4 border-[var(--primary)] text-[var(--card-foreground)] rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ArcadeCardProps extends VariantProps<typeof arcadeCardVariants> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ArcadeCard({
  title,
  subtitle,
  icon,
  variant,
  children,
  className,
}: ArcadeCardProps) {
  return (
    <div
      data-slot="arcade-card"
      className={cn(arcadeCardVariants({ variant }), className)}
    >
      {/* Glow effect overlay for glow variant */}
      {variant === "glow" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/arcade-card:opacity-100"
          style={{
            background:
              "radial-gradient(circle at center, var(--glow-color, oklch(0.68 0.28 345 / 0.2)), transparent 70%)",
          }}
        />
      )}

      {/* Header section */}
      {(title || icon) && (
        <div className="flex items-start gap-3 p-4 pb-0">
          {icon && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              {icon}
            </div>
          )}
          <div className="flex-1 space-y-1">
            {title && (
              <h3 className="text-sm font-semibold text-[var(--card-foreground)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content section */}
      {children && <div className="p-4">{children}</div>}

      {/* Pixel corner decorations for pixel variant */}
      {variant === "pixel" && (
        <>
          <div className="absolute top-0 left-0 size-2 bg-[var(--primary)]" />
          <div className="absolute top-0 right-0 size-2 bg-[var(--primary)]" />
          <div className="absolute bottom-0 left-0 size-2 bg-[var(--primary)]" />
          <div className="absolute bottom-0 right-0 size-2 bg-[var(--primary)]" />
        </>
      )}
    </div>
  );
}

export { arcadeCardVariants };
