import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { prompts } from "./prompts";
import { themes } from "./themes";
import { games as gamesImport } from "./games";
import { user } from "./auth";

// per PRD lines 1309-1320
export const promptRuns = pgTable(
  "prompt_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesImport.id, { onDelete: "cascade" }),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cost: text("cost").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompt_runs_promptId_idx").on(table.promptId),
    index("prompt_runs_gameId_idx").on(table.gameId),
  ],
);

// per PRD lines 1323-1346
export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesImport.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id").references(() => themes.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    promptQuality: integer("prompt_quality"),
    gameQuality: integer("game_quality"),
    themeRelevance: integer("theme_relevance"),
    overall: integer("overall").notNull(),
    feedback: text("feedback"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ratings_promptId_idx").on(table.promptId),
    index("ratings_gameId_idx").on(table.gameId),
    index("ratings_themeId_idx").on(table.themeId),
    index("ratings_userId_idx").on(table.userId),
    index("idx_ratings_game_user").on(table.gameId, table.userId),
    unique("ratings_userId_promptId_gameId_key").on(
      table.userId,
      table.promptId,
      table.gameId,
    ),
    check("ratings_range_check", sql`
      (prompt_quality IS NULL OR prompt_quality BETWEEN 1 AND 5) AND
      (game_quality IS NULL OR game_quality BETWEEN 1 AND 5) AND
      (theme_relevance IS NULL OR theme_relevance BETWEEN 1 AND 5) AND
      overall BETWEEN 1 AND 5
    `),
  ],
);
