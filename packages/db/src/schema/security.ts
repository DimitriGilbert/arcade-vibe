import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { games } from "./games";

// per PRD lines 396-402
export const suspiciousActivityLogs = pgTable(
  "suspicious_activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    gameId: uuid("game_id").references(() => games.id, { onDelete: "cascade" }),
    activityType: varchar("activity_type", { length: 50 }).notNull(),
    details: jsonb("details").notNull().$type<{
      reported?: number;
      maxAllowed?: number;
      wallClockElapsed?: number;
      [key: string]: unknown;
    }>(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("suspicious_activity_logs_userId_idx").on(table.userId),
    index("suspicious_activity_logs_gameId_idx").on(table.gameId),
    index("suspicious_activity_logs_activityType_idx").on(table.activityType),
  ],
);
