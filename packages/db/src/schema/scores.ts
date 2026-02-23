import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { desc } from "drizzle-orm";
import { prompts } from "./prompts";
import { themes } from "./themes";
import { games as gamesImport } from "./games";
import { user } from "./auth";

// per PRD lines 1349-1369
export const scores = pgTable(
  "scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesImport.id, { onDelete: "cascade" })
      .unique(),
    themeId: uuid("theme_id").references(() => themes.id, {
      onDelete: "set null",
    }),
    score: integer("score").notNull(),
    isHighScore: boolean("is_high_score").notNull().default(false),
    completionTime: integer("completion_time"),
    playedAt: timestamp("played_at").defaultNow().notNull(),
    qualityScore: decimal("quality_score", { precision: 6, scale: 4 }),
    engagementScore: decimal("engagement_score", { precision: 6, scale: 4 }),
    playersScore: decimal("players_score", { precision: 6, scale: 4 }),
    playsScore: decimal("plays_score", { precision: 6, scale: 4 }),
    replayScore: decimal("replay_score", { precision: 6, scale: 4 }),
    efficiencyScore: decimal("efficiency_score", { precision: 6, scale: 4 }),
    tierFactor: decimal("tier_factor", { precision: 5, scale: 4 }),
    inputTokens: integer("input_tokens"),
    finalScore: decimal("final_score", { precision: 8, scale: 4 }).notNull(),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
    version: integer("version").default(1).notNull(),
  },
  (table) => [
    index("scores_userId_idx").on(table.userId),
    index("scores_promptId_idx").on(table.promptId),
    index("scores_gameId_idx").on(table.gameId),
    index("scores_themeId_idx").on(table.themeId),
    index("idx_scores_theme_final").on(table.themeId, desc(table.score)),
  ],
);

export const scoreHistory = pgTable(
  "score_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesImport.id, { onDelete: "cascade" }),
    scoreId: uuid("score_id")
      .notNull()
      .references(() => scores.id, { onDelete: "cascade" }),
    previousScore: decimal("previous_score", { precision: 8, scale: 4 }),
    newScore: decimal("new_score", { precision: 8, scale: 4 }).notNull(),
    previousComponents: text("previous_components"),
    newComponents: text("new_components"),
    reason: text("reason").notNull().default("recalculation"),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  },
  (table) => [
    index("score_history_gameId_idx").on(table.gameId),
    index("score_history_calculatedAt_idx").on(table.calculatedAt),
  ],
);

export const scoreRecalculationJobs = pgTable(
  "score_recalculation_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: text("status").notNull().default("pending"),
    totalGames: integer("total_games").notNull().default(0),
    processedGames: integer("processed_games").notNull().default(0),
    failedGames: integer("failed_games").notNull().default(0),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("score_recalculation_jobs_status_idx").on(table.status)],
);
