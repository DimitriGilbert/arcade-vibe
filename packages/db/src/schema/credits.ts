import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { modelTierEnum } from "./enums";

// Tier costs configuration - allows admins to set credit costs per tier
export const tierCosts = pgTable("tier_costs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tier: modelTierEnum("tier").notNull().unique(),
  creditCost: integer("credit_cost").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
