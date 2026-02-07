# Arcade Vibe - Vision Document v2.0

## Mission
Create a competitive prompt engineering platform disguised as a retro arcade, where the game IS the meta-game: crafting the perfect one-shot prompt to generate playable arcade games.

## Core Philosophy
**"One prompt. One shot. One month to prove you're the best prompt engineer."**

This isn't about who can code the best game - it's about who can make AI code the best game. Every month is a fresh challenge, a new theme, and a clean leaderboard. The community doesn't just play games; they dissect prompts, fork strategies, and push the boundaries of what single-shot generation can achieve.

---

## The Experience

### For Participants (Prompt Engineers)
You receive a monthly theme with core requirements (scoring system, lives, levels, iframe compatibility). You craft a single-message prompt with zero context, zero history - pure instruction. You choose your weapon from difficulty tiers:

- **Cheater Tier** (0.8x): GPT-5.3, Opus-4.6 - The easy road
- **Easy Tier** (0.9x): Sonnet-4.5 - Still pretty comfortable  
- **Normal Tier** (1.0x): GLM-4.7, Kimi-k2.5 - The baseline
- **Hard Tier** (1.25x): Deepseek-3.2, GPT-5.1-mini, Haiku-4.5 - Real challenge
- **Impossible Tier** (2.5x): Tiny models (<7B params) - Glory awaits

You iterate privately, creating versions and forks. Each attempt is preserved - your evolution as a prompt engineer is documented. When you're ready, you publish. The community plays your game, rates it, and - here's the kicker - can run your prompt on different models to see if your prompt was model-specific genius or universal excellence.

Your score combines:
- **Quality** (40%): Bayesian average rating × 20
- **Difficulty** (25%): Model tier multiplier × 20  
- **Efficiency** (20%): Brevity bonus (logarithmic, peaks at ≤500 tokens) × 20
- **Engagement** (15%): Average playtime (capped at 5min) × 20

### For Players (The Community)
You browse the monthly arcade. Each game shows its difficulty badge. You play, you rate (minimum 60 seconds playtime required), you see the leaderboard shift in real-time. If a prompt is public, you can view its entire evolution - every fork, every refinement. You can even run that prompt yourself on a different model with your own API key, contributing to the meta-analysis of prompt portability.

Your profile tracks both your creations and your "prompt runs" - games you generated using others' prompts.

### Monthly Lifecycle
1. **Week 1**: Theme announcement. Chaos. Everyone experimenting.
2. **Week 2-3**: Refinement. Leaders emerge. Community testing intensifies.
3. **Week 4**: Final push. Leaderboard solidifies.
4. **Month End**: Rankings freeze. Games become permanent gallery pieces with locked rankings. New theme drops.

---

## Technical Architecture

