import { relations } from "drizzle-orm";
import { user, session, account, verification } from "./auth";
import { userExtended } from "./users";
import {
  creditTransactions,
  creditBatches,
  subscriptionPlans,
  userSubscriptions,
  tierCosts,
} from "./credits";
import { apiKeys, modelConfig, modelProviders } from "./models";
import { themes } from "./themes";
import { prompts } from "./prompts";
import { games, gameScores, gameVersions } from "./games";
import { promptRuns, ratings } from "./ratings";
import { scores } from "./scores";
import { platformStats, adminActions, scoringWeights } from "./platform";
import { moderationReports, moderationAppeals } from "./moderation";
import {
  allowedLibraryPatterns,
  themeAllowedPatterns,
} from "./library-patterns";
import { feedback } from "./feedback";
import { emailLogs, emailTemplates } from "./email";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  userExtended: one(userExtended, {
    fields: [user.id],
    references: [userExtended.id],
  }),
  creditTransactions: many(creditTransactions),
  creditBatches: many(creditBatches),
  userSubscriptions: many(userSubscriptions),
  apiKeys: many(apiKeys),
  prompts: many(prompts),
  moderationReports: many(moderationReports),
  moderationAppeals: many(moderationAppeals),
  adminActions: many(adminActions),
  ratings: many(ratings),
  scores: many(scores),
  gameScores: many(gameScores),
  feedback: many(feedback),
  emailLogs: many(emailLogs),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verificationRelations = relations(verification, () => ({}));

export const userExtendedRelations = relations(userExtended, ({ one }) => ({
  user: one(user, {
    fields: [userExtended.id],
    references: [user.id],
  }),
}));

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    user: one(user, {
      fields: [creditTransactions.userId],
      references: [user.id],
    }),
    batch: one(creditBatches, {
      fields: [creditTransactions.batchId],
      references: [creditBatches.id],
    }),
  }),
);

export const creditBatchesRelations = relations(
  creditBatches,
  ({ one, many }) => ({
    user: one(user, {
      fields: [creditBatches.userId],
      references: [user.id],
    }),
    transactions: many(creditTransactions),
  }),
);

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    userSubscriptions: many(userSubscriptions),
  }),
);

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(user, {
      fields: [userSubscriptions.userId],
      references: [user.id],
    }),
    plan: one(subscriptionPlans, {
      fields: [userSubscriptions.planId],
      references: [subscriptionPlans.id],
    }),
  }),
);

export const tierCostsRelations = relations(tierCosts, ({ many }) => ({
  models: many(modelConfig),
  games: many(games),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(user, {
    fields: [apiKeys.userId],
    references: [user.id],
  }),
}));

