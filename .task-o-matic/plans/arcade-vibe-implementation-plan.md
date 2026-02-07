# Arcade Vibe - Implementation Plan v1.0

## Overview

Implement the complete Arcade Vibe platform as specified in `prd-refined.md` - a competitive prompt engineering platform disguised as a retro arcade. This plan implements the core MVP features with full type safety and production-ready code.

## Prerequisites

- pnpm@10.10.0 (already configured)
- PostgreSQL 18 database running
- Redis 7 with Streams support
- Node.js environment with TypeScript
- Existing packages: `@arcade-vibe/db`, `@arcade-vibe/api`, `@arcade-vibe/auth`

## Critical Implementation Rules

**FOR ALL IMPLEMENTER SUBAGENTS:**

1. **FULL TYPE SAFETY REQUIRED** - The use of `any` is **STRICTLY PROHIBITED** per `AGENTS.md`
2. **PRD LINE REFERENCES** - Every implementation MUST cite specific PRD line numbers (e.g., "per PRD lines 1129-1140")
3. **Zod Validation** - All inputs validated with Zod 4 schemas
4. **Drizzle ORM** - Use type-safe queries only
5. **tRPC v11** - Follow patterns in existing `packages/api/src/index.ts`
6. **Load Skills** - Load `trpc` skill when creating routers, `formedible` skill for forms, `vercel/ai@ai-sdk` for AI features

## Existing Code References

| Component | Location | Notes |
|-----------|----------|-------|
| Auth schema | `packages/db/src/schema/auth.ts` | Better Auth tables |
| Todo schema | `packages/db/src/schema/todo.ts` | Example schema pattern |
| Todo router | `packages/api/src/routers/todo.ts` | Example router pattern |
| tRPC setup | `packages/api/src/index.ts` | `router`, `publicProcedure`, `protectedProcedure` |
| Context | `packages/api/src/context.ts` | Session handling |

---

## Phase 1: Database Schema - Core Entities

**Type**: Sequential

**PRD Reference**: Lines 1074-1369 (Database Schema section)

**Requirements**:
- Define all enums as per PRD lines 1078-1126:
  - `themeStatusEnum`: upcoming, active, frozen, archived
  - `visibilityEnum`: private, public_on_freeze, public
  - `promptStatusEnum`: draft, submitted, disqualified
  - `gameStatusEnum`: generating, completed, failed, hidden
  - `modelTierEnum`: cheater, easy, normal, hard, impossible
  - `userRoleEnum`: admin, moderator, participant, viewer
  - `providerEnum`: openai, anthropic, google, openrouter, deepseek, glm, glm-coding-plan, moonshot, custom
- Extend users table (PRD lines 1129-1140): add `role`, `reputation`, `credits`, `isSuspended`, `suspensionReason`
- Define `creditTransactions` table (PRD lines 1143-1153)
- Define `subscriptionPlans` table (PRD lines 1156-1173)
- Define `userSubscriptions` table (PRD lines 1176-1189)
- Define `apiKeys` table (PRD lines 1192-1202)
- Define `modelConfig` table (PRD lines 1205-1218)
- Define `themes` table (PRD lines 1221-1232)
- Define `prompts` table (PRD lines 1235-1257)
- Define `games` table (PRD lines 1260-1278)
- Define `gameScores` table (PRD lines 1281-1306)
- Define `promptRuns` table (PRD lines 1309-1320)
- Define `ratings` table (PRD lines 1323-1346)
- Define `scores` table (PRD lines 1349-1369)

**Inputs**:
- Read: `packages/db/src/schema/auth.ts` (existing auth schema pattern)
- Read: `packages/db/src/schema/todo.ts` (example table pattern)
- Reference: PRD lines 1074-1369