### Stack (LOCKED - DO NOT MODIFY VERSIONS)
- **Frontend**: Next.js 16 (App Router)
- **API Layer**: tRPC v11 (type-safe, subscriptions for real-time)
- **Database**: Drizzle ORM on PostgreSQL 18
- **Auth**: Better Auth (OAuth: GitHub/Google)
- **Styling**: Tailwind v4 + shadcn/ui
- **AI Integration**: Vercel AI SDK v6 + AI SDK-React (streaming)
- **Validation**: Zod 4 (end-to-end type safety)
- **Queue System**: BullMQ (Redis-based generation jobs)
- **Storage**: Vercel Blob / S3 (game assets, CDN)
- **Caching**: Redis 7 (leaderboard, sessions, rate limits)

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js 16)                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Prompt     │  │     Game     │  │   Leaderboard    │  │
│   │   Editor     │  │    Player    │  │   & Profile      │  │
│   │  (Monaco)    │  │  (iframe)    │  │  (WebSocket)     │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Admin      │  │   Version    │  │   Genealogy      │  │
│   │  Dashboard   │  │    Control   │  │    Tree          │  │
│   │  (Moderation)│  │  (Diff View) │  │  (react-flow)    │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ tRPC v11
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                   API Layer (tRPC Routers)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth    │ │ Prompts  │ │  Games   │ │  Leaderboard  │  │
│  │  Router  │ │  Router  │ │  Router  │ │   Router      │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Scoring  │ │  Themes  │ │   Runs   │ │     Admin     │  │
│  │  Engine  │ │  (Admin) │ │  (BYOK)  │ │  (Moderation) │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Generation Pipeline (BullMQ)               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │  Queue   │→ │ AI SDK   │→ │  Sanitization   │  │   │
│  │  │  Worker  │  │  (Multi- │  │  (DOMPurify)    │  │   │
│  │  │          │  │  Provider)│  │                  │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │
              ┌───────────┴──────────┐
              ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   PostgreSQL 18  │   │     Redis 7      │
    │  (Drizzle ORM)   │   │                  │
    │  ┌────────────┐  │   │  ┌────────────┐  │
    │  │ users      │  │   │  │ sessions   │  │
    │  │ themes     │  │   │  │ lb_cache   │  │
    │  │ prompts    │  │   │  │ rate_limit │  │
    │  │ games      │  │   │  │ job_queue  │  │
    │  │ ratings    │  │   │  └────────────┘  │
    │  │ scores     │  │   │                  │
    │  │ prompt_runs│  │   │                  │
    │  └────────────┘  │   │                  │
    └──────────────────┘   └──────────────────┘
              │
              ▼
    ┌──────────────────────────────────────────┐
    │         External AI Providers            │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
    │  │ OpenAI   │ │ Anthropic│ │ DeepSeek │ │
    │  │ (BYOK)   │ │  (BYOK)  │ │  (BYOK)  │ │
    │  └──────────┘ └──────────┘ └──────────┘ │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
    │  │GLM/Zhipu │ │ Moonshot │ │OpenRouter│ │
    │  │  (BYOK)  │ │  (BYOK)  │ │  (BYOK)  │ │
    │  └──────────┘ └──────────┘ └──────────┘ │
    └──────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────────┐
    │      CDN / Storage (Vercel Blob/S3)      │
    │  - Generated game HTML/JS files          │
    │  - Static assets for iframe rendering    │
    │  - User uploaded resources (if any)      │
    └──────────────────────────────────────────┘
```

### Key Technical Flows

#### 1. Prompt Submission & Generation
```typescript
// User flow
User crafts prompt → 
Selects model(s) + difficulty tier → 
Provides own API key (encrypted storage) →
[SUBMIT] →

// Backend flow (tRPC procedure)
Validate input (Zod schema) →
Store prompt version (Drizzle, immutable) →
Enqueue generation job (BullMQ) →
Return job ID to client →

// Worker flow (BullMQ)
Dequeue job →
AI SDK routes to provider (OpenAI/Anthropic/etc.) →
Single-shot generation (no history, system prompt hidden) →
Receive generated code →
Size validation (max 500KB) →
Upload to CDN (Vercel Blob/S3) →
Store metadata in DB (game record) →
Notify client via WebSocket (tRPC subscription) →
Update user dashboard
```

#### 2. Secure Game Execution
```typescript
// Iframe sandbox configuration
<iframe
  sandbox="allow-scripts" // NO allow-same-origin
  src="https://games.arcade-vibe.com/{game-id}" // Separate subdomain
  csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"
/>

// Game template (injected by server)
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>/* Basic arcade styling */</style>
</head>
<body>
  <!-- AI-generated game code inserted here (sanitized) -->
  <script>
    // Playtime tracking via postMessage
    let startTime = Date.now();
    setInterval(() => {
      window.parent.postMessage({
        type: 'playtime',
        duration: Math.floor((Date.now() - startTime) / 1000)
      }, '*');
    }, 5000);
    
    // Score reporting API
    function reportScore(score) {
      window.parent.postMessage({
        type: 'score',
        value: score
      }, '*');
    }
  </script>
</body>
</html>
```

#### 3. Real-Time Leaderboard Updates
```typescript
// tRPC subscription (client)
const { data: leaderboard } = trpc.leaderboard.subscribe.useSubscription(
  { themeId },
  {
    onData(data) {
      // Real-time leaderboard updates
    }
  }
);

// Server (tRPC router)
subscribe: publicProcedure
  .input(z.object({ themeId: z.string().uuid() }))
  .subscription(async function* ({ input, ctx }) {
    // Redis pub/sub for score changes
    const subscriber = redis.subscribe(`leaderboard:${input.themeId}`);
    
    for await (const message of subscriber) {
      // Fetch top 100 from Redis cache (5min TTL)
      const cached = await redis.get(`lb:${input.themeId}`);
      
      if (!cached) {
        // Cache miss: query DB, update Redis
        const top100 = await db.query.scores.findMany({
          where: eq(scores.themeId, input.themeId),
          orderBy: desc(scores.finalScore),
          limit: 100,
          with: { game: { with: { prompt: { with: { author: true }}}}}
        });
        await redis.setex(`lb:${input.themeId}`, 300, JSON.stringify(top100));
        yield top100;
      } else {
        yield JSON.parse(cached);
      }
    }
  })