export const themesRelations = relations(themes, ({ many }) => ({
  prompts: many(prompts),
  scoringWeights: many(scoringWeights),
  scores: many(scores),
  themeAllowedPatterns: many(themeAllowedPatterns),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  user: one(user, {
    fields: [prompts.authorId],
    references: [user.id],
  }),
  theme: one(themes, {
    fields: [prompts.themeId],
    references: [themes.id],
  }),
  games: many(games),
  promptRuns: many(promptRuns),
  ratings: many(ratings),
  scores: many(scores),
  forks: many(prompts, {
    relationName: "prompt_forks",
  }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  prompt: one(prompts, {
    fields: [games.promptId],
    references: [prompts.id],
  }),
  theme: one(themes, {
    fields: [games.themeId],
    references: [themes.id],
  }),
  tierCost: one(tierCosts, {
    fields: [games.tierCostId],
    references: [tierCosts.id],
  }),
  gameScores: many(gameScores),
  promptRuns: many(promptRuns),
  ratings: many(ratings),
  versions: many(gameVersions),
}));

export const gameVersionsRelations = relations(gameVersions, ({ one }) => ({
  game: one(games, {
    fields: [gameVersions.gameId],
    references: [games.id],
  }),
  changedByUser: one(user, {
    fields: [gameVersions.changedBy],
    references: [user.id],
  }),
}));

export const gameScoresRelations = relations(gameScores, ({ one }) => ({
  game: one(games, {
    fields: [gameScores.gameId],
    references: [games.id],
  }),
  user: one(user, {
    fields: [gameScores.userId],
    references: [user.id],
  }),
}));

export const promptRunsRelations = relations(promptRuns, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptRuns.promptId],
    references: [prompts.id],
  }),
  game: one(games, {
    fields: [promptRuns.gameId],
    references: [games.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  prompt: one(prompts, {
    fields: [ratings.promptId],
    references: [prompts.id],
  }),
  game: one(games, {
    fields: [ratings.gameId],
    references: [games.id],
  }),
  theme: one(themes, {
    fields: [ratings.themeId],
    references: [themes.id],
  }),
  user: one(user, {
    fields: [ratings.userId],
    references: [user.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(user, {
    fields: [scores.userId],
    references: [user.id],
  }),
  prompt: one(prompts, {
    fields: [scores.promptId],
    references: [prompts.id],
  }),
  game: one(games, {
    fields: [scores.gameId],
    references: [games.id],
  }),
  theme: one(themes, {
    fields: [scores.themeId],
    references: [themes.id],
  }),
}));

export const platformStatsRelations = relations(platformStats, () => ({}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(user, {
    fields: [adminActions.adminId],
    references: [user.id],
  }),
}));

export const scoringWeightsRelations = relations(scoringWeights, ({ one }) => ({
  theme: one(themes, {
    fields: [scoringWeights.themeId],
    references: [themes.id],
  }),
}));

export const moderationReportsRelations = relations(
  moderationReports,
  ({ one, many }) => ({
    reporter: one(user, {
      fields: [moderationReports.reporterId],
      references: [user.id],
    }),
    targetUser: one(user, {
      fields: [moderationReports.targetUserId],
      references: [user.id],
      relationName: "targetUserReports",
    }),
    reviewer: one(user, {
      fields: [moderationReports.reviewedBy],
      references: [user.id],
      relationName: "reviewedReports",
    }),
    appeals: many(moderationAppeals),
  }),
);

export const moderationAppealsRelations = relations(
  moderationAppeals,
  ({ one }) => ({
    report: one(moderationReports, {
      fields: [moderationAppeals.reportId],
      references: [moderationReports.id],
    }),
    appellant: one(user, {
      fields: [moderationAppeals.appellantId],
      references: [user.id],
    }),
    reviewer: one(user, {
      fields: [moderationAppeals.reviewedBy],
      references: [user.id],
      relationName: "reviewedAppeals",
    }),
  }),
);

export const modelConfigRelations = relations(modelConfig, ({ one, many }) => ({
  tierCost: one(tierCosts, {
    fields: [modelConfig.tierCostId],
    references: [tierCosts.id],
  }),
  providers: many(modelProviders),
}));

export const modelProvidersRelations = relations(modelProviders, ({ one }) => ({
  model: one(modelConfig, {
    fields: [modelProviders.modelConfigId],
    references: [modelConfig.id],
  }),
}));

export const allowedLibraryPatternsRelations = relations(
  allowedLibraryPatterns,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [allowedLibraryPatterns.createdById],
      references: [user.id],
    }),
    themeAllowedPatterns: many(themeAllowedPatterns),
  }),
);

export const themeAllowedPatternsRelations = relations(
  themeAllowedPatterns,
  ({ one }) => ({
    theme: one(themes, {
      fields: [themeAllowedPatterns.themeId],
      references: [themes.id],
    }),
    pattern: one(allowedLibraryPatterns, {
      fields: [themeAllowedPatterns.patternId],
      references: [allowedLibraryPatterns.id],
    }),
  }),
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(user, {
    fields: [emailLogs.userId],
    references: [user.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  creator: one(user, {
    fields: [emailTemplates.createdBy],
    references: [user.id],
  }),
}));
