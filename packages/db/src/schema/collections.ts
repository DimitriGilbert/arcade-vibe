import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { games } from "./games";

export const COLLECTION_NAME_MIN_LENGTH = 1;
export const COLLECTION_NAME_MAX_LENGTH = 80;
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 280;

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("collections_userId_idx").on(table.userId),
    index("collections_isPublic_idx").on(table.isPublic),
    index("collections_createdAt_idx").on(table.createdAt),
  ],
);

export const collectionGames = pgTable(
  "collection_games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    index("collection_games_collectionId_idx").on(table.collectionId),
    index("collection_games_gameId_idx").on(table.gameId),
    unique("collection_games_collectionId_gameId_key").on(
      table.collectionId,
      table.gameId,
    ),
  ],
);
