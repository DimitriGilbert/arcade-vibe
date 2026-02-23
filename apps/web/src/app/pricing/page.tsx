"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import { ArcadeButton } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import { Loader2, Crown, Sparkles, Zap, Check, Clock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { SubscriptionPlan } from "@/lib/trpc-types";

function PlanCard({
  plan,
  onSelect,
  isLoading,
}: {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
}) {
  const isFree = plan.price === 0;
  const isPopular = plan.isPopular === true;

  return (
    <ArcadeCard className={`relative ${isPopular ? "scale-105 overflow-visible" : ""}`}>
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
          {plan.creditValidityDays !== null &&
            plan.creditValidityDays !== undefined && (
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

        <ArcadeButton
          variant={isPopular ? "primary" : "outline"}
          className="w-full"
          onClick={() => onSelect(plan)}
          disabled={isFree || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFree ? (
            "Free Plan"
          ) : (
            "Subscribe"
          )}
        </ArcadeButton>
      </div>
    </ArcadeCard>
  );
}

function OneTimePackage({
  plan,
  onSelect,
  isLoading,
}: {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
}) {
  const isPopular = plan.isPopular === true;
  const badgeText = plan.features?.[0];

  return (
    <ArcadeCard
      className={`relative cursor-pointer min-w-[180px] flex-1 max-w-[220px] ${isPopular ? "ring-2 ring-[var(--primary)]/60 overflow-visible" : ""}`}
      onClick={() => !isLoading && onSelect(plan)}
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
          <ArcadeButton
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Purchase"
            )}
          </ArcadeButton>
        </div>
      </div>
    </ArcadeCard>
  );
}

export default function PricingPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const router = useRouter();

  // Fetch subscription plans from API
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const plans = await trpcClient.admin.plans.getPlans.query();
      return plans.filter((p) => p.isActive !== false) as SubscriptionPlan[];
    },
  });

  // Separate subscription plans from one-time purchases
  const allPlans = plansData ?? [];
  const subscriptionPlans = allPlans.filter((p) => p.isOneTime !== true);
  const oneTimePackages = allPlans.filter((p) => p.isOneTime === true);

  // Stripe checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (input: { planId?: string; creditAmount?: number }) => {
      return await trpcClient.stripe.createCheckoutSession.mutate(input);
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return;

    // If not logged in, redirect to login
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing") as Route}`);
      return;
    }

    checkoutMutation.mutate({ planId: plan.id, creditAmount: plan.credits });
  };

  if (sessionPending || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[var(--primary)]" />
          <p className="text-[var(--muted-foreground)]">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-[var(--foreground)]">
              Choose Your Plan
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Get credits to generate amazing arcade games. Subscribe for
              monthly credits or make a one-time purchase.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Credit Expiry Notice */}
        <ArcadeCard className="bg-[var(--muted)]/30">
          <div className="p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--muted-foreground)]">
              <p className="font-medium text-[var(--foreground)] mb-1">
                Credit Validity
              </p>
              <p>
                <strong>Subscription credits</strong> are valid for 1 month from
                the date they are added to your account.{" "}
                <strong>One-time purchase credits</strong> are valid for 1 year.
                Credits are consumed on a first-in, first-out basis.
              </p>
            </div>
          </div>
        </ArcadeCard>

        {/* Subscription Plans */}
        {subscriptionPlans.length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">Monthly Subscriptions</h2>
              <p className="text-[var(--muted-foreground)]">
                Get credits every month with a subscription
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {subscriptionPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                  isLoading={checkoutMutation.isPending}
                />
              ))}
            </div>
          </section>
        )}

        {/* One-time Credit Packages */}
        {oneTimePackages.length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">One-Time Purchase</h2>
              <p className="text-[var(--muted-foreground)]">
                Buy credits in bulk, valid for 1 year
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {oneTimePackages.map((plan) => (
                <OneTimePackage
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                  isLoading={checkoutMutation.isPending}
                />
              ))}
            </div>
          </section>
        )}

        {/* No plans message */}
        {allPlans.length === 0 && (
          <section className="text-center py-12">
            <p className="text-[var(--muted-foreground)]">
              No plans available at the moment.
            </p>
          </section>
        )}

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <ArcadeCard>
              <div className="p-4">
                <h3 className="font-medium mb-2">Do credits expire?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Yes. Subscription credits expire after 1 month. One-time
                  purchase credits expire after 1 year from the purchase date.
                </p>
              </div>
            </ArcadeCard>
            <ArcadeCard>
              <div className="p-4">
                <h3 className="font-medium mb-2">How are credits consumed?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Credits are consumed on a first-in, first-out basis. This
                  means your oldest credits are used first, ensuring you don't
                  lose credits to expiration unnecessarily.
                </p>
              </div>
            </ArcadeCard>
            <ArcadeCard>
              <div className="p-4">
                <h3 className="font-medium mb-2">Can I get a refund?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Credits are non-refundable once purchased. Please contact
                  support if you have any issues with your purchase.
                </p>
              </div>
            </ArcadeCard>
          </div>
        </section>
      </main>
    </div>
  );
}
