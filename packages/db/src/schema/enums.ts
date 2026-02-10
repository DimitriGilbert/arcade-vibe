import { pgEnum } from "drizzle-orm/pg-core";

// per PRD lines 1078-1126

export const themeStatusEnum = pgEnum("theme_status", [
  "upcoming",
  "active",
  "frozen",
  "archived",
]);

export const visibilityEnum = pgEnum("visibility", [
  "private",
  "public_on_freeze",
  "public",
]);

export const promptStatusEnum = pgEnum("prompt_status", [
  "draft",
  "submitted",
  "disqualified",
]);

export const gameStatusEnum = pgEnum("game_status", [
  "generating",
  "completed",
  "failed",
  "hidden",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "moderator",
  "participant",
  "viewer",
]);

export const providerEnum = pgEnum("provider", [
  "openai",
  "anthropic",
  "google",
  "openrouter",
  "deepseek",
  "glm",
  "glm-coding-plan",
  "moonshot",
  "custom",
]);

export const moderationReportStatusEnum = pgEnum("moderation_report_status", [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const moderationAppealStatusEnum = pgEnum("moderation_appeal_status", [
  "pending",
  "reviewing",
  "approved",
  "rejected",
]);

export const moderationTargetTypeEnum = pgEnum("moderation_target_type", [
  "prompt",
  "game",
  "user",
  "review",
]);

export const libraryCategoryEnum = pgEnum("library_category", [
  "game_engine",
  "physics",
  "audio",
  "graphics",
  "utility",
  "analytics",
  "other",
]);

export const libraryStatusEnum = pgEnum("library_status", [
  "active",
  "disabled",
]);