```

#### 4. Scoring Algorithm (Composite)
```typescript
// Executed in background job (BullMQ) on new rating
async function calculateScore(gameId: string) {
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: { ratings: true, prompt: true }
  });
  
  // 1. Quality Score (40%) - Bayesian Average Rating
  const avgRating = game.ratings.length > 0
    ? game.ratings.reduce((sum, r) => sum + r.overallScore, 0) / game.ratings.length
    : 0;
  const globalAvgRating = 3.5; // Platform baseline
  const minVotes = 5;
  const bayesianRating = (
    (avgRating * game.ratings.length) + (globalAvgRating * minVotes)
  ) / (game.ratings.length + minVotes);
  const qualityScore = bayesianRating * 20; // Scale to 0-100
  
  // 2. Difficulty Score (25%) - Model Tier Multiplier
  const tierMultipliers = {
    'cheater': 0.8,
    'easy': 0.9,
    'normal': 1.0,
    'hard': 1.25,
    'impossible': 2.5
  };
  const difficultyScore = (tierMultipliers[game.modelTier] || 1.0) * 20;
  
  // 3. Efficiency Score (20%) - Brevity Bonus (Token Count)
  const tokenCount = game.prompt.tokenCount;
  const brevityBonus = tokenCount <= 500
    ? 1.0
    : Math.max(0, 1.0 - Math.log10(tokenCount / 500) / 2); // Logarithmic decay
  const efficiencyScore = brevityBonus * 20;
  
  // 4. Engagement Score (15%) - Average Playtime
  const avgPlaytimeSeconds = game.ratings.length > 0
    ? game.ratings.reduce((sum, r) => sum + r.playtimeSeconds, 0) / game.ratings.length
    : 0;
  const engagementNormalized = Math.min(avgPlaytimeSeconds / 300, 1.0); // Cap at 5 min
  const engagementScore = engagementNormalized * 20;
  
  // Final Score (weighted sum)
  const finalScore = 
    (qualityScore * 0.40) +
    (difficultyScore * 0.25) +
    (efficiencyScore * 0.20) +
    (engagementScore * 0.15);
  
  // Store in scores table
  await db.insert(scores).values({
    gameId,
    bayesianRating,
    difficultyMultiplier: tierMultipliers[game.modelTier],
    brevityScore: brevityBonus,
    engagementScore: engagementNormalized,
    finalScore,
    calculatedAt: new Date(),
    version: 1
  });
  
  // Publish to Redis for real-time leaderboard update
  await redis.publish(`leaderboard:${game.themeId}`, JSON.stringify({ gameId, finalScore }));
}
```

### Database Schema (Core Entities - Drizzle ORM)

```typescript
// Complete schema with all relationships

