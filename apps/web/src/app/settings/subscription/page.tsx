"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Crown, Sparkles, Zap, Check } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

// Mock subscription plans (these would normally come from the backend)
const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 100,
    features: [
      "100 free credits to start",
      "Access to basic models",
      "Create and share games",
      "Community support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 9,
    credits: 500,
    features: [
      "500 credits per month",
      "Access to all models",
      "Priority generation queue",
      "Email support",
      "Early access to new features",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    credits: 2000,
    features: [
      "2000 credits per month",
      "Access to premium models",
      "Fastest generation queue",
      "Priority support",
      "Custom model configurations",
      "Analytics dashboard",
      "API access",
    ],
  },
];

// Credit purchase options
const CREDIT_PACKAGES = [
  { credits: 100, price: 5, bonus: 0 },
  { credits: 500, price: 20, bonus: 50 },
  { credits: 1000, price: 35, bonus: 150 },
  { credits: 2000, price: 60, bonus: 400 },
  { credits: 5000, price: 120, bonus: 1000 },
];

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
  const isPopular = plan.name === "Starter";

  return (
    <Card
      className={`relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all ${
        isPopular
          ? "border-2 border-purple-300 dark:border-purple-600 scale-105"
          : ""
      } ${isCurrent ? "ring-2 ring-purple-500" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {plan.name === "Free" && (
            <Sparkles className="h-5 w-5 text-gray-500" />
          )}
          {plan.name === "Starter" && (
            <Zap className="h-5 w-5 text-purple-500" />
          )}
          {plan.name === "Pro" && <Crown className="h-5 w-5 text-yellow-500" />}
          {plan.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">${plan.price}</span>
            {plan.price > 0 && (
              <span className="text-muted-foreground">/month</span>
            )}
          </div>
          <p className="text-lg text-purple-600 dark:text-purple-400">
            {plan.credits.toLocaleString()} credits
          </p>
        </div>

        <ul className="space-y-2 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrent ? (
          <Button disabled className="w-full">
            Current Plan
          </Button>
        ) : (
          <Button
            className={`w-full ${
              isPopular
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                : ""
            }`}
            onClick={() => onSelect(plan)}
            disabled={isFree}
          >
            {isFree ? "Free Plan" : "Upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CreditPackage({
  pkg,
  onSelect,
}: {
  pkg: { credits: number; price: number; bonus: number };
  onSelect: (pkg: { credits: number; price: number; bonus: number }) => void;
}) {
  const totalCredits = pkg.credits + pkg.bonus;
  const hasBonus = pkg.bonus > 0;

  return (
    <Card
      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onSelect(pkg)}
    >
      <CardContent className="p-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold">
              {pkg.credits.toLocaleString()}
            </span>
            <span className="text-muted-foreground">credits</span>
          </div>
          {hasBonus && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              +{pkg.bonus.toLocaleString()} bonus
            </Badge>
          )}
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${pkg.price}
          </div>
          <Button className="w-full">Purchase</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionSettingsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Fetch user credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: () => trpcClient.credits.getBalance.query(),
    enabled: !!session,
  });

  // Fetch user extended data
  const { data: userExtended, isLoading: userLoading } = useQuery({
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

    // For now, use creditAmount-based checkout since plans are mock data
    // In production, this would use plan.id with actual database plan IDs
    checkoutMutation.mutate({ creditAmount: plan.credits });
  };

  const handlePurchaseCredits = (pkg: {
    credits: number;
    price: number;
    bonus: number;
  }) => {
    const totalCredits = pkg.credits + pkg.bonus;
    checkoutMutation.mutate({ creditAmount: totalCredits });
  };

  if (sessionPending || creditsLoading || userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
            <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Subscription & Credits</h1>
            <p className="text-muted-foreground">
              Manage your plan and purchase credits
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Current Plan: Free</h2>
              <p className="text-muted-foreground">Your credits never expire</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {credits.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Credits Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Choose a Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === "free"}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* Purchase Credits */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Purchase Credits</h2>
        <p className="text-muted-foreground">
          Buy credits in bulk and get bonus credits. Credits never expire.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <CreditPackage
              key={`${pkg.credits}-${pkg.price}`}
              pkg={pkg}
              onSelect={handlePurchaseCredits}
            />
          ))}
        </div>
      </section>

      {/* Transaction History */}
      {!transactionsLoading && transactions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        transaction.amount > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount} credits
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
