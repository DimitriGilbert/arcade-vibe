import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  stripeEventId: text("stripe_event_id").primaryKey(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  eventType: text("event_type").notNull(),
});

// Tier costs configuration - allows admins to set credit costs per tier
export const tierCosts = pgTable("tier_costs", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Machine-readable identifier - used in code references
  slug: varchar("slug", { length: 50 }).notNull().unique(),

  // Human-readable display name
  name: varchar("name", { length: 100 }).notNull(),

  // Credit cost for this tier
  creditCost: integer("credit_cost").notNull(),

  // Description of what this tier means
  description: text("description"),

  // Scoring multiplier - harder tiers get higher multipliers
  scoreMultiplier: real("score_multiplier").notNull().default(1.0),

  // Display order - lower numbers appear first
  displayOrder: integer("display_order").notNull().default(0),

  // UI color class for badges
  colorClass: varchar("color_class", { length: 100 }),

  // Soft delete support
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Credit batches track credits with expiry dates using FIFO consumption
// One-time purchases: 1 year expiry
// Subscription credits: 1 month expiry
export const creditBatches = pgTable(
  "credit_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // Original amount credited
    remainingAmount: integer("remaining_amount").notNull(), // Remaining after consumption
    sourceType: text("source_type").notNull(), // "one_time_purchase" | "subscription" | "admin_grant" | "free_trial"
    sourceId: text("source_id"), // Stripe payment ID or subscription ID
    expiresAt: timestamp("expires_at").notNull(), // Expiry date
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("credit_batches_userId_idx").on(table.userId),
    index("credit_batches_expiresAt_idx").on(table.expiresAt),
  ],
);

// per PRD lines 1143-1153
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    batchId: uuid("batch_id"), // Optional link to credit batch
    expiresAt: timestamp("expires_at"), // When these credits expire (for display)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("credit_transactions_userId_idx").on(table.userId)],
);

// per PRD lines 1156-1173
export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    price: integer("price").notNull(),
    credits: integer("credits").notNull(),
    features: text("features").array(),
    stripePriceId: text("stripe_price_id").unique(),
    isActive: boolean("is_active").notNull().default(true),
    isOneTime: boolean("is_one_time").notNull().default(false),
    isPopular: boolean("is_popular").notNull().default(false),
    creditValidityDays: integer("credit_validity_days"), // Days until credits expire (null = never, 365 for one-time, 30 for subscription)
    extraCreditMarkupPercent: integer("extra_credit_markup_percent")
      .default(30)
      .notNull(),
    minExtraCreditsPurchase: integer("min_extra_credits_purchase")
      .default(25)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("subscription_plans_name_key").on(table.name)],
);

// per PRD lines 1176-1189
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    status: text("status").notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_subscriptions_userId_idx").on(table.userId),
    index("user_subscriptions_planId_idx").on(table.planId),
  ],
);

// CB-016: User invoices table to store invoice PDF URLs
export const userInvoices = pgTable(
  "user_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id")
      .references(() => userSubscriptions.id, { onDelete: "set null" }),
    stripeInvoiceId: text("stripe_invoice_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull(),
    invoicePdf: text("invoice_pdf"),
    invoiceUrl: text("invoice_url"),
    hostedInvoiceUrl: text("hosted_invoice_url"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_invoices_userId_idx").on(table.userId),
    index("user_invoices_stripeInvoiceId_idx").on(table.stripeInvoiceId),
  ],
);
