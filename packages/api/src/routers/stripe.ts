import Stripe from "stripe";
import { router, protectedProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { subscriptionPlans } from "@arcade-vibe/db/schema/credits";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "../middleware/rate-limit";

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
});
