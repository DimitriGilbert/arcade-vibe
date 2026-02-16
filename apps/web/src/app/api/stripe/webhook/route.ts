import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@arcade-vibe/db";

async function getStripeLib() {
  const Stripe = (await import("stripe")).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-01-28.clover",
  });
}

async function getWebhookHandlers() {
  return await import("@arcade-vibe/api/lib/stripe-webhook");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;

  try {
    const stripe = await getStripeLib();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    const {
      handleCheckoutCompleted,
      handleInvoicePaid,
      handleSubscriptionUpdated,
      handleSubscriptionDeleted,
      tryClaimEvent,
      DuplicateEventError,
    } = await getWebhookHandlers();

    try {
      await db.transaction(async (tx) => {
        await tryClaimEvent(event.id, event.type, tx);

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutCompleted(session, tx);
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            await handleInvoicePaid(invoice, tx);
            break;
          }

          case "customer.subscription.created":
          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(subscription, tx);
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionDeleted(subscription, tx);
            break;
          }

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
      });
    } catch (error) {
      if (error instanceof DuplicateEventError) {
        console.log(`Event ${event.id} already processed, skipping`);
        return NextResponse.json({ received: true });
      }
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 },
    );
  }
}
