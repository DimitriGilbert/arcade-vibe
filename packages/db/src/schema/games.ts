import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { gameStatusEnum } from "./enums";
import { prompts } from "./prompts";
import { themes } from "./themes";
import { user } from "./auth";
import { tierCosts } from "./credits";

// per PRD lines 1260-1278
export const games = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"), // User-provided game name, optional
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
