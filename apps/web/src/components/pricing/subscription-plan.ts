/**
 * @fileoverview Subscription Plan type definition
 *
 * Type is derived from the database schema for single source of truth.
 * Used for both subscription plans and one-time credit packages.
 *
 * @see packages/db/src/schema/credits.ts - subscriptionPlans schema
 */

import type { subscriptionPlans } from "@arcade-vibe/db/schema/credits";

/**
 * Subscription plan entity from database
 * Represents both subscription plans and one-time purchase packages.
 */
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
