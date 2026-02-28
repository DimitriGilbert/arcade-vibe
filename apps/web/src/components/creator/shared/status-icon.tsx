import { memo } from "react";
import { Brain, Sparkles, Check, AlertCircle, Clock } from "lucide-react";
import type { GenerationStatus } from "@/lib/model-types";

interface StatusIconProps {
  status: GenerationStatus;
  className?: string;
}

export const StatusIcon = memo(function StatusIcon({ status, className }: StatusIconProps) {
  switch (status) {
    case "idle":
      return <Clock className={`h-3 w-3 text-[var(--muted-foreground)] ${className ?? ""}`} />;
    case "reasoning":
      return <Brain className={`h-3 w-3 animate-pulse text-purple-400 ${className ?? ""}`} />;
    case "generating":
      return <Sparkles className={`h-3 w-3 animate-spin text-blue-400 ${className ?? ""}`} />;
    case "complete":
      return <Check className={`h-3 w-3 text-green-400 ${className ?? ""}`} />;
    case "error":
      return <AlertCircle className={`h-3 w-3 text-red-400 ${className ?? ""}`} />;
    default:
      return null;
  }
});
