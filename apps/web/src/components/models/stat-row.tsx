import type { ReactNode } from "react";

interface StatRowProps {
  /** Label for the stat */
  label: string;
  /** Value to display */
  value: string;
  /** Icon to display next to the label */
  icon: ReactNode;
}

/**
 * Stat row component - Server Component
 * Displays a labeled stat with an icon and value
 */
export function StatRow({ label, value, icon }: StatRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2">
      <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
