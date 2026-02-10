import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { libraryCategoryEnum, libraryStatusEnum } from "./enums";
import { user } from "./auth";
import { themes } from "./themes";

export const allowedLibraryPatterns = pgTable(
  "allowed_library_patterns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    urlPattern: text("url_pattern").notNull(),
    category: libraryCategoryEnum("category").notNull(),
    isGlobal: boolean("is_global").notNull().default(false),
    status: libraryStatusEnum("status").notNull().default("active"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("allowed_library_patterns_global_idx").on(table.isGlobal),
    index("allowed_library_patterns_status_idx").on(table.status),
    index("allowed_library_patterns_category_idx").on(table.category),
  ],
);

export const themeAllowedPatterns = pgTable(
  "theme_allowed_patterns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    themeId: uuid("theme_id")
      .notNull()
      .references(() => themes.id, { onDelete: "cascade" }),
    patternId: uuid("pattern_id")
      .notNull()
      .references(() => allowedLibraryPatterns.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("theme_allowed_patterns_themeId_idx").on(table.themeId),
    index("theme_allowed_patterns_patternId_idx").on(table.patternId),
    index("theme_allowed_patterns_unique_idx").on(table.themeId, table.patternId),
  ],
);
