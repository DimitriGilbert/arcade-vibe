import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@arcade-vibe/db";
import { emailLogs } from "@arcade-vibe/db/schema/email";
import { eq } from "drizzle-orm";
import { env } from "@arcade-vibe/env/server";

/**
 * Resend webhook handler for email delivery status updates.
 *
 * Handles events:
 * - email.delivered: Email was successfully delivered
 * - email.bounced: Email bounced (hard or soft bounce)
 * - email.complained: Recipient marked as spam
 * - email.opened: Email was opened (if tracking enabled)
 * - email.clicked: Link in email was clicked (if tracking enabled)
 */

// Initialize Resend client for webhook verification
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Resend webhook event types (delivery status events only)
type DeliveryEventType =
  | "email.delivered"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked";

// Map event types to email log status
const EVENT_TO_STATUS: Record<DeliveryEventType, string> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
};

// Resend webhook event structure (derived from SDK)
interface WebhookEventData {
  email_id: string;
  from: string;
  to: string[];
  subject?: string;
  created_at: string;
  // Bounce-specific fields
  bounce_type?: "hard" | "soft" | "undetermined";
  response?: string;
  // Click-specific fields
  click?: {
    link: string;
    timestamp: string;
    user_agent?: string;
  };
  // Open-specific fields
  open?: {
    timestamp: string;
    user_agent?: string;
  };
}

interface WebhookEvent {
  type: DeliveryEventType;
  created_at: string;
  data: WebhookEventData;
}

/**
 * Verify the webhook signature using Resend SDK.
 * Resend uses Svix for webhook signing.
 */
function verifyWebhookSignature(
  payload: string,
  headers: {
    id: string;
    timestamp: string;
    signature: string;
  },
  webhookSecret: string,
): WebhookEvent | null {
  try {
    // Resend SDK's webhook verification
    const event = resend?.webhooks.verify({
      payload,
      headers,
      webhookSecret,
    });

    return event as WebhookEvent;
  } catch {
    return null;
  }
}

/**
 * Update email log status based on webhook event.
 * Uses the resendId to find the corresponding email log entry.
 */
async function updateEmailLogStatus(
  resendId: string,
  eventType: DeliveryEventType,
  data: WebhookEventData,
): Promise<void> {
  const status = EVENT_TO_STATUS[eventType];
  const now = new Date();

  // Build update object based on event type
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  switch (eventType) {
    case "email.delivered":
      updateData.deliveredAt = now;
      break;

    case "email.bounced":
      // Include bounce details in error message for debugging
      updateData.errorMessage = `Bounced (${data.bounce_type ?? "unknown"}): ${data.response ?? "No response"}`;
      break;

    case "email.complained":
      updateData.errorMessage = "Recipient complained (marked as spam)";
      break;

    case "email.opened":
      updateData.openedAt = now;
      // Don't change status from delivered if already delivered
      delete updateData.status;
      break;

    case "email.clicked":
      updateData.clickedAt = now;
      // Don't change status from delivered if already delivered
      delete updateData.status;
      break;
  }

  // Update the email log by resendId
  const result = await db
    .update(emailLogs)
    .set(updateData)
    .where(eq(emailLogs.resendId, resendId))
    .returning({ id: emailLogs.id });

  if (result.length === 0) {
    // Log warning but don't fail - email might not be tracked
    console.warn(`[Resend Webhook] No email log found for resendId: ${resendId}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Get raw body for signature verification
  const payload = await request.text();

  // Get Svix headers for signature verification
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  // Verify webhook secret is configured
  const webhookSecret = env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Resend Webhook] RESEND_WEBHOOK_SECRET not configured");
    // Return 200 to prevent retries, but log the error
    return NextResponse.json({ received: true, error: "Webhook secret not configured" });
  }

  // Validate required headers
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[Resend Webhook] Missing required headers");
    return NextResponse.json({ received: true, error: "Missing required headers" });
  }

  // Verify webhook signature
  const event = verifyWebhookSignature(
    payload,
    {
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
    },
    webhookSecret,
  );

  if (!event) {
    console.error("[Resend Webhook] Invalid signature");
    // Return 200 to prevent retries on invalid signatures (could be attack)
    return NextResponse.json({ received: true, error: "Invalid signature" });
  }

  // Log the received event for debugging
  console.log(`[Resend Webhook] Received event: ${event.type} for email: ${event.data.email_id}`);

  try {
    // Only process delivery status events
    if (
      event.type === "email.delivered" ||
      event.type === "email.bounced" ||
      event.type === "email.complained" ||
      event.type === "email.opened" ||
      event.type === "email.clicked"
    ) {
      await updateEmailLogStatus(event.data.email_id, event.type, event.data);
    } else {
      // Log unhandled event types (like email.received for inbound)
      console.log(`[Resend Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    // Log errors but always return 200 to prevent retries
    // We don't want Resend to retry on our processing failures
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Resend Webhook] Error processing event ${event.type}:`, errorMessage);
  }

  // Always return 200 OK to acknowledge receipt
  return NextResponse.json({ received: true });
}
