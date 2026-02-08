import * as React from "react";

import type { ReactNode } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InfoCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  titleBadge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  variant?: "default" | "glass" | "warning" | "success";
}

const variantStyles = {
  default: "",
  glass: "backdrop-blur-md bg-card/80 border-border/50",
  warning:
    "border-[var(--accent)]/50 bg-[var(--accent)]/10 ring-[var(--accent)]/20",
  success:
    "border-[var(--secondary)]/50 bg-[var(--secondary)]/10 ring-[var(--secondary)]/20",
};

export function InfoCard({
  title,
  subtitle,
  icon,
  titleBadge,
  footer,
  children,
  variant = "default",
}: InfoCardProps) {
  return (
    <Card className={cn(variantStyles[variant])}>
      {(title || subtitle || icon || titleBadge) && (
        <CardHeader>
          <div className="flex items-start gap-3">
            {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
            <div className="flex-1 min-w-0">
              {title && <CardTitle>{title}</CardTitle>}
              {subtitle && (
                <p className="text-muted-foreground text-xs/relaxed mt-1">{subtitle}</p>
              )}
            </div>
            {titleBadge && <div className="flex-shrink-0">{titleBadge}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export default InfoCard;
