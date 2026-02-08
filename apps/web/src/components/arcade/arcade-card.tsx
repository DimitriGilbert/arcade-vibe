import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const arcadeCardVariants = cva(
  "arcade-card relative overflow-hidden transition-all duration-300 group/arcade-card rounded-[var(--radius)] bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)]",
  {
    variants: {
      variant: {
        default: "",
        glow: "arcade-card--glow border-[var(--primary)]",
        pixel: "arcade-card--pixel border-[var(--foreground)] rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ArcadeCardProps extends VariantProps<typeof arcadeCardVariants>, Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
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
  ...props
}: ArcadeCardProps) {
  return (
    <div
      data-slot="arcade-card"
      data-variant={variant ?? "default"}
      className={cn(arcadeCardVariants({ variant }), className)}
      {...props}
    >
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
