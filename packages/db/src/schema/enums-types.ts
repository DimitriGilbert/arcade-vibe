/**
 * Type exports for database enums.
 *
 * This file provides:
 * - Type-only exports for TypeScript type checking
 * - Runtime enum objects for value iteration/validation
 *
 * @example
 * // Type-only import
 * import type { GameStatus, PromptStatus } from "@arcade-vibe/db";
 *
 * // Value import for runtime usage
 * import { gameStatusEnum } from "@arcade-vibe/db";
 * const statuses = gameStatusEnum.enumValues; // ['generating', 'completed', 'failed', 'hidden']
 */

import {
  gameStatusEnum,
  libraryCategoryEnum,
  libraryStatusEnum,
  moderationAppealStatusEnum,
  moderationReportStatusEnum,
  moderationTargetTypeEnum,
  promptStatusEnum,
  providerEnum,
  themeStatusEnum,
  userRoleEnum,
  visibilityEnum,
} from "./enums";

// Re-export runtime enum objects for value access
export {
  gameStatusEnum,
  libraryCategoryEnum,
  libraryStatusEnum,
  moderationAppealStatusEnum,
  moderationReportStatusEnum,
  moderationTargetTypeEnum,
  promptStatusEnum,
  providerEnum,
  themeStatusEnum,
  userRoleEnum,
  visibilityEnum,
};

// Extract types from pgEnum definitions
// PgEnum<T> creates both runtime values and types

/** Theme status values: upcoming, active, frozen, archived */
export type ThemeStatus = (typeof themeStatusEnum.enumValues)[number];

/** Visibility values: private, public_on_freeze, public */
export type Visibility = (typeof visibilityEnum.enumValues)[number];

/** Prompt status values: draft, submitted, disqualified */
export type PromptStatus = (typeof promptStatusEnum.enumValues)[number];

/** Game status values: generating, completed, failed, hidden */
export type GameStatus = (typeof gameStatusEnum.enumValues)[number];

/** User role values: admin, moderator, participant, viewer */
export type UserRole = (typeof userRoleEnum.enumValues)[number];

/** Provider values: openai, anthropic, google, openrouter, deepseek, glm, glm-coding-plan, moonshot, custom */
export type Provider = (typeof providerEnum.enumValues)[number];

/** Moderation report status values: pending, reviewing, resolved, dismissed */
export type ModerationReportStatus =
  (typeof moderationReportStatusEnum.enumValues)[number];

/** Moderation appeal status values: pending, reviewing, approved, rejected */
export type ModerationAppealStatus =
  (typeof moderationAppealStatusEnum.enumValues)[number];

/** Moderation target type values: prompt, game, user, review */
export type ModerationTargetType =
  (typeof moderationTargetTypeEnum.enumValues)[number];

/** Library category values: game_engine, physics, audio, graphics, utility, analytics, other */
export type LibraryCategory = (typeof libraryCategoryEnum.enumValues)[number];

/** Library status values: active, disabled */
export type LibraryStatus = (typeof libraryStatusEnum.enumValues)[number];

// Array constants for runtime usage (derived from enum values)
export const THEME_STATUSES = themeStatusEnum.enumValues;
export const VISIBILITIES = visibilityEnum.enumValues;
export const PROMPT_STATUSES = promptStatusEnum.enumValues;
export const GAME_STATUSES = gameStatusEnum.enumValues;
export const USER_ROLES = userRoleEnum.enumValues;
export const PROVIDERS = providerEnum.enumValues;
export const MODERATION_REPORT_STATUSES = moderationReportStatusEnum.enumValues;
export const MODERATION_APPEAL_STATUSES = moderationAppealStatusEnum.enumValues;
export const MODERATION_TARGET_TYPES = moderationTargetTypeEnum.enumValues;
export const LIBRARY_CATEGORIES = libraryCategoryEnum.enumValues;
export const LIBRARY_STATUSES = libraryStatusEnum.enumValues;
