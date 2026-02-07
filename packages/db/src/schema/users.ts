import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { user } from "./auth";

// per PRD lines 1129-1140 - Extended users table
// This extends the existing Better Auth user table from auth.ts
export const userExtended = pgTable("user_extended", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("participant"),
  reputation: text("reputation").notNull().default("0"),
  credits: text("credits").notNull().default("100"),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspensionReason: text("suspension_reason"),
});
