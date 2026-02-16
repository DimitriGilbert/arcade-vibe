import type Stripe from "stripe";
import { db, type DbTransaction } from "@arcade-vibe/db";
import {
  stripeWebhookEvents,
  subscriptionPlans,
  userSubscriptions,
} from "@arcade-vibe/db/schema/credits";
import { eq, and, inArray } from "drizzle-orm";
import { addCreditsInternal, deductCredits, type CreditSourceType } from "./credits";
import { z } from "zod";

export class DuplicateEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateEventError";
  }
}

export async function tryClaimEvent(
  stripeEventId: string,
  eventType: string,
  tx: DbTransaction,
): Promise<void> {
  try {
    await tx.insert(stripeWebhookEvents).values({
      stripeEventId,
      eventType,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("duplicate key") ||
        error.message.includes("23505"))
    ) {
      throw new DuplicateEventError(`Event ${stripeEventId} already processed`);
    }
    throw error;
  }
}

function getStripe(): Stripe {
  const stripe = require("stripe");
  return new stripe.default(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-01-28.clover",
  });
}

const metadataSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().uuid().optional(),
  creditAmount: z.string().regex(/^\d+$/).optional(),
});

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  tx?: DbTransaction,
) {
  const metadataResult = metadataSchema.safeParse(session.metadata);

  if (!metadataResult.success) {
    console.error("Invalid metadata in checkout session:", metadataResult.error.issues);
    return;
  }

  const { userId, planId, creditAmount } = metadataResult.data;

  const executor = tx ?? db;

  if (planId) {
    const plan = await executor.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      console.error(`Plan not found: ${planId}`);
      return;
    }

    const sourceType: CreditSourceType = plan.isOneTime
      ? "one_time_purchase"
      : "subscription";

    await addCreditsInternal(
      userId,
      plan.credits,
      `Purchased ${plan.name} plan`,
      sourceType,
      `Stripe checkout: ${session.id}`,
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? undefined),
      tx,
    );

    if (!plan.isOneTime && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const stripe = getStripe();
      const stripeSubscription =
        await stripe.subscriptions.retrieve(subscriptionId);
      const periodStart =
        stripeSubscription.items?.data?.[0]?.current_period_start ??
        Math.floor(Date.now() / 1000);
      const periodEnd =
        stripeSubscription.items?.data?.[0]?.current_period_end ??
        Math.floor(Date.now() / 1000) + 2592000;

      // CB-019: Cancel any existing active subscriptions for this user
      const existingActive = await executor.query.userSubscriptions.findMany({
        where: and(
          eq(userSubscriptions.userId, userId),
          inArray(userSubscriptions.status, ["active", "trialing", "past_due"])
        ),
      });

      if (existingActive.length > 0) {
        const existingIds = existingActive.map((s) => s.id);
        await executor
          .update(userSubscriptions)
          .set({ status: "replaced" })
          .where(inArray(userSubscriptions.id, existingIds));
      }

      await executor.insert(userSubscriptions).values({
        userId,
        planId: plan.id,
        stripeSubscriptionId: subscriptionId,
        status: stripeSubscription.status ?? "active",
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      });
    }
  } else if (creditAmount) {
    const amount = parseInt(creditAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      await addCreditsInternal(
        userId,
        amount,
        `Purchased ${amount} credits`,
        "one_time_purchase",
        `Stripe checkout: ${session.id}`,
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? undefined),
        tx,
      );
    }
  }
}

