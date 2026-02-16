import { Inbox } from "lucide-react";

interface EmptyPlaceholderProps {
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyPlaceholder({ 
  message = "No data available",
  icon 
}: EmptyPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      {icon ?? <Inbox className="h-12 w-12 text-[var(--muted-foreground)] opacity-50" />}
      <p className="text-[var(--muted-foreground)] text-sm">{message}</p>
    </div>
  );
}