**Outputs**:
- Create: `packages/db/src/schema/enums.ts`
- Create: `packages/db/src/schema/users.ts` (extend existing)
- Create: `packages/db/src/schema/credits.ts`
- Create: `packages/db/src/schema/subscriptions.ts`
- Create: `packages/db/src/schema/models.ts`
- Create: `packages/db/src/schema/themes.ts`
- Create: `packages/db/src/schema/prompts.ts`
- Create: `packages/db/src/schema/games.ts`
- Create: `packages/db/src/schema/ratings.ts`
- Create: `packages/db/src/schema/scores.ts`
- Modify: `packages/db/src/schema/index.ts` (export all new schemas)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All tables properly typed with Drizzle pgTable
- All foreign keys use `.references()` with proper onDelete actions
- All indexes defined per PRD lines 1429-1483
- NO `any` types anywhere

**Dependencies**: None (first phase)

---

## Phase 2: Database Schema - Moderation & Platform Stats

**Type**: Sequential

**PRD Reference**: Lines 1370-1483

**Requirements**:
- Define `platformStats` table (PRD lines 1372-1378)
- Define `adminActions` table (PRD lines 1381-1392)
- Define `moderationReports` table (PRD lines 1394-1410)
- Define `moderationAppeals` table (PRD lines 1412-1427)
- Define `scoringWeights` table (PRD lines 2436-2462)
- Create all performance indexes per PRD lines 1429-1483

**Inputs**:
- Read: Phase 1 schema files
- Reference: PRD lines 1370-1483, 2436-2462

**Outputs**:
- Create: `packages/db/src/schema/platform.ts`
- Create: `packages/db/src/schema/moderation.ts`
- Modify: `packages/db/src/schema/index.ts` (add exports)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All indexes exported correctly
- Foreign key relationships complete
- NO `any` types

**Dependencies**: Phase 1 must complete

---

## Phase 3: Database Relations & Client Setup

**Type**: Sequential

**Requirements**:
- Define Drizzle relations for all tables (one-to-many, many-to-many)
- Configure database client with relation queries enabled
- Export typed schema for use in tRPC procedures

**Inputs**:
- Read: All schema files from Phases 1-2
- Read: `packages/db/src/index.ts` (existing client setup)

**Outputs**:
- Create: `packages/db/src/schema/relations.ts`
- Modify: `packages/db/src/index.ts` (add relations to drizzle client)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- All relations properly typed
- NO `any` types

**Dependencies**: Phase 2 must complete

---

## Phase 4: Core Middleware & Procedures

**Type**: Sequential

**PRD Reference**: Auth/role-based access patterns throughout PRD

**Requirements**:
- Create `adminProcedure` - requires user.role === 'admin' (per PRD lines 1491, 1575, etc.)
- Create `moderatorProcedure` - requires user.role in ['admin', 'moderator'] (per PRD lines 1772, 1796, etc.)
- Add Redis client setup for sessions/caching (per PRD lines 74, 130-138)
- Create rate limiting middleware pattern

**Inputs**:
- Read: `packages/api/src/index.ts` (existing procedure definitions)
- Read: `packages/api/src/context.ts`
- Reference: PRD lines 1107-1112 (userRoleEnum)

