"use client";

export interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export function MiniStat({ label, value, icon: Icon, highlight }: MiniStatProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${highlight ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20' : 'bg-[var(--muted)]/30'}`}>
      {Icon && <Icon className={`w-4 h-4 ${highlight ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />}
      <div className="flex-1">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      </div>
    </div>
  );
}
