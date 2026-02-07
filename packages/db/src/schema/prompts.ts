import { pgTable, uuid, text, integer, varchar, timestamp, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { themes } from "./themes";
import { visibilityEnum } from "./enums";
import { promptStatusEnum } from "./enums";

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: text("author_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  themeId: uuid("theme_id")
    .references(() => themes.id, { onDelete: "cascade" })
    .notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => prompts.id),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  tokenCount: integer("token_count").notNull(),
  tokenizer: varchar("tokenizer", { length: 50 }).notNull(),
  version: integer("version").notNull().default(1),
  visibility: visibilityEnum("visibility").default("private").notNull(),
  status: promptStatusEnum("status").default("draft").notNull(),
  hiddenAt: timestamp("hidden_at"),
  hiddenBy: text("hidden_by").references(() => user.id),
  hiddenReason: text("hidden_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("prompts_authorId_idx").on(table.authorId),
  index("prompts_themeId_idx").on(table.themeId),
  index("prompts_parentId_idx").on(table.parentId),
  index("prompts_contentHash_idx").on(table.contentHash),
  index("prompts_visibility_idx").on(table.visibility),
]);
