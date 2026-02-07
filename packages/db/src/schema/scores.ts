import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  boolean,
} from "drizzle-orm/pg-core";
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
      .references(() => gamesImport.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id").references(() => themes.id, { onDelete: "set null" }),
    score: integer("score").notNull(),
    isHighScore: boolean("is_high_score").notNull().default(false),
    completionTime: integer("completion_time"),
    playedAt: timestamp("played_at").defaultNow().notNull(),
  },
  (table) => [
    index("scores_userId_idx").on(table.userId),
    index("scores_promptId_idx").on(table.promptId),
    index("scores_gameId_idx").on(table.gameId),
    index("scores_themeId_idx").on(table.themeId),
  ],
);