**Outputs**:
- Modify: `packages/api/src/index.ts` (add new procedures)
- Create: `packages/api/src/lib/redis.ts`
- Create: `packages/api/src/middleware/rate-limit.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- adminProcedure throws UNAUTHORIZED for non-admins
- moderatorProcedure throws UNAUTHORIZED for non-moderators
- NO `any` types

**Dependencies**: Phase 3 must complete

---

## Phase 5: Credits & Subscriptions Router

**Type**: Sequential

**PRD Reference**: Lines 2198-2245 (Pricing & Credits System)

**Requirements**:
- Implement `creditsRouter` with:
  - `getBalance`: Get user credit balance
  - `getTransactions`: List credit transaction history
  - `deductCredits`: Internal helper (not exposed)
  - `addCredits`: Admin-only credit grant
- Implement credit cost calculation per model (PRD lines 2225-2233)
- Implement extra credit pricing logic (PRD lines 2215-2222)

**Inputs**:
- Read: `packages/db/src/schema/credits.ts`
- Read: `packages/api/src/index.ts`
- Reference: PRD lines 2198-2245

**Outputs**:
- Create: `packages/api/src/routers/credits.ts`
- Create: `packages/api/src/lib/credits.ts` (helper functions)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Credit deduction is transactional (audit trail)
- All Zod schemas validate inputs
- NO `any` types

**Dependencies**: Phase 4 must complete

---

## Phase 6: Themes Router

**Type**: Sequential

**PRD Reference**: Lines 1221-1232 (themes table), Lines 50-56 (Monthly Lifecycle)

**Requirements**:
- Implement `themesRouter` with:
  - `list`: Get all themes (public)
  - `getCurrent`: Get active theme
  - `getById`: Get theme by ID
  - `create`: Admin-only theme creation
  - `update`: Admin-only theme update
  - `updateStatus`: Admin-only status change (upcoming→active→frozen→archived)
- Theme lifecycle validation (no going backwards)

**Inputs**:
- Read: `packages/db/src/schema/themes.ts`
- Read: `packages/api/src/index.ts`
- Reference: PRD lines 50-56, 1221-1232

**Outputs**:
- Create: `packages/api/src/routers/themes.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Status transitions validated
- systemPrompt not exposed in public queries
- NO `any` types

**Dependencies**: Phase 5 must complete

---

## Phase 7: Prompts Router (Core CRUD)

**Type**: Sequential

**PRD Reference**: Lines 1235-1257 (prompts table), Lines 886-920 (prompts procedures)

**Requirements**:
- Implement `promptsRouter` with:
  - `create`: Create new prompt (protected)
  - `update`: Create new version (immutable - creates new record)
  - `fork`: Fork another user's prompt (protected)
  - `getById`: Get prompt by ID (respects visibility)
  - `listVersions`: List all versions of a prompt (PRD lines 904-918)
  - `getVersion`: Get specific version (PRD lines 887-902)
  - `listMine`: List user's own prompts
  - `listPublic`: List public prompts for theme
- Token counting using AI SDK tokenizer (PRD line 1247)
- Content hashing with SHA-256 (PRD line 1245)

**Inputs**:
- Read: `packages/db/src/schema/prompts.ts`
- Read: `packages/api/src/routers/todo.ts` (pattern reference)
- Reference: PRD lines 1235-1257, 886-920

**Outputs**:
- Create: `packages/api/src/routers/prompts.ts`
- Create: `packages/api/src/lib/tokenizer.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Immutability enforced (no UPDATE, only INSERT with version++)
- Visibility rules enforced
- NO `any` types

**Dependencies**: Phase 6 must complete

---

## Phase 8: API Keys Router (BYOK)

**Type**: Sequential

**PRD Reference**: Lines 2249-2336 (API Key Management)

**Requirements**:
- Implement `apiKeysRouter` with:
  - `addKey`: Store encrypted API key (PRD lines 2304-2335)
  - `listKeys`: List user's keys (masked)
  - `deleteKey`: Remove API key
  - `testKey`: Validate key works with provider
- Implement AES-256-GCM encryption (PRD lines 2254-2301)
- Never expose decrypted keys in responses

**Inputs**:
- Read: `packages/db/src/schema/models.ts` (apiKeys table)
- Reference: PRD lines 2249-2336

**Outputs**:
- Create: `packages/api/src/routers/api-keys.ts`
- Create: `packages/api/src/lib/encryption.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Keys encrypted at rest
- Keys never returned in API responses (only masked versions)
- NO `any` types

**Dependencies**: Phase 5 must complete

---

## Phase 9: Model Config Router (Admin)

**Type**: Sequential

**PRD Reference**: Lines 1205-1218 (modelConfig table), Lines 1574-1680 (admin router)

**Requirements**:
- Implement model management in admin router:
  - `getModels`: List all models (PRD lines 1577-1580)
  - `toggleModelActive`: Activate/deactivate model (PRD lines 1584-1605)
  - `updateModelPricing`: Change credit cost (PRD lines 1608-1637)
  - `addModel`: Add new model (PRD lines 1640-1678)
