import Stripe from "stripe";
import { router, protectedProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { subscriptionPlans, userSubscriptions } from "@arcade-vibe/db/schema/credits";
import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "../middleware/rate-limit";

// CB-015: Proration behavior for upgrades
export const PRORATION_BEHAVIOR = {
  ALWAYS_INVOICE: "always_invoice",
  CREATE_PRORATIONS: "create_prorations",
  NONE: "none",
} as const;

// Lazy-initialize Stripe to avoid build-time errors when STRIPE_SECRET_KEY is not set
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }
  return new Stripe(key, {
    apiVersion: "2026-01-28.clover",
  });
}

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        planId: z.string().uuid().optional(),
        creditAmount: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || !ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      let amount: number;
      let name: string;
      let plan: typeof subscriptionPlans.$inferSelect | null = null;

      if (input.planId) {
        const foundPlan = await db.query.subscriptionPlans.findFirst({
          where: eq(subscriptionPlans.id, input.planId),
        });
        if (!foundPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan not found",
          });
        }
        plan = foundPlan;
        amount = plan.price;
        name = plan.name;
      } else if (input.creditAmount) {
        // $5 per 100 credits
        amount = Math.ceil(input.creditAmount / 100) * 500; // cents
        name = `${input.creditAmount} Credits`;
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must provide planId or creditAmount",
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
      const userEmail = ctx.session.user.email;

      const isSubscription = plan !== null && plan.isOneTime === false;

      if (isSubscription && plan !== null && !plan.stripePriceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Subscription plan missing Stripe price ID",
        });
      }

      // CB-014: Use stripePriceId when available for all plan types
      const usePriceReference = plan !== null && plan.stripePriceId !== null;

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = usePriceReference
        ? [
            {
              price: plan!.stripePriceId!,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: "usd",
                product_data: { name },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ];

      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: isSubscription ? "subscription" : "payment",
        success_url: `${appUrl}/settings/subscription?success=true`,
        cancel_url: `${appUrl}/settings/subscription?canceled=true`,
        customer_email: userEmail,
        metadata: {
          userId: ctx.user.id,
          planId: input.planId ?? "",
          creditAmount: input.creditAmount?.toString() ?? "",
          isSubscription: isSubscription.toString(),
          planName: plan?.name ?? "",
        },
      });

      return { checkoutUrl: session.url };
    }),

  // CB-015: Create subscription update with proration
  createSubscriptionUpdate: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        newPlanId: z.string().uuid(),
        prorationBehavior: z
          .enum([
            PRORATION_BEHAVIOR.ALWAYS_INVOICE,
            PRORATION_BEHAVIOR.CREATE_PRORATIONS,
            PRORATION_BEHAVIOR.NONE,
          ])
          .default(PRORATION_BEHAVIOR.CREATE_PRORATIONS),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || !ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const activeSubscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, ctx.user.id),
          inArray(userSubscriptions.status, ["active", "trialing"]),
        ),
      });

      if (!activeSubscription?.stripeSubscriptionId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found to update",
        });
      }

      const newPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, input.newPlanId),
      });

      if (!newPlan || !newPlan.stripePriceId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target plan not found or not available for subscription",
        });
      }

      const oldPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, activeSubscription.planId),
      });

      const stripe = getStripe();
      const existingSubscription = await stripe.subscriptions.retrieve(
        activeSubscription.stripeSubscriptionId,
      );

      const itemId = existingSubscription.items.data[0]?.id;
      if (!itemId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not find subscription item to update",
        });
      }

      const updatedSubscription = await stripe.subscriptions.update(
        activeSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: itemId,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: input.prorationBehavior,
          payment_behavior: "pending_if_incomplete",
          metadata: {
            userId: ctx.user.id,
            oldPlanId: activeSubscription.planId,
            newPlanId: input.newPlanId,
            oldPlanName: oldPlan?.name ?? "",
            newPlanName: newPlan.name,
            updateType:
              oldPlan && newPlan.credits > oldPlan.credits ? "upgrade" : "downgrade",
          },
        },
      );

      return {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        prorationBehavior: input.prorationBehavior,
        oldPlan: oldPlan?.name,
        newPlan: newPlan.name,
      };
    }),

  // CB-015: Get proration preview for a plan change
  getProrationPreview: protectedProcedure
    .input(
      z.object({
        newPlanId: z.string().uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const activeSubscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, ctx.user.id),
          inArray(userSubscriptions.status, ["active", "trialing"]),
        ),
      });

      if (!activeSubscription?.stripeSubscriptionId) {
        return null;
      }

      const newPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, input.newPlanId),
      });

      if (!newPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target plan not found",
        });
      }

      const oldPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, activeSubscription.planId),
      });

      const now = new Date();
      const periodEnd = activeSubscription.currentPeriodEnd;
      const remainingDays = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const oldMonthlyPrice = oldPlan?.price ?? 0;
      const newMonthlyPrice = newPlan.price;
      const oldDailyRate = oldMonthlyPrice / 30;
      const newDailyRate = newMonthlyPrice / 30;

      const estimatedProration = Math.round(
        (newDailyRate - oldDailyRate) * remainingDays,
      );

      return {
        prorationAmount: estimatedProration,
        prorationAmountFormatted: (estimatedProration / 100).toFixed(2),
        currency: "usd",
        nextPaymentAmount: newMonthlyPrice,
        nextPaymentAmountFormatted: (newMonthlyPrice / 100).toFixed(2),
        remainingDays,
        isUpgrade: newMonthlyPrice > oldMonthlyPrice,
        isDowngrade: newMonthlyPrice < oldMonthlyPrice,
      };
    }),
});
