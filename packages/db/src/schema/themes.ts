import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { themeStatusEnum, visibilityEnum } from "./enums";
import type { ThemeMediaConfig } from "./media-types";

// per PRD lines 1221-1232
export const themes = pgTable(
  "themes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: themeStatusEnum("status").notNull().default("upcoming"),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    requirements: jsonb("requirements").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    mediaConfig: jsonb("media_config").$type<ThemeMediaConfig>(),
    isPermanent: boolean("is_permanent").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("themes_title_key").on(table.title),
    index("idx_themes_status_dates").on(table.status, table.startDate, table.endDate),
    index("idx_themes_is_permanent").on(table.isPermanent),
  ],
);