// Enums
export const themeStatusEnum = pgEnum('theme_status', ['upcoming', 'active', 'frozen', 'archived']);
export const visibilityEnum = pgEnum('visibility', ['private', 'public_on_freeze', 'public']);
export const promptStatusEnum = pgEnum('prompt_status', ['draft', 'submitted', 'disqualified']);
export const gameStatusEnum = pgEnum('game_status', ['generating', 'completed', 'failed', 'hidden']);
export const modelTierEnum = pgEnum('model_tier', ['cheater', 'easy', 'normal', 'hard', 'impossible']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator', 'participant', 'viewer']);

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  role: userRoleEnum('role').default('participant').notNull(),
  reputation: integer('reputation').default(0),
  isSuspended: boolean('is_suspended').default(false),
  suspensionReason: text('suspension_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys (encrypted storage)
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // openai, anthropic, openrouter
  encryptedKey: text('encrypted_key').notNull(), // AES-256 encrypted
  customEndpoint: varchar('custom_endpoint', { length: 500 }), // For compatible APIs
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Monthly Themes
export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  requirements: jsonb('requirements').notNull(), // { lives: true, levels: true, scoring: true, ... }
  systemPrompt: text('system_prompt').notNull(), // Hidden prompt with core requirements
  status: themeStatusEnum('status').default('upcoming').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Prompts (versioned, immutable)
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id').references(() => prompts.id), // For forks
  content: text('content').notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(), // SHA-256
  tokenCount: integer('token_count').notNull(), // cl100k_base tokenizer
  visibility: visibilityEnum('visibility').default('private').notNull(),
  status: promptStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Generated Games
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }).notNull(),
  modelKey: varchar('model_key', { length: 100 }).notNull(), // gpt-4-turbo, claude-3-opus, etc.
  modelTier: modelTierEnum('model_tier').notNull(),
  generatedCode: text('generated_code'), // Sanitized HTML/JS
  assetUrl: varchar('asset_url', { length: 500 }), // CDN URL
  executionTimeMs: integer('execution_time_ms'),
  tokenUsage: integer('token_usage'),
  status: gameStatusEnum('status').default('generating').notNull(),
  isSubmitted: boolean('is_submitted').default(false), // Official competition entry
  frozenRank: integer('frozen_rank'), // Null until theme freezes
  hiddenAt: timestamp('hidden_at'), // For admin moderation
  hiddenBy: uuid('hidden_by').references(() => users.id),
  hiddenReason: text('hidden_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Prompt Runs (community experiments)
export const promptRuns = pgTable('prompt_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalPromptId: uuid('original_prompt_id').references(() => prompts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  modelUsed: varchar('model_used', { length: 100 }).notNull(),
  generatedGameId: uuid('generated_game_id').references(() => games.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ratings
export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  overallScore: integer('overall_score').notNull(), // 1-5
  gameplayScore: integer('gameplay_score'), // 1-5
  visualsScore: integer('visuals_score'), // 1-5
  creativityScore: integer('creativity_score'), // 1-5
  technicalScore: integer('technical_score'), // 1-5
  playtimeSeconds: integer('playtime_seconds').notNull(),
  reviewText: text('review_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserGame: unique().on(table.gameId, table.userId), // One rating per user per game
}));

// Calculated Scores (materialized, recalculated on rating changes)
export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull().unique(),
  themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'cascade' }).notNull(),
  bayesianRating: decimal('bayesian_rating', { precision: 5, scale: 2 }),
  difficultyMultiplier: decimal('difficulty_multiplier', { precision: 3, scale: 2 }),
  brevityScore: decimal('brevity_score', { precision: 5, scale: 2 }),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }),
  finalScore: decimal('final_score', { precision: 8, scale: 4 }).notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
});

