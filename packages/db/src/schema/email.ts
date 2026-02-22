import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    resendId: text("resend_id"),

    emailType: text("email_type").notNull(),

    status: text("status").notNull().default("pending"),

    subject: text("subject").notNull(),

    fromEmail: text("from_email").notNull(),
    toEmail: text("to_email").notNull(),

    htmlContent: text("html_content"),
    textContent: text("text_content"),

    templateId: text("template_id"),
    templateVariables: jsonb("template_variables").$type<
      Record<string, unknown>
    >(),

    idempotencyKey: text("idempotency_key").notNull(),

    errorMessage: text("error_message"),

    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("email_logs_userId_idx").on(table.userId),
    index("email_logs_status_idx").on(table.status),
    index("email_logs_emailType_idx").on(table.emailType),
    index("email_logs_resendId_idx").on(table.resendId),
    index("email_logs_idempotencyKey_idx").on(table.idempotencyKey),
    index("email_logs_createdAt_idx").on(table.createdAt),
  ],
);

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull().unique(),

    subject: text("subject").notNull(),

    htmlContent: text("html_content").notNull(),
    textContent: text("text_content"),

    variables: jsonb("variables").$type<string[]>().default([]),

    isActive: boolean("is_active").notNull().default(true),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("email_templates_name_idx").on(table.name),
    index("email_templates_isActive_idx").on(table.isActive),
  ],
);

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
