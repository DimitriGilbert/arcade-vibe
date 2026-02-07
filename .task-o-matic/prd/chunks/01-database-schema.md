# PRD Chunk 1: Database Schema & Core Entities

**Source**: `prd-refined.md` lines 1074-1483

## Stack Reference (Lines 61-76)

- **Database**: Drizzle ORM on PostgreSQL 18
- **Validation**: Zod 4 (end-to-end type safety)
- **Caching**: Redis 7 with Streams

---

## Enums (Lines 1078-1126)

```typescript
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
export const modelTierEnum = pgEnum("model_tier", [
  "cheater",
  "easy",
  "normal",
  "hard",
  "impossible",
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
```

---

## Users Table (Lines 1129-1140)

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  role: userRoleEnum("role").default("participant").notNull(),
  reputation: integer("reputation").default(0),
  credits: integer("credits").default(0).notNull(),
  isSuspended: boolean("is_suspended").default(false),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Credit Transactions (Lines 1143-1153)

```typescript
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer("amount").notNull(), // Positive for add, negative for deduct
  reason: varchar("reason", { length: 100 }).notNull(),
  modelKey: varchar("model_key", { length: 100 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Subscription Plans (Lines 1156-1173)

```typescript
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  priceUsd: integer("price_usd").notNull(), // In cents
  creditsPerMonth: integer("credits_per_month").notNull(),
  extraCreditMarkupPercent: integer("extra_credit_markup_percent").default(30).notNull(),
  minExtraCreditsPurchase: integer("min_extra_credits_purchase").default(25).notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  features: jsonb("features").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## User Subscriptions (Lines 1176-1189)

```typescript
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => subscriptionPlans.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## API Keys (Lines 1192-1202)

```typescript
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: providerEnum("provider").notNull(),
  encryptedKey: text("encrypted_key").notNull(), // AES-256 encrypted
  customEndpoint: varchar("custom_endpoint", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Model Config (Lines 1205-1218)

```typescript
export const modelConfig = pgTable("model_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: providerEnum("provider").notNull(),
  modelKey: varchar("model_key", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  tier: modelTierEnum("tier").notNull(),
  creditCost: integer("credit_cost").notNull(),
  isActive: boolean("is_active").default(true),
  supportsStreaming: boolean("supports_streaming").default(true),
  maxContextTokens: integer("max_context_tokens"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Themes (Lines 1221-1232)

```typescript
export const themes = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: jsonb("requirements").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  status: themeStatusEnum("status").default("upcoming").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Prompts (Lines 1235-1257)

```typescript
export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  themeId: uuid("theme_id")
    .references(() => themes.id, { onDelete: "cascade" })
    .notNull(),
  parentId: uuid("parent_id").references(() => prompts.id),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(), // SHA-256
  tokenCount: integer("token_count").notNull(),
  tokenizer: varchar("tokenizer", { length: 50 }).notNull(),
  version: integer("version").notNull().default(1),
  visibility: visibilityEnum("visibility").default("private").notNull(),
  status: promptStatusEnum("status").default("draft").notNull(),
  hiddenAt: timestamp("hidden_at"),
  hiddenBy: uuid("hidden_by").references(() => users.id),
  hiddenReason: text("hidden_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Games (Lines 1260-1278)

```typescript
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptId: uuid("prompt_id")
    .references(() => prompts.id, { onDelete: "cascade" })
    .notNull(),
  modelKey: varchar("model_key", { length: 100 }).notNull(),
  modelTier: modelTierEnum("model_tier").notNull(),
  generatedCode: text("generated_code"),
  assetUrl: varchar("asset_url", { length: 500 }),
  executionTimeMs: integer("execution_time_ms"),
  tokenUsage: integer("token_usage"),
  status: gameStatusEnum("status").default("generating").notNull(),
  isSubmitted: boolean("is_submitted").default(false),
  frozenRank: integer("frozen_rank"),
  hiddenAt: timestamp("hidden_at"),
  hiddenBy: uuid("hidden_by").references(() => users.id),
  hiddenReason: text("hidden_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Game Scores (Lines 1281-1306)

```typescript
export const gameScores = pgTable(
  "game_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    score: integer("score").notNull(),
    playtimeSeconds: integer("playtime_seconds").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => ({
    idx_game_score: index("idx_game_scores_game_score").on(
      table.gameId,
      table.score.desc(),
    ),
    idx_game_user: index("idx_game_scores_game_user").on(
      table.gameId,
      table.userId,
    ),
  }),
);
```

---

## Prompt Runs (Lines 1309-1320)

```typescript
export const promptRuns = pgTable("prompt_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalPromptId: uuid("original_prompt_id")
    .references(() => prompts.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  modelUsed: varchar("model_used", { length: 100 }).notNull(),
  generatedGameId: uuid("generated_game_id").references(() => games.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Ratings (Lines 1323-1346)

```typescript
export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    overallScore: integer("overall_score").notNull(), // 1-5
    gameplayScore: integer("gameplay_score"),
    visualsScore: integer("visuals_score"),
    creativityScore: integer("creativity_score"),
    technicalScore: integer("technical_score"),
    playtimeSeconds: integer("playtime_seconds").notNull(),
    reviewText: text("review_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserGame: unique().on(table.gameId, table.userId),
  }),
);
```

---

## Calculated Scores (Lines 1349-1369)

```typescript
export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .references(() => games.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  themeId: uuid("theme_id")
    .references(() => themes.id, { onDelete: "cascade" })
    .notNull(),
  bayesianRating: decimal("bayesian_rating", { precision: 5, scale: 2 }),
  difficultyMultiplier: decimal("difficulty_multiplier", { precision: 3, scale: 2 }),
  brevityScore: decimal("brevity_score", { precision: 5, scale: 2 }),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  popularityScore: decimal("popularity_score", { precision: 5, scale: 2 }),
  finalScore: decimal("final_score", { precision: 8, scale: 4 }).notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});