// Admin Actions Log (moderation audit trail)
export const adminActions = pgTable('admin_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // hide_game, suspend_user, unhide_game, etc.
  targetType: varchar('target_type', { length: 50 }).notNull(), // game, user, prompt
  targetId: uuid('target_id').notNull(),
  reason: text('reason'),
  metadata: jsonb('metadata'), // Additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes for performance
export const indexDefinitions = {
  // Leaderboard queries
  idx_scores_theme_final: index('idx_scores_theme_final').on(scores.themeId, scores.finalScore.desc()),
  idx_games_theme_submitted: index('idx_games_theme_submitted').on(games.promptId, games.isSubmitted, games.status),
  
  // User queries
  idx_prompts_author_theme: index('idx_prompts_author_theme').on(prompts.authorId, prompts.themeId),
  idx_ratings_game_user: index('idx_ratings_game_user').on(ratings.gameId, ratings.userId),
  
  // Admin queries
  idx_games_status_hidden: index('idx_games_status_hidden').on(games.status, games.hiddenAt),
  idx_users_suspended: index('idx_users_suspended').on(users.isSuspended),
};
```

### Admin Dashboard Features

**Content Moderation**
```typescript
// tRPC admin router (role-gated)
export const adminRouter = router({
  hideGame: adminProcedure // Requires role: 'admin' | 'moderator'
    .input(z.object({
      gameId: z.string().uuid(),
      reason: z.string().min(10).max(500)
    }))
    .mutation(async ({ input, ctx }) => {
      // Update game status
      await db.update(games)
        .set({
          status: 'hidden',
          hiddenAt: new Date(),
          hiddenBy: ctx.user.id,
          hiddenReason: input.reason
        })
        .where(eq(games.id, input.gameId));
      
      // Log action
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: 'hide_game',
        targetType: 'game',
        targetId: input.gameId,
        reason: input.reason
      });
      
      // Invalidate leaderboard cache
      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        with: { prompt: { columns: { themeId: true }}}
      });
      await redis.del(`lb:${game.prompt.themeId}`);
      
      return { success: true };
    }),
    
  suspendUser: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10).max(500),
      duration: z.enum(['7d', '30d', 'permanent'])
    }))
    .mutation(async ({ input, ctx }) => {
      await db.update(users)
        .set({
          isSuspended: true,
          suspensionReason: input.reason
        })
        .where(eq(users.id, input.userId));
      
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: 'suspend_user',
        targetType: 'user',
        targetId: input.userId,
        reason: input.reason,
        metadata: { duration: input.duration }
      });
      
      return { success: true };
    }),
    
  getModerationQueue: adminProcedure
    .query(async () => {
      // Games flagged by community
      const flaggedGames = await db.query.games.findMany({
        where: and(
          eq(games.status, 'completed'),
          // Add flagging logic here
        ),
        limit: 50,
        orderBy: desc(games.createdAt),
        with: {
          prompt: { with: { author: true }},
          ratings: { where: lte(ratings.overallScore, 2) } // Low-rated
        }
      });
      
      return flaggedGames;
    }),
});
```

**Admin UI Components** (shadcn/ui based)
- **Moderation Dashboard**: Table with flagged games, low ratings, user reports
- **Game Viewer**: Iframe preview with "Hide Game" button + reason textarea
- **User Management**: List of users with "Suspend" action, duration selector
- **Audit Log**: Filterable table of all admin actions with undo capability
- **Theme Management**: CRUD interface for monthly challenges

---

## API Key Management (BYOK Model)

### Storage & Encryption
```typescript
// Server-side encryption using environment KMS key
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export function encryptApiKey(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptApiKey(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// tRPC procedure for storing keys
export const apiKeysRouter = router({
  addKey: protectedProcedure
    .input(z.object({
      provider: z.enum(['openai', 'anthropic', 'openrouter', 'deepseek', 'glm', 'moonshot']),
      apiKey: z.string().min(10),
      customEndpoint: z.string().url().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { encrypted, iv, tag } = encryptApiKey(input.apiKey);
      
      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        provider: input.provider,
        encryptedKey: `${encrypted}:${iv}:${tag}`,
        customEndpoint: input.customEndpoint,
        isActive: true
      });
      
      return { success: true };
    }),
});
```

### AI SDK Integration (Multi-Provider)
```typescript
// Generation worker (BullMQ)
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

async function executeGeneration(job: Job) {
  const { promptId, modelKey, userApiKeyId } = job.data;
  
  // Fetch encrypted key
  const keyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, userApiKeyId)
  });
  
  const [encrypted, iv, tag] = keyRecord.encryptedKey.split(':');
  const decryptedKey = decryptApiKey(encrypted, iv, tag);
  
  // Fetch prompt and system prompt
  const prompt = await db.query.prompts.findFirst({
    where: eq(prompts.id, promptId),
    with: { theme: true }
  });
  
  const fullPrompt = `${prompt.theme.systemPrompt}

USER PROMPT:
${prompt.content}`;
  
  // Configure model provider
  let model;
  if (modelKey.startsWith('gpt-')) {
    model = openai(modelKey, {
      apiKey: decryptedKey,
      baseURL: keyRecord.customEndpoint // Support compatible APIs
    });
  } else if (modelKey.startsWith('claude-')) {
    model = anthropic(modelKey, {
      apiKey: decryptedKey,
      baseURL: keyRecord.customEndpoint
    });
  }
  // Add more providers...
  
  // Execute generation
  const result = await generateText({
    model,
    prompt: fullPrompt,
    maxTokens: 8000,
  });
  
  // Upload to CDN
  const assetUrl = await uploadToCDN(sanitized, job.data.gameId);
  
  // Update database
  await db.update(games)
    .set({
      generatedCode: sanitized,
      assetUrl,
      executionTimeMs: result.usage.totalTokens, // Proxy metric
      tokenUsage: result.usage.totalTokens,
      status: 'completed'
    })
    .where(eq(games.id, job.data.gameId));
  
  return { gameId: job.data.gameId, assetUrl };
}
```

---

## Scoring Weight Adjustability

### Database Schema for Dynamic Weights
```typescript
export const scoringWeights = pgTable('scoring_weights', {
  id: uuid('id').primaryKey().defaultRandom(),
  themeId: uuid('theme_id').references(() => themes.id).unique(),
  qualityWeight: decimal('quality_weight', { precision: 3, scale: 2 }).default('0.40'),
  difficultyWeight: decimal('difficulty_weight', { precision: 3, scale: 2 }).default('0.25'),
  efficiencyWeight: decimal('efficiency_weight', { precision: 3, scale: 2 }).default('0.20'),
  engagementWeight: decimal('engagement_weight', { precision: 3, scale: 2 }).default('0.15'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
});
```

### Admin Interface for Weight Tuning
```typescript
export const adminRouter = router({
  updateScoringWeights: adminProcedure
    .input(z.object({
      themeId: z.string().uuid(),
      weights: z.object({
        quality: z.number().min(0).max(1),
        difficulty: z.number().min(0).max(1),
        efficiency: z.number().min(0).max(1),
        engagement: z.number().min(0).max(1)
      }).refine(
        (w) => Math.abs((w.quality + w.difficulty + w.efficiency + w.engagement) - 1.0) < 0.01,
        { message: 'Weights must sum to 1.0' }
      )
    }))
    .mutation(async ({ input, ctx }) => {
      await db.insert(scoringWeights)
        .values({
          themeId: input.themeId,
          qualityWeight: input.weights.quality.toFixed(2),
          difficultyWeight: input.weights.difficulty.toFixed(2),
          efficiencyWeight: input.weights.efficiency.toFixed(2),
          engagementWeight: input.weights.engagement.toFixed(2),
          updatedBy: ctx.user.id
        })
        .onConflictDoUpdate({
          target: scoringWeights.themeId,
          set: {
            qualityWeight: input.weights.quality.toFixed(2),
            difficultyWeight: input.weights.difficulty.toFixed(2),
            efficiencyWeight: input.weights.efficiency.toFixed(2),
            engagementWeight: input.weights.engagement.toFixed(2),
            updatedAt: new Date(),
            updatedBy: ctx.user.id
          }
        });
      
      // Trigger score recalculation for theme
      await recalculateThemeScores(input.themeId);
      
      return { success: true };
    }),
});
```

---

## What Makes This Different

This isn't another "build games with AI" tool. It's a **competitive sport for prompt engineers** with:

- **Zero hand-holding**: One shot means one shot. No iteration mid-generation.
- **Difficulty as strategy**: Smaller models = higher multipliers. Risk/reward.
- **Radical transparency**: Public prompts become community learning resources.
- **Anti-gaming**: Brevity scoring prevents prompt dumping from other AIs.
- **Persistent legacy**: Every month's games live forever with frozen rankings.
- **Full BYOK model**: Users control costs, we provide the arena.
- **Admin control**: Comprehensive moderation tools for quality maintenance.
- **Adjustable scoring**: Platform can tune formula as meta evolves.

---

## Success Metrics (North Stars)

- **Engagement**: Average session length per game >5 min (launch) → >8 min (Month 6)
- **Quality**: % of entries rated ≥4 stars >40% (launch) → >55% (Month 6)
- **Virality**: Prompt runs : Original submissions >0.5:1 (launch) → >2:1 (Month 6)
- **Retention**: Month 1→2 participant return rate >35% (launch) → >50% (Month 6)
- **Innovation**: Model diversity (Shannon entropy) >2.5 (launch) → >3.0 (Month 6)

---

## Future Enhancements (Post-MVP)

**Monetization Options** (for premium users who don't want BYOK):
- **Starter Plan**: 10 free "Hard" tier generations/month
- **Pro Plan** ($19/mo): 100 generations across all tiers, priority queue
- **Team Plan** ($49/mo): Shared workspace, 500 generations, analytics dashboard

**Advanced Features:**
- **Team Competitions** (Q3 2026): Squad-based prompt engineering
- **Live Prompt Jams** (Q4 2026): 24-hour time-boxed events
- **Prompt Marketplace** (Q2 2027): Buy/sell proven templates
- **Model Leaderboards** (Q2 2027): Which AI is best at game generation?
- **API Access** (Q3 2026): Public REST/GraphQL for researchers

---

**This is the arena. The prompt is your weapon. The model is your handicap. The leaderboard is immortal. Welcome to Arcade Vibe.**