- Log all actions to adminActions table

**Inputs**:
- Read: `packages/db/src/schema/models.ts`
- Reference: PRD lines 1205-1218, 1574-1680

**Outputs**:
- Create: `packages/api/src/routers/admin/models.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All actions logged to adminActions
- Only admins can access
- NO `any` types

**Dependencies**: Phase 4 must complete

---

## Phase 10: AI Provider Factory

**Type**: Sequential

**PRD Reference**: Lines 2339-2427 (AI SDK Integration)

**Requirements**:
- Implement `getProviderModel` factory function (PRD lines 2348-2426)
- Support all providers: openai, anthropic, google, openrouter, deepseek, glm, moonshot, custom
- Handle custom baseURL for OpenAI/Anthropic compatible APIs
- Integrate with modelConfig table for active model checking

**Load Skill**: `vercel/ai@ai-sdk` before implementation

**Inputs**:
- Read: `packages/db/src/schema/models.ts`
- Reference: PRD lines 2339-2427

**Outputs**:
- Create: `packages/api/src/lib/ai-providers.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All providers properly configured
- Custom endpoints supported
- NO `any` types

**Dependencies**: Phase 8, Phase 9 must complete

---

## Phase 11: Game Generation Router (Streaming)

**Type**: Sequential

**PRD Reference**: Lines 653-771 (Streaming Generation)

**Requirements**:
- Implement `generateRouter` with:
  - `streamGeneration`: Streaming game generation (PRD lines 666-770)
    - Validate credits OR BYOK key
    - Deduct credits BEFORE generation (PRD lines 209-213)
    - Create game record with 'generating' status
    - Stream using AI SDK `streamText`
    - Apply Shiki syntax highlighting to chunks
    - Upload to CDN on completion with retry
    - Update game status
- No maxTokens limit (PRD line 725)
- Use tRPC streaming with `async function*`

**Load Skill**: `vercel/ai@ai-sdk` before implementation

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/ai-providers.ts`
- Reference: PRD lines 653-771, 181-214

**Outputs**:
- Create: `packages/api/src/routers/generate.ts`
- Create: `packages/api/src/lib/cdn.ts` (CDN upload with retry)
- Create: `packages/api/src/lib/highlighter.ts` (Shiki setup)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Streaming works end-to-end
- Credits deducted before generation starts
- Game status transitions correctly
- NO `any` types

**Dependencies**: Phase 7, Phase 10 must complete

---

## Phase 12: Game SDK Router

**Type**: Sequential

**PRD Reference**: Lines 219-479 (Arcade Vibe Game SDK)

**Requirements**:
- Implement `gameSdkRouter` with:
  - `heartbeat`: Track playtime (PRD lines 379-411)
  - `score`: Submit score to leaderboard (PRD lines 413-452)
  - `endSession`: Final playtime report
- Implement `createGameSessionToken` (PRD lines 456-478)
- Server-side playtime validation against wall-clock (PRD lines 396-401)
- Store sessions in Redis (PRD lines 461-468)

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/redis.ts`
- Reference: PRD lines 219-479

**Outputs**:
- Create: `packages/api/src/routers/game-sdk.ts`
- Create: `packages/api/src/lib/game-session.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Session tokens validated with JWT
- Playtime validated against wall-clock
- Scores stored in gameScores table
- NO `any` types

**Dependencies**: Phase 11 must complete

---

## Phase 13: Games Router (CRUD + Submission)

**Type**: Sequential

**PRD Reference**: Lines 1260-1278 (games table), game management

**Requirements**:
- Implement `gamesRouter` with:
  - `getById`: Get game by ID (public if completed)
  - `listByPrompt`: List all games for a prompt
  - `listByTheme`: List submitted games for theme
  - `submit`: Mark game as official competition entry
  - `hide`: Admin/moderator hide game
  - `getCode`: Get game HTML/JS for iframe (includes SDK injection)
- Inject SDK script with session token (PRD lines 485-516)

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/game-session.ts`
- Reference: PRD lines 1260-1278, 485-526

