import { env } from "@arcade-vibe/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];

// Re-export schema for direct access
export { schema };

// Export enum types and runtime values for frontend usage
export type {
  GameStatus,
  LibraryCategory,
  LibraryStatus,
  ModerationAppealStatus,
  ModerationReportStatus,
  ModerationTargetType,
  PromptRelationType,
  PromptStatus,
  Provider,
  CreatorImplementation,
  ThemeStatus,
  UserRole,
  Visibility,
  LeaderboardImplementation,
} from "./schema/enums-types";

export {
  GAME_STATUSES,
  gameStatusEnum,
  LIBRARY_CATEGORIES,
  libraryCategoryEnum,
  LIBRARY_STATUSES,
  libraryStatusEnum,
  CREATOR_IMPLEMENTATIONS,
  creatorImplementationEnum,
  LEADERBOARD_IMPLEMENTATIONS,
  leaderboardImplementationEnum,
  MODERATION_APPEAL_STATUSES,
  moderationAppealStatusEnum,
  MODERATION_REPORT_STATUSES,
  moderationReportStatusEnum,
  MODERATION_TARGET_TYPES,
  moderationTargetTypeEnum,
  PROMPT_RELATION_TYPES,
  promptRelationEnum,
  PROMPT_STATUSES,
  promptStatusEnum,
  PROVIDERS,
  providerEnum,
  THEME_STATUSES,
  themeStatusEnum,
  USER_ROLES,
  userRoleEnum,
  VISIBILITIES,
  visibilityEnum,
} from "./schema/enums-types";