export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  tx?: DbTransaction,
) {
  const lines = invoice.lines?.data ?? [];
  const subLine = lines.find((line) => line.subscription);
  if (!subLine?.subscription) {
    return;
  }

  const subId =
    typeof subLine.subscription === "string"
      ? subLine.subscription
      : subLine.subscription.id;

  const executor = tx ?? db;

  const userSubscription = await executor.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subId}`,
    );
    return;
  }

  const plan = await executor.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, userSubscription.planId),
  });

  if (!plan) {
    console.error(`Plan not found: ${userSubscription.planId}`);
    return;
  }

  await addCreditsInternal(
    userSubscription.userId,
    plan.credits,
    `Monthly subscription credits - ${plan.name}`,
    "subscription",
    `Stripe invoice: ${invoice.id}`,
    subId,
    tx,
  );

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subId);
  const periodStart =
    stripeSubscription.items?.data?.[0]?.current_period_start ??
    Math.floor(Date.now() / 1000);
  const periodEnd =
    stripeSubscription.items?.data?.[0]?.current_period_end ??
    Math.floor(Date.now() / 1000) + 2592000;

  await executor
    .update(userSubscriptions)
    .set({
      status: stripeSubscription.status ?? "active",
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    })
    .where(eq(userSubscriptions.id, userSubscription.id));
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  tx?: DbTransaction,
) {
  const subscriptionId = subscription.id;

  const executor = tx ?? db;

  const userSubscription = await executor.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subscriptionId}`,
    );
    return;
  }

  const periodStart =
    subscription.items?.data?.[0]?.current_period_start ??
    Math.floor(Date.now() / 1000);
  const periodEnd =
    subscription.items?.data?.[0]?.current_period_end ??
    Math.floor(Date.now() / 1000) + 2592000;

  const newPlanId = subscription.items?.data?.[0]?.price?.metadata?.planId;
  if (newPlanId && newPlanId !== userSubscription.planId) {
    const oldPlan = await executor.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, userSubscription.planId),
    });
    const newPlan = await executor.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, newPlanId),
    });

    if (oldPlan && newPlan) {
      const creditDifference = newPlan.credits - oldPlan.credits;
      if (creditDifference > 0) {
        await addCreditsInternal(
          userSubscription.userId,
          creditDifference,
          `Plan upgrade credit adjustment: ${oldPlan.name} → ${newPlan.name}`,
          "subscription",
          `Plan change via Stripe subscription: ${subscriptionId}`,
          subscriptionId,
          tx,
        );
      } else if (creditDifference < 0) {
        try {
          await deductCredits(
            userSubscription.userId,
            Math.abs(creditDifference),
            `Plan downgrade credit adjustment: ${oldPlan.name} → ${newPlan.name}`,
          );
        } catch {
          console.warn(
            `Insufficient credits for downgrade adjustment for user ${userSubscription.userId}. Proceeding with plan change.`,
          );
        }
      }
    }

    await executor
      .update(userSubscriptions)
      .set({
        planId: newPlanId,
        status: subscription.status ?? "active",
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      })
      .where(eq(userSubscriptions.id, userSubscription.id));
  } else {
    await executor
      .update(userSubscriptions)
      .set({
        status: subscription.status ?? "active",
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      })
      .where(eq(userSubscriptions.id, userSubscription.id));
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  tx?: DbTransaction,
) {
  const subscriptionId = subscription.id;

  const executor = tx ?? db;

  const userSubscription = await executor.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subscriptionId}`,
    );
    return;
  }

  await executor
    .update(userSubscriptions)
    .set({
      status: "canceled",
    })
    .where(eq(userSubscriptions.id, userSubscription.id));
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  tx?: DbTransaction,
) {
  const lines = invoice.lines?.data ?? [];
  const subLine = lines.find((line) => line.subscription);
  if (!subLine?.subscription) {
    return;
  }

  const subId =
    typeof subLine.subscription === "string"
      ? subLine.subscription
      : subLine.subscription.id;

  const executor = tx ?? db;

  const userSubscription = await executor.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subId}`,
    );
    return;
  }

  const attemptCount = invoice.attempt_count ?? 1;

  await executor
    .update(userSubscriptions)
    .set({
      status: "past_due",
    })
    .where(eq(userSubscriptions.id, userSubscription.id));

  console.warn(
    `Payment failed for subscription ${subId} (attempt ${attemptCount}). User: ${userSubscription.userId}`,
  );
}

export async function handleCustomerDeleted(
  customer: Stripe.Customer,
  tx?: DbTransaction,
) {
  const executor = tx ?? db;

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error("No userId in customer metadata");
    return;
  }

  const activeSubscriptions = await executor.query.userSubscriptions.findMany({
    where: eq(userSubscriptions.userId, userId),
  });

  for (const sub of activeSubscriptions) {
    await executor
      .update(userSubscriptions)
      .set({ status: "canceled" })
      .where(eq(userSubscriptions.id, sub.id));
  }

  console.log(`Customer deleted for user ${userId}. Canceled ${activeSubscriptions.length} subscriptions.`);
}