**Outputs**:
- Create: `packages/api/src/routers/games.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- SDK injection works correctly
- Hidden games not returned in public queries
- NO `any` types

**Dependencies**: Phase 12 must complete

---

## Phase 14: Per-Game Leaderboard Router

**Type**: Sequential

**PRD Reference**: Lines 527-651 (Per-Game Leaderboard)

**Requirements**:
- Implement `gameLeaderboardRouter` with:
  - `getLeaderboard`: Get top scores for game (PRD lines 566-600)
  - `getStats`: Get game statistics (PRD lines 602-615)
  - `subscribe`: Real-time leaderboard updates (PRD lines 618-650)
- Redis caching for leaderboard (1 minute TTL)
- Redis Streams for real-time updates

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/redis.ts`
- Reference: PRD lines 527-651

**Outputs**:
- Create: `packages/api/src/routers/game-leaderboard.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Caching works correctly
- Real-time subscription works
- NO `any` types

**Dependencies**: Phase 12 must complete

---

## Phase 15: Ratings Router

**Type**: Sequential

**PRD Reference**: Lines 1323-1346 (ratings table), rating system

**Requirements**:
- Implement `ratingsRouter` with:
  - `create`: Create rating (requires 60s playtime, PRD line 41)
  - `update`: Update existing rating
  - `getByGame`: Get all ratings for a game
  - `getByUser`: Get user's ratings
  - `getMyRating`: Get current user's rating for game
- Enforce one rating per user per game (unique constraint)
- Trigger score recalculation on new rating

**Inputs**:
- Read: `packages/db/src/schema/ratings.ts`
- Reference: PRD lines 1323-1346, line 41

**Outputs**:
- Create: `packages/api/src/routers/ratings.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- 60s playtime enforced
- Unique constraint respected
- NO `any` types

**Dependencies**: Phase 13 must complete

---

## Phase 16: Scoring Engine

**Type**: Sequential

**PRD Reference**: Lines 978-1070 (Scoring Algorithm)

**Requirements**:
- Implement scoring calculation (PRD lines 981-1061):
  - Quality Score (40%): Bayesian average rating
  - Difficulty Score (25%): Model tier multiplier
  - Efficiency Score (20%): Brevity bonus (logarithmic)
  - Engagement Score (10%): Average playtime (capped 5min)
  - Popularity Score (5%): Vote volume
- Fetch dynamic weights from `scoringWeights` table (PRD lines 2436-2462)
- Fetch global stats from `platformStats` table (PRD lines 990-997)
- Publish to Redis Stream for leaderboard update (PRD lines 1063-1068)

**Inputs**:
- Read: `packages/db/src/schema/scores.ts`
- Read: `packages/db/src/schema/platform.ts`
- Reference: PRD lines 978-1070, 2436-2527

**Outputs**:
- Create: `packages/api/src/lib/scoring.ts`
- Create: `packages/api/src/jobs/recalculate-scores.ts` (BullMQ job)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All score components calculated correctly
- Dynamic weights applied
- NO `any` types

**Dependencies**: Phase 15 must complete

---

## Phase 17: Theme Leaderboard Router

**Type**: Sequential

**PRD Reference**: Lines 773-824 (Real-Time Leaderboard Updates)

**Requirements**:
- Implement `leaderboardRouter` with:
  - `getTop`: Get top 100 games for theme
  - `subscribe`: Real-time subscription (PRD lines 787-823)
- Redis Streams integration (PRD lines 792-801)
- Cache with 5min TTL (PRD line 807)

**Inputs**:
- Read: `packages/db/src/schema/scores.ts`
- Read: `packages/api/src/lib/redis.ts`
- Reference: PRD lines 773-824

