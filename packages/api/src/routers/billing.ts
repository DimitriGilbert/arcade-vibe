import { router, protectedProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { userSubscriptions } from "@arcade-vibe/db/schema/credits";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

// Lazy-initialize Stripe to avoid build-time errors
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

export const billingRouter = router({
  // Get user's current subscription
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active"),
      ),
      with: {
        plan: true,
      },
      orderBy: desc(userSubscriptions.createdAt),
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        subscription: null,
      };
    }

    return {
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
          credits: subscription.plan.credits,
          price: subscription.plan.price,
          creditValidityDays: subscription.plan.creditValidityDays,
        },
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      },
    };
  }),

  // Get invoice history from Stripe
  getInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Get user's Stripe customer ID from their subscriptions
      const subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, ctx.user.id),
        columns: { stripeSubscriptionId: true },
      });

      if (!subscription?.stripeSubscriptionId) {
        return {
          invoices: [],
          hasMore: false,
        };
      }

      try {
        const stripe = getStripe();

        // Get the subscription to find the customer
        const stripeSub = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
        );

        if (!stripeSub.customer) {
          return {
            invoices: [],
            hasMore: false,
          };
        }

        const customerId =
          typeof stripeSub.customer === "string"
            ? stripeSub.customer
            : stripeSub.customer.id;

        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: input.limit,
        });

        return {
          invoices: invoices.data.map((invoice) => ({
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amountPaid: invoice.amount_paid,
            currency: invoice.currency,
            createdAt: new Date(invoice.created * 1000),
            invoicePdf: invoice.invoice_pdf,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
          })),
          hasMore: invoices.has_more,
        };
      } catch (error) {
        console.error("Error fetching invoices:", error);
        return {
          invoices: [],
          hasMore: false,
        };
      }
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "active"),
      ),
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    try {
      const stripe = getStripe();

      // Cancel at period end (don't revoke immediately)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local status
      await db
        .update(userSubscriptions)
        .set({
          status: "canceling",
        })
        .where(eq(userSubscriptions.id, subscription.id));

      return {
        success: true,
        message:
          "Subscription will be canceled at the end of the billing period",
        cancelAt: subscription.currentPeriodEnd,
      };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  // Reactivate a canceled subscription
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, ctx.user.id),
        eq(userSubscriptions.status, "canceling"),
      ),
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No canceling subscription found",
      });
    }

    try {
      const stripe = getStripe();

      // Remove the cancel_at_period_end flag
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update local status
      await db
        .update(userSubscriptions)
        .set({
          status: "active",
        })
        .where(eq(userSubscriptions.id, subscription.id));

      return {
        success: true,
        message: "Subscription reactivated successfully",
      };
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reactivate subscription",
      });
    }
  }),

  // Create customer portal session for payment method updates
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, ctx.user.id),
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found",
      });
    }

    try {
      const stripe = getStripe();

      const stripeSub = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      if (!stripeSub.customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No Stripe customer found",
        });
      }

      const customerId =
        typeof stripeSub.customer === "string"
          ? stripeSub.customer
          : stripeSub.customer.id;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/settings/subscription`,
      });

      return {
        url: session.url,
      };
    } catch (error) {
      console.error("Error creating portal session:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create portal session",
      });
    }
  }),
});
