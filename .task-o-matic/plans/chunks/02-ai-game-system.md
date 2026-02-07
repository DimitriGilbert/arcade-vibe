# Plan Chunk 2: AI Integration & Game System (Phases 10-18)

**PRD Reference**: `.task-o-matic/prd/chunks/02-ai-game-system.md`

---

## Critical Implementation Rules

**FOR ALL IMPLEMENTER SUBAGENTS:**

1. **FULL TYPE SAFETY REQUIRED** - The use of `any` is **STRICTLY PROHIBITED** per `AGENTS.md`
2. **PRD LINE REFERENCES** - Every implementation MUST cite specific PRD line numbers
3. **Zod Validation** - All inputs validated with Zod 4 schemas
4. **Load Skills** - Load `vercel/ai@ai-sdk` skill for AI features, `trpc` skill for routers

---

## Prerequisites

Phases 1-9 from Chunk 1 must be complete:
- Database schema with all tables
- Core middleware (adminProcedure, moderatorProcedure)
- Credits, Themes, Prompts, API Keys, Model Config routers

---

## Phase 10: AI Provider Factory

**Type**: Sequential

**PRD Reference**: PRD chunk `02-ai-game-system.md` - AI Provider Factory section

**Requirements**:
- Implement `getProviderModel` factory function
- Support all providers: openai, anthropic, google, openrouter, deepseek, glm, moonshot, custom
- Handle custom baseURL for OpenAI/Anthropic compatible APIs
- Integrate with modelConfig table for active model checking

**Load Skill**: `vercel/ai@ai-sdk` before implementation

**Inputs**:
- Read: `packages/db/src/schema/models.ts`
- Reference: PRD chunk `02-ai-game-system.md`

**Outputs**:
- Create: `packages/api/src/lib/ai-providers.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All providers properly configured
- Custom endpoints supported
- NO `any` types

**Dependencies**: Phases 8, 9 must complete

---

## Phase 11: Game Generation Router (Streaming)

**Type**: Sequential

**PRD Reference**: PRD chunk `02-ai-game-system.md` - Streaming Generation Router section

**Requirements**:
- Implement `generateRouter` with:
  - `streamGeneration`: Streaming game generation
    - Validate credits OR BYOK key
    - Deduct credits BEFORE generation
    - Create game record with 'generating' status
    - Stream using AI SDK `streamText`
    - Apply Shiki syntax highlighting
    - Upload to CDN on completion with retry
    - Update game status
- No maxTokens limit
- Use tRPC streaming with `async function*`

**Load Skill**: `vercel/ai@ai-sdk` before implementation

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/ai-providers.ts`
- Reference: PRD chunk `02-ai-game-system.md`

**Outputs**:
- Create: `packages/api/src/routers/generate.ts`
- Create: `packages/api/src/lib/cdn.ts`
- Create: `packages/api/src/lib/highlighter.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Streaming works end-to-end
- Credits deducted before generation
- Game status transitions correctly
- NO `any` types

**Dependencies**: Phases 7, 10 must complete

---

## Phase 12: Game SDK Router

**Type**: Sequential

**PRD Reference**: PRD chunk `02-ai-game-system.md` - Game SDK Server Validation section

**Requirements**:
- Implement `gameSdkRouter` with:
  - `heartbeat`: Track playtime (5s interval)
  - `score`: Submit score to leaderboard
  - `endSession`: Final playtime report
- Implement `createGameSessionToken` (JWT, 1hr expiry)
- Server-side playtime validation against wall-clock (10s tolerance)
- Store sessions in Redis

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/redis.ts`
- Reference: PRD chunk `02-ai-game-system.md`

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

**Requirements**:
- Implement `gamesRouter` with:
  - `getById`: Get game by ID (public if completed)
  - `listByPrompt`: List all games for a prompt
  - `listByTheme`: List submitted games for theme
  - `submit`: Mark game as official competition entry
  - `hide`: Admin/moderator hide game
  - `getCode`: Get game HTML/JS for iframe (includes SDK injection)
- Inject SDK script with session token

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/game-session.ts`
- Reference: PRD chunk `02-ai-game-system.md` - Game Template section

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

**PRD Reference**: PRD chunk `02-ai-game-system.md` - Per-Game Leaderboard Router section

**Requirements**:
- Implement `gameLeaderboardRouter` with:
  - `getLeaderboard`: Get top scores (cached 1 min)
  - `getStats`: Get game statistics (totalPlays, highScore, avgScore, etc.)
  - `subscribe`: Real-time leaderboard updates via Redis Streams

**Inputs**:
- Read: `packages/db/src/schema/games.ts`
- Read: `packages/api/src/lib/redis.ts`
- Reference: PRD chunk `02-ai-game-system.md`

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

**Requirements**:
- Implement `ratingsRouter` with:
  - `create`: Create rating (requires 60s playtime)
  - `update`: Update existing rating
  - `getByGame`: Get all ratings for a game
  - `getByUser`: Get user's ratings
  - `getMyRating`: Get current user's rating for game
- Enforce one rating per user per game
- Trigger score recalculation on new rating

**Inputs**:
- Read: `packages/db/src/schema/ratings.ts`

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

**PRD Reference**: PRD chunk `04-ui-components.md` - Scoring Algorithm section

**Requirements**:
- Implement scoring calculation:
  - Quality Score (40%): Bayesian average rating
  - Difficulty Score (25%): Model tier multiplier
  - Efficiency Score (20%): Brevity bonus (logarithmic)
  - Engagement Score (10%): Average playtime (capped 5min)
  - Popularity Score (5%): Vote volume
- Fetch dynamic weights from `scoringWeights` table
- Fetch global stats from `platformStats` table
- Publish to Redis Stream for leaderboard update

**Inputs**:
- Read: `packages/db/src/schema/scores.ts`
- Read: `packages/db/src/schema/platform.ts`
- Reference: PRD chunk `04-ui-components.md`

**Outputs**:
- Create: `packages/api/src/lib/scoring.ts`
- Create: `packages/api/src/jobs/recalculate-scores.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All score components calculated correctly
- Dynamic weights applied
- NO `any` types

**Dependencies**: Phase 15 must complete

---

## Phase 17: Theme Leaderboard Router

**Type**: Sequential

**PRD Reference**: PRD chunk `02-ai-game-system.md` - Theme Leaderboard section

**Requirements**:
- Implement `leaderboardRouter` with:
  - `getTop`: Get top 100 games for theme
  - `subscribe`: Real-time subscription via Redis Streams
- Redis caching with 5min TTL

**Inputs**:
- Read: `packages/db/src/schema/scores.ts`
- Read: `packages/api/src/lib/redis.ts`
- Reference: PRD chunk `02-ai-game-system.md`

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

**Outputs**:
- Create: `packages/api/src/routers/prompt-runs.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Only public prompts can be run
- Properly linked to original prompt
- NO `any` types

**Dependencies**: Phase 11 must complete

---

## Success Criteria for Chunk 2

- All 9 phases (10-18) complete
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- AI provider integration working
- Game generation with streaming
- SDK and leaderboard systems functional
- ZERO uses of `any` type
