import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  variant?: "primary" | "purple" | "muted";
  centered?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

const variantClasses = {
  primary: "text-primary",
  purple: "text-purple-500",
  muted: "text-muted-foreground",
} as const;

export default function LoadingState({
  size = "md",
  message,
  variant = "primary",
  centered = false,
}: LoadingStateProps) {
  const containerClass = centered
    ? "flex flex-col items-center justify-center gap-2"
    : "flex flex-col items-center gap-2";

  return (
    <div className={containerClass}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`} />
      {message && <p className={variantClasses[variant]}>{message}</p>}
    </div>
  );
}
