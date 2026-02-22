import type { ReactNode } from "react";
import type { SubscriptionPlan } from "./subscription-plan";

import { ArcadeCard } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import { Clock } from "lucide-react";

/**
 * Props for OneTimePackage server component
 */
export interface OneTimePackageProps {
  /** The one-time package data to display */
  plan: SubscriptionPlan;
  /** Optional children for the action area (e.g., button or form) */
  children?: ReactNode;
}

/**
 * One-time credit package card component (Server Component)
 *
 * Displays a single one-time purchase package with credits and pricing.
 * Used for bulk credit purchases with 1-year validity.
 * The parent provides the interactive button/form.
 */
export function OneTimePackage({ plan, children }: OneTimePackageProps) {
  const isPopular = plan.isPopular === true;
  const badgeText = plan.features?.[0];

  return (
    <ArcadeCard
      className={`relative min-w-[180px] flex-1 max-w-[220px] ${isPopular ? "ring-2 ring-[var(--primary)]/60 overflow-visible" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <ArcadeBadge text="Best Value" variant="neon" />
        </div>
      )}
      <div className="p-6">
        <div className="text-center space-y-3">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {plan.displayName ?? plan.name}
          </h3>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold">
              {plan.credits.toLocaleString()}
            </span>
            <span className="text-[var(--muted-foreground)]">credits</span>
          </div>
          {badgeText && <ArcadeBadge text={badgeText} variant="neon" />}
          <div className="text-2xl font-bold text-[var(--primary)]">
            ${(plan.price / 100).toFixed(2)}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Valid for 1 year
          </p>
          {children}
        </div>
      </div>
    </ArcadeCard>
  );
}
