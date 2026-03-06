import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import {
  creatorImplementationEnum,
  leaderboardImplementationEnum,
} from "./enums";

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    defaultLeaderboardImplementation: leaderboardImplementationEnum(
      "default_leaderboard_implementation",
    ),
    defaultCreatorImplementation: creatorImplementationEnum(
      "default_creator_implementation",
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("user_preferences_leaderboard_idx").on(
      table.defaultLeaderboardImplementation,
    ),
    index("user_preferences_creator_idx").on(
      table.defaultCreatorImplementation,
    ),
  ],
);
