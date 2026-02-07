import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { themes } from "./themes";

// per PRD lines 1372-1378 - Platform statistics table
export const platformStats = pgTable(
  "platform_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    totalUsers: integer("total_users").notNull().default(0),
    activeUsers: integer("active_users").notNull().default(0),
    totalPrompts: integer("total_prompts").notNull().default(0),
    totalGames: integer("total_games").notNull().default(0),
    totalRatings: integer("total_ratings").notNull().default(0),
    averageRating: text("average_rating").notNull().default("0"),
    lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  },
  (table) => [index("platform_stats_lastCalculatedAt_idx").on(table.lastCalculatedAt)],
);

// per PRD lines 1381-1392 - Admin actions log table
export const adminActions = pgTable(
  "admin_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: text("admin_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id"),
    reason: text("reason"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_actions_adminId_idx").on(table.adminId),
    index("admin_actions_targetType_targetId_idx").on(table.targetType, table.targetId),
  ],
);

// per PRD lines 2436-2462 - Scoring weights configuration table
export const scoringWeights = pgTable(
  "scoring_weights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    themeId: uuid("theme_id").references(() => themes.id, { onDelete: "cascade" }),
    promptQualityWeight: integer("prompt_quality_weight").notNull().default(1),
    gameQualityWeight: integer("game_quality_weight").notNull().default(1),
    themeRelevanceWeight: integer("theme_relevance_weight").notNull().default(1),
    overallWeight: integer("overall_weight").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("scoring_weights_themeId_idx").on(table.themeId),
    index("scoring_weights_isActive_idx").on(table.isActive),
  ],
);
