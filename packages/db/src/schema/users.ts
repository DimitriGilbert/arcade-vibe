import { pgTable, text, boolean, integer, index, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { user } from "./auth";

// per PRD lines 1129-1140 - Extended users table
// This extends the existing Better Auth user table from auth.ts
// Note: credits field is a denormalized balance for quick display
// The actual spendable credits are tracked in creditBatches table
export const userExtended = pgTable(
  "user_extended",
  {
    id: text("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull().default("participant"),
    reputation: integer("reputation").notNull().default(0),
    // Denormalized credit balance - actual credits are in creditBatches table
    // Default is 0; initial credits are assigned via credit batch on signup
    credits: integer("credits").notNull().default(0),
    isSuspended: boolean("is_suspended").notNull().default(false),
    suspensionReason: text("suspension_reason"),
    suspendedUntil: timestamp("suspended_until"),
  },
  (table) => [index("idx_users_suspended").on(table.isSuspended)],
);
