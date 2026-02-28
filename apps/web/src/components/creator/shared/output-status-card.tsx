import type { ReactNode } from "react";
import { memo } from "react";
import { AlertCircle } from "lucide-react";

interface OutputStatusCardProps {
  type: "empty" | "error";
  error?: string;
}

export const OutputStatusCard = memo(function OutputStatusCard({ type, error }: OutputStatusCardProps) {
  const toneClass =
    type === "error"
      ? "border-[var(--destructive)]/40 bg-[var(--destructive)]/10"
      : "border-[var(--border)] bg-[var(--muted)]/10";

  const content: { title: string; description: string; icon?: ReactNode } =
    type === "error"
      ? {
          title: "Generation failed",
          description: error ?? "An error occurred",
          icon: <AlertCircle className="h-6 w-6 text-[var(--destructive)]" />,
        }
      : {
          title: "No output",
          description: "Generate a game to see the output here",
        };

  return (
    <div
      className={`h-full min-h-0 rounded-lg border ${toneClass} flex items-center justify-center p-4`}
    >
      <div className="max-w-sm text-center space-y-2">
        {content.icon ? <div className="mx-auto w-fit">{content.icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{content.title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{content.description}</p>
      </div>
    </div>
  );
});
