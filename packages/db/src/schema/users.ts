import { pgTable, text, boolean, integer, index } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { user } from "./auth";

// per PRD lines 1129-1140 - Extended users table
// This extends the existing Better Auth user table from auth.ts
export const userExtended = pgTable(
  "user_extended",
  {
    id: text("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull().default("participant"),
    reputation: integer("reputation").notNull().default(0),
    credits: integer("credits").notNull().default(100),
    isSuspended: boolean("is_suspended").notNull().default(false),
    suspensionReason: text("suspension_reason"),
  },
  (table) => [index("idx_users_suspended").on(table.isSuspended)],
);
