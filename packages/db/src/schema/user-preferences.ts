import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const DEFAULT_LEADERBOARD_IMPLEMENTATION_PREFERENCE =
  "defaultLeaderboardImplementation";
export const DEFAULT_CREATOR_IMPLEMENTATION_PREFERENCE =
  "defaultCreatorImplementation";
export const DEFAULT_PROFILE_IMPLEMENTATION_PREFERENCE =
  "defaultProfileImplementation";

export const USER_PREFERENCE_NAMES = [
  DEFAULT_LEADERBOARD_IMPLEMENTATION_PREFERENCE,
  DEFAULT_CREATOR_IMPLEMENTATION_PREFERENCE,
  DEFAULT_PROFILE_IMPLEMENTATION_PREFERENCE,
] as const;

export type UserPreferenceName = (typeof USER_PREFERENCE_NAMES)[number];

export const LEADERBOARD_IMPLEMENTATIONS = [
  "arena",
  "dashboard",
  "magazine",
] as const;

export type LeaderboardImplementation =
  (typeof LEADERBOARD_IMPLEMENTATIONS)[number];

export const CREATOR_IMPLEMENTATIONS = [
  "workbench",
  "inbox",
  "filebrowser",
] as const;

export type CreatorImplementation = (typeof CREATOR_IMPLEMENTATIONS)[number];

export const PROFILE_IMPLEMENTATIONS = [
  "classic",
  "dashboard",
  "magazine",
  "arcade",
] as const;

export type ProfileImplementation = (typeof PROFILE_IMPLEMENTATIONS)[number];

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    index("user_preferences_user_idx").on(table.userId),
    uniqueIndex("user_preferences_user_name_idx").on(table.userId, table.name),
  ],
);
