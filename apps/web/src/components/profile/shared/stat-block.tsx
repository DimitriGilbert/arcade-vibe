"use client";

export interface StatBlockProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}

export function StatBlock({ label, value, icon: Icon }: StatBlockProps) {
  return (
    <div className="text-center p-4">
      {Icon && <Icon className="w-5 h-5 mx-auto text-[var(--primary)] mb-2" />}
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
