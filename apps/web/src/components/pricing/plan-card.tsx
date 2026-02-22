import type { ReactNode } from "react";
import type { SubscriptionPlan } from "./subscription-plan";

import { ArcadeCard } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import { Crown, Sparkles, Zap, Check, Clock } from "lucide-react";

/**
 * Props for PlanCard server component
 */
export interface PlanCardProps {
  /** The subscription plan data to display */
  plan: SubscriptionPlan;
  /** Optional children for the action area (e.g., button or form) */
  children?: ReactNode;
}

/**
 * Subscription plan card component (Server Component)
 *
 * Displays a single subscription plan with pricing, features, and an optional action area.
 * Used for monthly subscription plans. The parent provides the interactive button/form.
 */
export function PlanCard({ plan, children }: PlanCardProps) {
  const isFree = plan.price === 0;
  const isPopular = plan.isPopular === true;

  return (
    <ArcadeCard
      className={`relative ${isPopular ? "scale-105 overflow-visible" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <ArcadeBadge text="Most Popular" variant="neon" />
        </div>
      )}
      <div className="p-4 border-b border-[var(--border)] text-center">
        <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center justify-center gap-2">
          {plan.name === "Free" && (
            <Sparkles className="h-5 w-5 text-[var(--muted-foreground)]" />
          )}
          {plan.name === "Starter" && (
            <Zap className="h-5 w-5 text-[var(--primary)]" />
          )}
          {plan.name === "Pro" && (
            <Crown className="h-5 w-5 text-[var(--accent)]" />
          )}
          {plan.displayName ?? plan.name}
        </h3>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${(plan.price / 100).toFixed(2)}
            </span>
            {plan.price > 0 && (
              <span className="text-[var(--muted-foreground)]">/month</span>
            )}
          </div>
          <p className="text-lg text-[var(--primary)]">
            {plan.credits.toLocaleString()} credits
          </p>
          {plan.creditValidityDays != null && plan.creditValidityDays !== undefined && (
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Credits valid for {plan.creditValidityDays} days
            </p>
          )}
        </div>

        <ul className="space-y-2 mb-6">
          {(plan.features ?? []).map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {children}
      </div>
    </ArcadeCard>
  );
}