**Outputs**:
- Create: `packages/api/src/routers/leaderboard.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Real-time updates work
- Caching implemented
- NO `any` types

**Dependencies**: Phase 16 must complete

---

## Phase 18: Prompt Runs Router (Community Experiments)

**Type**: Sequential

**PRD Reference**: Lines 1309-1320 (promptRuns table), Lines 41-48

**Requirements**:
- Implement `promptRunsRouter` with:
  - `create`: Run another user's prompt with different model
  - `listByPrompt`: List all runs of a prompt
  - `listMine`: List user's own runs
- Only works on public prompts
- Creates new game record linked to original prompt

**Inputs**:
- Read: `packages/db/src/schema/prompts.ts`
- Read: `packages/api/src/routers/generate.ts`
- Reference: PRD lines 1309-1320

**Outputs**:
- Create: `packages/api/src/routers/prompt-runs.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Only public prompts can be run
- Properly linked to original prompt
- NO `any` types

**Dependencies**: Phase 11 must complete

---

## Phase 19: Moderation Router

**Type**: Sequential

**PRD Reference**: Lines 1682-2093 (Content Moderation Queue)

**Requirements**:
- Implement `moderationRouter` with:
  - `submitReport`: User submits report (PRD lines 1729-1768)
  - `getQueue`: Moderator gets pending reports (PRD lines 1771-1793)
  - `getReport`: Moderator gets report details (PRD lines 1796-1857)
  - `resolveReport`: Moderator resolves report (PRD lines 1860-1947)
  - `appealResolution`: User appeals resolution (PRD lines 1950-2004)
  - `getAppeals`: Moderator gets pending appeals (PRD lines 2008-2024)
  - `resolveAppeal`: Moderator resolves appeal (PRD lines 2027-2091)
- Prevent duplicate reports from same user
- Action logging to adminActions table

**Inputs**:
- Read: `packages/db/src/schema/moderation.ts`
- Reference: PRD lines 1682-2093

**Outputs**:
- Create: `packages/api/src/routers/moderation.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All actions logged
- Role-based access enforced
- NO `any` types

**Dependencies**: Phase 4 must complete

---

## Phase 20: Admin Router (Direct Actions)

**Type**: Sequential

**PRD Reference**: Lines 2095-2182 (Direct Moderation Actions)

**Requirements**:
- Implement admin direct actions:
  - `hideGame`: Admin hides game directly (PRD lines 2100-2133)
  - `suspendUser`: Admin suspends user (PRD lines 2135-2162)
  - `updateScoringWeights`: Admin updates scoring weights (PRD lines 2469-2524)
  - `getModerationQueue`: Admin gets flagged content (PRD lines 2164-2180)
- All actions logged to adminActions

**Inputs**:
- Read: `packages/db/src/schema/moderation.ts`
- Read: `packages/db/src/schema/platform.ts`
- Reference: PRD lines 2095-2182, 2469-2527

**Outputs**:
- Create: `packages/api/src/routers/admin/direct.ts`
- Modify: `packages/api/src/routers/admin/index.ts` (combine admin routers)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Admin-only access enforced
- All actions logged
- NO `any` types

**Dependencies**: Phase 19 must complete

---

## Phase 21: Subscription Plan Router (Admin)

**Type**: Sequential

**PRD Reference**: Lines 1486-1569 (Subscription Plan Management)

**Requirements**:
- Implement subscription plan management:
  - `getPlans`: List all plans (PRD lines 1492-1497)
  - `updatePlan`: Update plan pricing (PRD lines 1500-1544)
  - `togglePlanActive`: Activate/deactivate plan (PRD lines 1547-1568)
- Log all actions

**Inputs**:
- Read: `packages/db/src/schema/subscriptions.ts`
- Reference: PRD lines 1486-1569

**Outputs**:
- Create: `packages/api/src/routers/admin/plans.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Admin-only access
- Actions logged
- NO `any` types

**Dependencies**: Phase 5 must complete

---

## Phase 22: Router Integration

**Type**: Sequential

**Requirements**:
- Combine all routers into appRouter
- Export types for client consumption
- Verify all procedures properly namespaced

