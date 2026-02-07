import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { moderationReportStatusEnum, moderationAppealStatusEnum, moderationTargetTypeEnum } from "./enums";
import { user } from "./auth";

// per PRD lines 1394-1410 - Moderation reports table
export const moderationReports = pgTable(
  "moderation_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: moderationTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id"),
    targetUserId: text("target_user_id").references(() => user.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    description: text("description"),
    status: moderationReportStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("moderation_reports_reporterId_idx").on(table.reporterId),
    index("moderation_reports_targetType_targetId_idx").on(table.targetType, table.targetId),
    index("moderation_reports_targetUserId_idx").on(table.targetUserId),
    index("moderation_reports_status_idx").on(table.status),
  ],
);

// per PRD lines 1412-1427 - Moderation appeals table
export const moderationAppeals = pgTable(
  "moderation_appeals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => moderationReports.id, { onDelete: "cascade" }),
    appellantId: text("appellant_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    evidence: text("evidence"),
    status: moderationAppealStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    decisionNotes: text("decision_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("moderation_appeals_reportId_idx").on(table.reportId),
    index("moderation_appeals_appellantId_idx").on(table.appellantId),
    index("moderation_appeals_status_idx").on(table.status),
  ],
);
