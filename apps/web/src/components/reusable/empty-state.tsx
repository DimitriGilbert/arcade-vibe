import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message: string;
  variant?: "table" | "card" | "list";
  colSpan?: number;
}

export function EmptyState({
  icon,
  title,
  message,
  variant = "card",
  colSpan = 1,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      {title && <p className="font-medium text-foreground">{title}</p>}
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  if (variant === "table") {
    return <td colSpan={colSpan}>{content}</td>;
  }

  return <div className="flex items-center justify-center">{content}</div>;
}
