import type Stripe from "stripe";
import { db } from "@arcade-vibe/db";
import {
  subscriptionPlans,
  userSubscriptions,
} from "@arcade-vibe/db/schema/credits";
import { eq } from "drizzle-orm";
import { addCreditsInternal, type CreditSourceType } from "./credits";

// Lazy-initialize Stripe to avoid build-time errors
function getStripe(): Stripe {
  const stripe = require("stripe");
  return new stripe.default(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-01-28.clover",
  });
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const creditAmount = session.metadata?.creditAmount;

  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // If this is for a plan (subscription or one-time)
  if (planId) {
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      console.error(`Plan not found: ${planId}`);
      return;
    }

    // Determine source type based on plan
    const sourceType: CreditSourceType = plan.isOneTime
      ? "one_time_purchase"
      : "subscription";

    // Add credits with appropriate expiry
    await addCreditsInternal(
      userId,
      plan.credits,
      `Purchased ${plan.name} plan`,
      sourceType,
      `Stripe checkout: ${session.id}`,
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? undefined),
    );

    // If it's a subscription, create the subscription record
    if (!plan.isOneTime && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      // Get subscription details from Stripe
      const stripe = getStripe();
      const stripeSubscription =
        await stripe.subscriptions.retrieve(subscriptionId);
      const periodStart =
        stripeSubscription.items?.data?.[0]?.current_period_start ??
        Math.floor(Date.now() / 1000);
      const periodEnd =
        stripeSubscription.items?.data?.[0]?.current_period_end ??
        Math.floor(Date.now() / 1000) + 2592000; // +30 days

      await db.insert(userSubscriptions).values({
        userId,
        planId: plan.id,
        stripeSubscriptionId: subscriptionId,
        status: stripeSubscription.status ?? "active",
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      });
    }
  } else if (creditAmount) {
    // Custom credit purchase
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
      );
    }
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Only process subscription invoices - check if lines contain subscription data
  const lines = invoice.lines?.data ?? [];
  const subLine = lines.find((line) => line.subscription);
  if (!subLine?.subscription) {
    return;
  }

  const subId =
    typeof subLine.subscription === "string"
      ? subLine.subscription
      : subLine.subscription.id;

  // Find the user subscription
  const userSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subId}`,
    );
    return;
  }

  // Get the plan to determine credit amount
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, userSubscription.planId),
  });

  if (!plan) {
    console.error(`Plan not found: ${userSubscription.planId}`);
    return;
  }

  // Add monthly subscription credits (1 month validity)
  await addCreditsInternal(
    userSubscription.userId,
    plan.credits,
    `Monthly subscription credits - ${plan.name}`,
    "subscription",
    `Stripe invoice: ${invoice.id}`,
    subId,
  );

  // Update subscription period
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subId);
  const periodStart =
    stripeSubscription.items?.data?.[0]?.current_period_start ??
    Math.floor(Date.now() / 1000);
  const periodEnd =
    stripeSubscription.items?.data?.[0]?.current_period_end ??
    Math.floor(Date.now() / 1000) + 2592000;

  await db
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
) {
  const subscriptionId = subscription.id;

  const userSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subscriptionId}`,
    );
    return;
  }

  // Update subscription status and period
  const periodStart =
    subscription.items?.data?.[0]?.current_period_start ??
    Math.floor(Date.now() / 1000);
  const periodEnd =
    subscription.items?.data?.[0]?.current_period_end ??
    Math.floor(Date.now() / 1000) + 2592000;

  await db
    .update(userSubscriptions)
    .set({
      status: subscription.status ?? "active",
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    })
    .where(eq(userSubscriptions.id, userSubscription.id));
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  const subscriptionId = subscription.id;

  const userSubscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!userSubscription) {
    console.error(
      `User subscription not found for Stripe subscription: ${subscriptionId}`,
    );
    return;
  }

  // Mark subscription as canceled
  await db
    .update(userSubscriptions)
    .set({
      status: "canceled",
    })
    .where(eq(userSubscriptions.id, userSubscription.id));
}
