"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import { ArcadeButton } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import { Loader2, CreditCard, Crown, Sparkles, Zap, Check } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string | null;
  price: number;
  credits: number;
  features: string[] | null;
  isActive: boolean | null;
  isOneTime: boolean | null;
  isPopular: boolean | null;
}

function PlanCard({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}) {
  const isFree = plan.price === 0;
  const isPopular = plan.isPopular === true;

  return (
    <ArcadeCard
      className={`relative ${isPopular ? "scale-105" : ""} ${isCurrent ? "ring-2 ring-[var(--primary)]/60" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <ArcadeBadge text="Most Popular" variant="neon" />
        </div>
      )}
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
          {plan.name === "Free" && (
            <Sparkles className="h-5 w-5 text-[var(--muted-foreground)]" />
          )}
          {plan.name === "Starter" && (
            <Zap className="h-5 w-5 text-[var(--primary)]" />
          )}
          {plan.name === "Pro" && (
            <Crown className="h-5 w-5 text-[var(--accent)]" />
          )}
          {plan.name}
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
        </div>

        <ul className="space-y-2 mb-6">
          {(plan.features ?? []).map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrent ? (
          <ArcadeButton variant="outline" disabled className="w-full">
            Current Plan
          </ArcadeButton>
        ) : (
          <ArcadeButton
            variant={isPopular ? "primary" : "outline"}
            className="w-full"
            onClick={() => onSelect(plan)}
            disabled={isFree}
          >
            {isFree ? "Free Plan" : "Upgrade"}
          </ArcadeButton>
        )}
      </div>
    </ArcadeCard>
  );
}

function OneTimePackage({
  plan,
  onSelect,
}: {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
}) {
  const isPopular = plan.isPopular === true;
  // For one-time purchases, the first feature is used as badge text
  const badgeText = plan.features?.[0];

  return (
    <ArcadeCard
      className={`relative cursor-pointer ${isPopular ? "ring-2 ring-[var(--primary)]/60" : ""}`}
      onClick={() => onSelect(plan)}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <ArcadeBadge text="Best Value" variant="neon" />
        </div>
      )}
      <div className="p-6">
        <div className="text-center space-y-2">
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
          <ArcadeButton variant="outline" className="w-full">
            Purchase
          </ArcadeButton>
        </div>
      </div>
    </ArcadeCard>
  );
}

export default function SubscriptionSettingsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Fetch subscription plans from API
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const plans = await trpcClient.admin.plans.getPlans.query();
      return plans.filter((p) => p.isActive !== false) as SubscriptionPlan[];
    },
  });

  // Fetch user credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: () => trpcClient.credits.getBalance.query(),
    enabled: !!session,
  });

  // Fetch user extended data
  const { isLoading: userLoading } = useQuery({
    queryKey: ["user", "extended"],
    queryFn: () => trpcClient.credits.getUserExtended.query(),
    enabled: !!session,
  });

  // Fetch credit transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["credits", "transactions"],
    queryFn: () => trpcClient.credits.getTransactions.query({ limit: 10 }),
    enabled: !!session,
  });

  // Separate subscription plans from one-time purchases
  const allPlans = plansData ?? [];
  const subscriptionPlans = allPlans.filter((p) => p.isOneTime !== true);
  const oneTimePackages = allPlans.filter((p) => p.isOneTime === true);

  const credits = creditsData?.balance ?? 0;
  const transactions = transactionsData?.transactions ?? [];

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
    checkoutMutation.mutate({ planId: plan.id, creditAmount: plan.credits });
  };

  if (sessionPending || creditsLoading || userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[var(--primary)]" />
          <p className="text-[var(--muted-foreground)]">
            Loading subscription...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[var(--muted)]/60 rounded-lg">
            <CreditCard className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Subscription & Credits</h1>
            <p className="text-[var(--muted-foreground)]">
              Manage your plan and purchase credits
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <ArcadeCard className="">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Current Plan: Free</h2>
              <p className="text-[var(--muted-foreground)]">
                Your credits never expire
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[var(--primary)]">
                {credits.toLocaleString()}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Credits Available
              </p>
            </div>
          </div>
        </div>
      </ArcadeCard>

      {/* Subscription Plans */}
      {subscriptionPlans.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={false}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* One-time Credit Packages */}
      {oneTimePackages.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Purchase Credits</h2>
          <p className="text-[var(--muted-foreground)]">
            Buy credits in bulk. Credits never expire.
          </p>
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {oneTimePackages.map((plan) => (
                <OneTimePackage
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* No plans message */}
      {allPlans.length === 0 && !plansLoading && (
        <section className="space-y-4">
          <p className="text-[var(--muted-foreground)]">No plans available.</p>
        </section>
      )}

      {/* Transaction History */}
      {!transactionsLoading && transactions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <ArcadeCard className="">
            <div className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <ArcadeBadge
                      text={`${transaction.amount > 0 ? "+" : ""}${transaction.amount} credits`}
                      variant={transaction.amount > 0 ? "neon" : "default"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ArcadeCard>
        </section>
      )}
    </div>
  );
}
