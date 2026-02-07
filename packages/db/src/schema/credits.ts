import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

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
    price: integer("price").notNull(),
    credits: integer("credits").notNull(),
    features: text("features").array(),
    stripePriceId: text("stripe_price_id").unique(),
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
