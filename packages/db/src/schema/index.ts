export * from "./auth";
export * from "./todo";
export * from "./enums";
export * from "./users";
export * from "./credits";
export * from "./models";
export * from "./themes";
export * from "./prompts";
export * from "./games";
export * from "./ratings";
export * from "./scores";
export * from "./platform";
export * from "./moderation";
export * from "./relations";

import { index, type IndexBuilder } from "drizzle-orm/pg-core";
import { scores } from "./scores";
import { games } from "./games";
import { prompts } from "./prompts";
import { ratings } from "./ratings";
import { userExtended } from "./users";
import { moderationReports, moderationAppeals } from "./moderation";
import { modelConfig } from "./models";

export const indexDefinitions: Record<string, IndexBuilder> = {
  // Leaderboard queries
  idx_scores_theme_final: index("idx_scores_theme_final").on(
    scores.themeId,
    scores.score,
  ),
  idx_games_theme_submitted: index("idx_games_theme_submitted").on(
    games.promptId,
    games.status,
  ),

  // User queries
  idx_prompts_author_theme: index("idx_prompts_author_theme").on(
    prompts.authorId,
    prompts.themeId,
  ),
  idx_ratings_game_user: index("idx_ratings_game_user").on(
    ratings.gameId,
    ratings.userId,
  ),

  // Admin queries
  idx_games_status_hidden: index("idx_games_status_hidden").on(
    games.status,
  ),
  idx_users_suspended: index("idx_users_suspended").on(userExtended.isSuspended),

  // Model queries
  idx_model_config_active: index("idx_model_config_active").on(
    modelConfig.isActive,
    modelConfig.tier,
  ),

  // Moderation queries
  idx_moderation_status_created: index("idx_moderation_status_created").on(
    moderationReports.status,
    moderationReports.createdAt,
  ),
  idx_moderation_target_status: index("idx_moderation_target_status").on(
    moderationReports.targetType,
    moderationReports.status,
  ),
  idx_moderation_reporter_target: index("idx_moderation_reporter_target").on(
    moderationReports.reporterId,
    moderationReports.targetType,
    moderationReports.targetId,
  ),
  idx_appeals_status: index("idx_appeals_status").on(
    moderationAppeals.status,
    moderationAppeals.createdAt,
  ),
};
