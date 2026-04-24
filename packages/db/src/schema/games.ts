import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  boolean,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { gameStatusEnum } from "./enums";
import { prompts } from "./prompts";
import { themes } from "./themes";
import { user } from "./auth";
import { tierCosts } from "./credits";

export const GAME_NAME_MAX_LENGTH = 100;
export const GAME_NAME_MIN_LENGTH = 1;

export const games = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id").references(() => themes.id, {
      onDelete: "set null",
    }),
    status: gameStatusEnum("status").notNull().default("generating"),
    modelProvider: text("model_provider").notNull(),
    modelName: text("model_name").notNull(),
    tierCostId: uuid("tier_cost_id")
      .notNull()
      .references(() => tierCosts.id, { onDelete: "restrict" }),
    tokenUsage: integer("token_usage"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    reasoningTokens: integer("reasoning_tokens"),
    cachedInputTokens: integer("cached_input_tokens"),
    requestCostUsd: text("request_cost_usd"),
    generationTimeMs: integer("generation_time_ms"),
    timeToFirstTokenMs: integer("time_to_first_token_ms"),
    tokensPerSecond: doublePrecision("tokens_per_second"),
    gameData: text("game_data"),
    imageUrl: text("image_url"),
    generatedAt: timestamp("generated_at"),
    isHidden: boolean("is_hidden").default(false).notNull(),
    hiddenReason: text("hidden_reason"),
    hiddenAt: timestamp("hidden_at"),
    isSubmitted: boolean("is_submitted").default(false).notNull(),
    submittedAt: timestamp("submitted_at"),
    blockedScriptUrls: jsonb("blocked_script_urls").$type<string[]>(),
    sanitizationApplied: boolean("sanitization_applied")
      .default(false)
      .notNull(),
    strudelCode: text("strudel_code"),
    mediaUrls: jsonb("media_urls").$type<Record<string, string>>(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("games_promptId_idx").on(table.promptId),
    index("games_themeId_idx").on(table.themeId),
    index("idx_games_theme_submitted").on(
      table.promptId,
      table.isSubmitted,
      table.status,
    ),
    index("idx_games_status_hidden").on(table.status, table.hiddenAt),
    index("idx_games_deleted_at").on(table.deletedAt),
    index("idx_games_status_created").on(table.status, table.createdAt),
    index("idx_games_leaderboard_filter").on(
      table.themeId,
      table.isSubmitted,
      table.status,
      table.isHidden,
      table.deletedAt,
    ),
  ],
);

export const gameVersions = pgTable(
  "game_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    name: text("name"),
    gameData: text("game_data"),
    strudelCode: text("strudel_code"),
    mediaUrls: jsonb("media_urls").$type<Record<string, string>>(),
    changedBy: text("changed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    changeReason: text("change_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("game_versions_gameId_idx").on(table.gameId),
    index("idx_game_versions_game_version").on(table.gameId, table.version),
  ],
);

// per PRD lines 1281-1306
export const gameScores = pgTable(
  "game_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull().unique(),
    score: integer("score").notNull(),
    isHighScore: boolean("is_high_score").notNull().default(false),
    completionTime: integer("completion_time"),
    playedAt: timestamp("played_at").defaultNow().notNull(),
  },
  (table) => [
    index("game_scores_gameId_idx").on(table.gameId),
    index("game_scores_userId_idx").on(table.userId),
  ],
);

export const gameSessionMetrics = pgTable(
  "game_session_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull().unique(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    playtimeSeconds: integer("playtime_seconds").notNull().default(0),
    hasScoreEvent: boolean("has_score_event").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("game_session_metrics_gameId_idx").on(table.gameId),
    index("game_session_metrics_userId_idx").on(table.userId),
    index("game_session_metrics_endedAt_idx").on(table.endedAt),
    index("idx_game_session_metrics_game_ended").on(table.gameId, table.endedAt),
  ],
);