```

---

## Platform Stats (Lines 1372-1378)

```typescript
export const platformStats = pgTable("platform_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  statKey: varchar("stat_key", { length: 50 }).notNull().unique(),
  statValue: decimal("stat_value", { precision: 10, scale: 4 }).notNull(),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});
```

---

## Admin Actions (Lines 1381-1392)

```typescript
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .references(() => users.id)
    .notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id").notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Moderation Reports (Lines 1394-1410)

```typescript
export const moderationReports = pgTable("moderation_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: uuid("target_id").notNull(),
  reason: varchar("reason", { length: 50 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  resolutionAction: varchar("resolution_action", { length: 20 }),
  resolutionReason: text("resolution_reason"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Moderation Appeals (Lines 1412-1427)

```typescript
export const moderationAppeals = pgTable("moderation_appeals", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .references(() => moderationReports.id, { onDelete: "cascade" })
    .notNull(),
  appellantId: uuid("appellant_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  response: text("response"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Scoring Weights (Lines 2436-2462)

```typescript
export const scoringWeights = pgTable("scoring_weights", {
  id: uuid("id").primaryKey().defaultRandom(),
  themeId: uuid("theme_id")
    .references(() => themes.id)
    .unique(),
  qualityWeight: decimal("quality_weight", { precision: 3, scale: 2 }).default("0.40"),
  difficultyWeight: decimal("difficulty_weight", { precision: 3, scale: 2 }).default("0.25"),
  efficiencyWeight: decimal("efficiency_weight", { precision: 3, scale: 2 }).default("0.20"),
  engagementWeight: decimal("engagement_weight", { precision: 3, scale: 2 }).default("0.10"),
  popularityWeight: decimal("popularity_weight", { precision: 3, scale: 2 }).default("0.05"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
});
```

---

## Indexes (Lines 1429-1483)

```typescript
export const indexDefinitions = {
  // Leaderboard queries
  idx_scores_theme_final: index("idx_scores_theme_final").on(
    scores.themeId,
    scores.finalScore.desc(),
  ),
  idx_games_theme_submitted: index("idx_games_theme_submitted").on(
    games.promptId,
    games.isSubmitted,
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
    games.hiddenAt,
  ),
  idx_users_suspended: index("idx_users_suspended").on(users.isSuspended),

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
```
