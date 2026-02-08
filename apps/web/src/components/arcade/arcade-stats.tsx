import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatItem {
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
}

interface ArcadeStatsProps {
  stats: StatItem[];
  className?: string;
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") {
    return (
      <svg
        className="size-4 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    );
  }

  if (trend === "down") {
    return (
      <svg
        className="size-4 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    );
  }

  return (
    <svg
      className="size-4 text-[var(--muted-foreground)]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 12H4"
      />
    </svg>
  );
}

export function ArcadeStats({ stats, className }: ArcadeStatsProps) {
  return (
    <div
      data-slot="arcade-stats"
      className={cn("grid grid-cols-2 gap-4 md:grid-cols-4", className)}
    >
      {stats.map((stat, index) => (
        <div
          key={`${stat.label}-${index}`}
          className="flex flex-col gap-2 p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] transition-all duration-200 hover:border-[var(--primary)]/50"
        >
          <div className="flex items-center justify-between">
            {stat.icon && (
              <div className="flex size-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                {stat.icon}
              </div>
            )}
            {stat.trend && <TrendIndicator trend={stat.trend} />}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stat.value}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