**Inputs**:
- Read: All router files from previous phases
- Read: `packages/api/src/routers/index.ts`

**Outputs**:
- Modify: `packages/api/src/routers/index.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- All routers accessible
- NO `any` types

**Dependencies**: Phases 5-21 must complete

---

## Phase 23: Prompt Diff Component

**Type**: Sequential

**PRD Reference**: Lines 826-881 (Visual Prompt Diff Tool)

**Requirements**:
- Create `PromptDiff` component (PRD lines 832-880)
- Use `diff` library for word-level diffing
- Side-by-side view with color-coded changes
- Integrate with version selection

**Inputs**:
- Reference: PRD lines 826-881, 922-975

**Outputs**:
- Create: `apps/web/src/components/prompt-diff.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Word-level diff displayed correctly
- Proper styling with Tailwind
- NO `any` types

**Dependencies**: Phase 22 must complete

---

## Phase 24: Streaming Code Viewer Component

**Type**: Sequential

**PRD Reference**: Lines 27-29 (Real-time streaming), Shiki integration

**Requirements**:
- Create streaming code viewer with Shiki highlighting
- Display code as it streams from generation
- Support theme toggle (github-dark, github-light)
- Show generation progress

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Reference: PRD lines 27-29, 653-771

**Outputs**:
- Create: `apps/web/src/components/streaming-code-viewer.tsx`
- Create: `apps/web/src/lib/shiki.ts` (client-side highlighter)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Smooth streaming display
- Syntax highlighting works
- NO `any` types

**Dependencies**: Phase 22 must complete

---

## Phase 25: Game Player Component (Iframe)

**Type**: Sequential

**PRD Reference**: Lines 519-526 (Iframe Sandbox)

**Requirements**:
- Create game player iframe component
- Proper sandbox attributes (PRD lines 519-525)
- Handle loading states
- Display per-game leaderboard alongside

**Inputs**:
- Reference: PRD lines 519-526, 527-651

**Outputs**:
- Create: `apps/web/src/components/game-player.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Sandbox security enforced
- Leaderboard displays correctly
- NO `any` types

**Dependencies**: Phase 23 must complete

---

## Phase 26: Prompt Editor Page

**Type**: Sequential

**Requirements**:
- Create prompt editor page with:
  - Monaco editor for prompt writing
  - Model selector with tier badges
  - Credit cost display
  - Generate button with streaming output
  - Version history sidebar
  - Diff viewer for comparing versions

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Read: Components from Phases 23-25
- Reference: PRD lines 83-91

**Outputs**:
- Create: `apps/web/src/app/editor/page.tsx`
- Create: `apps/web/src/app/editor/components/model-selector.tsx`
- Create: `apps/web/src/app/editor/components/version-history.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- Full editor workflow functional
- NO `any` types

**Dependencies**: Phases 23-25 must complete

---

## Phase 27: Arcade Browse Page

**Type**: Sequential

**Requirements**:
- Create arcade browse page with:
  - Theme selector
  - Game grid with difficulty badges
  - Sorting options (score, popularity, recent)
  - Search/filter
  - Click to play

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Reference: PRD lines 39-48

**Outputs**:
- Create: `apps/web/src/app/arcade/page.tsx`
- Create: `apps/web/src/app/arcade/components/game-card.tsx`
- Create: `apps/web/src/app/arcade/components/theme-header.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Responsive grid layout
- Proper filtering/sorting
- NO `any` types

**Dependencies**: Phase 25 must complete

---

## Phase 28: Game Play Page

**Type**: Sequential

**Requirements**:
- Create game play page with:
  - Full-screen game iframe
  - Leaderboard sidebar
  - Rating form (after 60s)
  - Share button
  - View prompt button (if public)

**Load Skill**: `frontend-design`, `formedible` before implementation

**Inputs**:
- Read: Components from Phase 25
- Reference: PRD lines 39-48, 1323-1346

**Outputs**:
- Create: `apps/web/src/app/game/[id]/page.tsx`
- Create: `apps/web/src/app/game/[id]/components/rating-form.tsx`
- Create: `apps/web/src/app/game/[id]/components/leaderboard-sidebar.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Rating enforces 60s playtime
- Real-time leaderboard updates
- NO `any` types

