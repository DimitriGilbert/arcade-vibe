import { Loader2 } from "lucide-react";

interface LoadingPlaceholderProps {
  message?: string;
}

export default function LoadingPlaceholder({ 
  message = "Loading..." 
}: LoadingPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      <p className="text-[var(--muted-foreground)] text-sm">{message}</p>
    </div>
  );
}
