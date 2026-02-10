"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard } from "@/components/arcade";
import { ArcadeButton } from "@/components/arcade";
import { ArcadeBadge } from "@/components/arcade";
import {
  Loader2,
  CreditCard,
  Crown,
  AlertTriangle,
  Clock,
  Calendar,
  ExternalLink,
  Receipt,
  TrendingUp,
  TrendingDown,
  MinusCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import type { Route } from "next";
import Link from "next/link";

interface CreditBatch {
  id: string;
  amount: number;
  remainingAmount: number;
  sourceType: string;
  expiresAt: Date;
  daysUntilExpiry: number;
  createdAt: Date;
}

interface CreditBreakdown {
  total: number;
  expiringWithin7Days: number;
  expiringWithin30Days: number;
  validBeyond30Days: number;
  batches: CreditBatch[];
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: {
    id: string;
    name: string;
    displayName: string;
    credits: number;
    price: number;
    creditValidityDays: number | null;
  };
  stripeSubscriptionId: string | null;
}

function ExpiryTimeline({ breakdown }: { breakdown: CreditBreakdown }) {
  const maxCredits = Math.max(
    breakdown.expiringWithin7Days,
    breakdown.expiringWithin30Days,
    breakdown.validBeyond30Days,
    1,
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Credit Expiry Timeline</h3>

      {/* Expiring within 7 days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Expiring in 7 days
          </span>
          <span className="font-medium">
            {breakdown.expiringWithin7Days.toLocaleString()} credits
          </span>
        </div>
        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all"
            style={{
              width: `${(breakdown.expiringWithin7Days / maxCredits) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Expiring within 30 days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Expiring in 8-30 days
          </span>
          <span className="font-medium">
            {Math.max(
              0,
              breakdown.expiringWithin30Days - breakdown.expiringWithin7Days,
            ).toLocaleString()}{" "}
            credits
          </span>
        </div>
        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full transition-all"
            style={{
              width: `${(Math.max(0, breakdown.expiringWithin30Days - breakdown.expiringWithin7Days) / maxCredits) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Valid beyond 30 days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Valid for 30+ days
          </span>
          <span className="font-medium">
            {breakdown.validBeyond30Days.toLocaleString()} credits
          </span>
        </div>
        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{
              width: `${(breakdown.validBeyond30Days / maxCredits) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TransactionIcon({ type }: { type: string }) {
  switch (type) {
    case "purchase":
    case "one_time_purchase":
    case "subscription":
    case "grant":
    case "admin_grant":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "deduction":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case "expiry":
      return <MinusCircle className="h-4 w-4 text-orange-500" />;
    default:
      return <CreditCard className="h-4 w-4 text-[var(--muted-foreground)]" />;
  }
}

function SourceTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    one_time_purchase: "One-time Purchase",
    subscription: "Subscription",
    admin_grant: "Admin Grant",
    free_trial: "Free Trial",
  };
  return <span>{labels[type] ?? type}</span>;
}

export default function SubscriptionSettingsPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Fetch credit balance with breakdown
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: () => trpcClient.credits.getBalance.query(),
    enabled: !!session,
  });

  // Fetch detailed credit breakdown
  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ["credits", "breakdown"],
    queryFn: () => trpcClient.credits.getCreditBreakdown.query(),
    enabled: !!session,
  });

  // Fetch subscription info
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => trpcClient.billing.getSubscription.query(),
    enabled: !!session,
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["credits", "transactions"],
    queryFn: () => trpcClient.credits.getTransactions.query({ limit: 10 }),
    enabled: !!session,
  });

  // Fetch invoices
  const { data: invoicesData } = useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => trpcClient.billing.getInvoices.query({ limit: 5 }),
    enabled: !!session && !!subscriptionData?.hasSubscription,
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: () => trpcClient.billing.cancelSubscription.mutate(),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: () => trpcClient.billing.reactivateSubscription.mutate(),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reactivate subscription");
    },
  });

  // Create portal session mutation
  const portalMutation = useMutation({
    mutationFn: () => trpcClient.billing.createPortalSession.mutate(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  const isLoading =
    sessionPending ||
    balanceLoading ||
    breakdownLoading ||
    subscriptionLoading ||
    transactionsLoading;

  if (isLoading) {
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

  const balance = balanceData?.balance ?? 0;
  const breakdown = breakdownData as CreditBreakdown | undefined;
  const subscription = subscriptionData?.subscription as
    | Subscription
    | undefined;
  const transactions = transactionsData?.transactions ?? [];
  const invoices = invoicesData?.invoices ?? [];

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
              Manage your plan and view credit history
            </p>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      {subscription ? (
        <ArcadeCard>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                  <Crown className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {subscription.plan.displayName}
                  </h2>
                  <p className="text-[var(--muted-foreground)]">
                    ${((subscription.plan.price ?? 0) / 100).toFixed(2)}/month
                  </p>
                </div>
              </div>
              <ArcadeBadge
                text={
                  subscription.status === "canceling"
                    ? "Canceling"
                    : subscription.status === "active"
                      ? "Active"
                      : subscription.status
                }
                variant={subscription.status === "active" ? "neon" : "default"}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>
                  Current period:{" "}
                  {new Date(
                    subscription.currentPeriodStart,
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>
                  {subscription.plan.creditValidityDays ?? 30} day credit
                  validity
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {subscription.status === "canceling" ? (
                <ArcadeButton
                  variant="primary"
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                >
                  {reactivateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reactivate"
                  )}
                </ArcadeButton>
              ) : (
                <ArcadeButton
                  variant="outline"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cancel Subscription"
                  )}
                </ArcadeButton>
              )}
              <ArcadeButton
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </ArcadeButton>
            </div>
          </div>
        </ArcadeCard>
      ) : (
        <ArcadeCard>
          <div className="p-6 text-center">
            <p className="text-[var(--muted-foreground)] mb-4">
              You don't have an active subscription
            </p>
            <Link href={"/pricing" as Route}>
              <ArcadeButton variant="primary">View Plans</ArcadeButton>
            </Link>
          </div>
        </ArcadeCard>
      )}

      {/* Credit Balance */}
      <ArcadeCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Credit Balance</h2>
              <p className="text-[var(--muted-foreground)]">
                Credits are consumed oldest first
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[var(--primary)]">
                {balance.toLocaleString()}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Credits Available
              </p>
            </div>
          </div>

          {/* Expiry Warning */}
          {breakdown && breakdown.expiringWithin7Days > 0 && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-500">
                  Credits Expiring Soon
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {breakdown.expiringWithin7Days.toLocaleString()} credits will
                  expire within the next 7 days. Use them before they're gone!
                </p>
              </div>
            </div>
          )}

          {/* Expiry Timeline */}
          {breakdown && breakdown.batches.length > 0 && (
            <ExpiryTimeline breakdown={breakdown} />
          )}
        </div>
      </ArcadeCard>

      {/* Credit Batches Detail */}
      {breakdown && breakdown.batches.length > 0 && (
        <ArcadeCard>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Credit Batches</h2>
            <div className="space-y-3">
              {breakdown.batches.slice(0, 5).map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        batch.daysUntilExpiry <= 7
                          ? "bg-red-500"
                          : batch.daysUntilExpiry <= 30
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">
                        {batch.remainingAmount.toLocaleString()} credits
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        <SourceTypeLabel type={batch.sourceType} />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Expires {new Date(batch.expiresAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {batch.daysUntilExpiry} days left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ArcadeCard>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <ArcadeCard>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {transactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <TransactionIcon type={transaction.type} />
                    <div>
                      <p className="font-medium">
                        {transaction.description ?? transaction.type}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
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
      )}

      {/* Invoice History */}
      {invoices.length > 0 && (
        <ArcadeCard>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Billing History</h2>
            <div className="space-y-3">
              {invoices.map(
                (invoice: {
                  id: string;
                  number: string | null;
                  status: string | null;
                  amountPaid: number;
                  currency: string;
                  createdAt: string;
                  invoicePdf?: string | null;
                  hostedInvoiceUrl?: string | null;
                }) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <div>
                        <p className="font-medium">
                          Invoice {invoice.number ?? invoice.id.slice(-8)}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        ${(invoice.amountPaid / 100).toFixed(2)}{" "}
                        {invoice.currency.toUpperCase()}
                      </span>
                      {invoice.hostedInvoiceUrl && (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </ArcadeCard>
      )}

      {/* Upgrade CTA */}
      <ArcadeCard className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Need More Credits?</h2>
          <p className="text-[var(--muted-foreground)] mb-4">
            Purchase more credits or upgrade your subscription
          </p>
          <Link href={"/pricing" as Route}>
            <ArcadeButton variant="primary">View Pricing</ArcadeButton>
          </Link>
        </div>
      </ArcadeCard>
    </div>
  );
}