**Dependencies**: Phase 27 must complete

---

## Phase 29: Profile Page

**Type**: Sequential

**Requirements**:
- Create user profile page with:
  - User stats (games created, total ratings, reputation)
  - List of user's prompts with versions
  - List of user's games with rankings
  - Prompt runs history
  - Credit balance (own profile only)

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Reference: PRD lines 47-48

**Outputs**:
- Create: `apps/web/src/app/profile/[username]/page.tsx`
- Create: `apps/web/src/app/profile/[username]/components/stats-card.tsx`
- Create: `apps/web/src/app/profile/[username]/components/prompt-list.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Private data hidden from other users
- Proper loading states
- NO `any` types

**Dependencies**: Phase 28 must complete

---

## Phase 30: Admin Dashboard

**Type**: Sequential

**PRD Reference**: Lines 2184-2194 (Admin UI Components)

**Requirements**:
- Create admin dashboard with:
  - Subscription plan management (PRD line 2186)
  - Model management (PRD line 2187)
  - Moderation queue (PRD line 2189-2191)
  - Audit log viewer (PRD line 2192)
  - Theme management (PRD line 2193)
  - Credit management (PRD line 2194)

**Load Skill**: `frontend-design`, `formedible` before implementation

**Inputs**:
- Read: Admin routers from Phases 9, 20, 21
- Reference: PRD lines 2184-2194

**Outputs**:
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/plans/page.tsx`
- Create: `apps/web/src/app/admin/models/page.tsx`
- Create: `apps/web/src/app/admin/moderation/page.tsx`
- Create: `apps/web/src/app/admin/themes/page.tsx`
- Create: `apps/web/src/app/admin/users/page.tsx`
- Create: `apps/web/src/app/admin/audit/page.tsx`
- Create: `apps/web/src/app/admin/layout.tsx` (with sidebar nav)

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- Admin-only access enforced
- All CRUD operations work
- NO `any` types

**Dependencies**: Phase 29 must complete

---

## Phase 31: Settings Pages

**Type**: Sequential

**Requirements**:
- Create settings pages:
  - Profile settings
  - API key management (BYOK)
  - Subscription management
  - Credit purchase

**Load Skill**: `frontend-design`, `formedible` before implementation

**Inputs**:
- Read: API keys router from Phase 8
- Read: Credits router from Phase 5
- Reference: PRD lines 2249-2336

**Outputs**:
- Create: `apps/web/src/app/settings/page.tsx`
- Create: `apps/web/src/app/settings/profile/page.tsx`
- Create: `apps/web/src/app/settings/api-keys/page.tsx`
- Create: `apps/web/src/app/settings/subscription/page.tsx`
- Create: `apps/web/src/app/settings/layout.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- API keys never displayed in full
- Subscription status displayed correctly
- NO `any` types

**Dependencies**: Phase 30 must complete

---

## Phase 32: Final Integration & Validation

**Type**: Sequential

**Requirements**:
- Full end-to-end validation
- Run all type checks
- Run build
- Verify all routes work
- Test critical flows:
  - User signup → Create prompt → Generate game → Submit → Rate
  - Admin: Manage models, moderate content
  - BYOK: Add key → Generate with own key

**Inputs**:
- All previous phases

**Outputs**:
- Validation report

**Validation Criteria**:
- `pnpm run check-types`: Zero errors across all packages
- `pnpm run build`: Success for all packages
- No `any` types in entire codebase
- All PRD requirements implemented

**Dependencies**: All previous phases must complete

---

## Success Criteria

Overall success requires:
- All 32 phases complete and validate successfully
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- **ZERO** uses of `any` type anywhere
- All PRD requirements from lines 1-2573 addressed
- All routers properly integrated
- All pages functional
