# Plan Chunk 1: Database Schema & Core Routers (Phases 1-9)

**PRD Reference**: `.task-o-matic/prd/chunks/01-database-schema.md`

---

## Critical Implementation Rules

**FOR ALL IMPLEMENTER SUBAGENTS:**

1. **FULL TYPE SAFETY REQUIRED** - The use of `any` is **STRICTLY PROHIBITED** per `AGENTS.md`
2. **PRD LINE REFERENCES** - Every implementation MUST cite specific PRD line numbers (e.g., "per PRD lines 1129-1140")
3. **Zod Validation** - All inputs validated with Zod 4 schemas
4. **Drizzle ORM** - Use type-safe queries only
5. **tRPC v11** - Follow patterns in existing `packages/api/src/index.ts`
6. **Load Skills** - Load `trpc` skill when creating routers

---

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

**PRD Reference**: PRD chunk `01-database-schema.md` - Enums through Scores sections

**Requirements**:
- Define all enums per PRD lines 1078-1126:
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
- Read: `packages/db/src/schema/auth.ts`
- Read: `packages/db/src/schema/todo.ts`
- Reference: PRD chunk `01-database-schema.md`

**Outputs**:
- Create: `packages/db/src/schema/enums.ts`
- Create: `packages/db/src/schema/users.ts`
- Create: `packages/db/src/schema/credits.ts`
- Create: `packages/db/src/schema/subscriptions.ts`
- Create: `packages/db/src/schema/models.ts`
- Create: `packages/db/src/schema/themes.ts`
- Create: `packages/db/src/schema/prompts.ts`
- Create: `packages/db/src/schema/games.ts`
- Create: `packages/db/src/schema/ratings.ts`
- Create: `packages/db/src/schema/scores.ts`
- Modify: `packages/db/src/schema/index.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All tables properly typed with Drizzle pgTable
- All foreign keys use `.references()` with proper onDelete actions
- NO `any` types anywhere

**Dependencies**: None (first phase)

---

## Phase 2: Database Schema - Moderation & Platform Stats

**Type**: Sequential

**PRD Reference**: PRD chunk `01-database-schema.md` - Platform Stats through Indexes sections

**Requirements**:
- Define `platformStats` table (PRD lines 1372-1378)
- Define `adminActions` table (PRD lines 1381-1392)
- Define `moderationReports` table (PRD lines 1394-1410)
- Define `moderationAppeals` table (PRD lines 1412-1427)
- Define `scoringWeights` table (PRD lines 2436-2462)
- Create all performance indexes per PRD lines 1429-1483

**Inputs**:
- Read: Phase 1 schema files
- Reference: PRD chunk `01-database-schema.md`

**Outputs**:
- Create: `packages/db/src/schema/platform.ts`
- Create: `packages/db/src/schema/moderation.ts`
- Modify: `packages/db/src/schema/index.ts`

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
- Read: `packages/db/src/index.ts`

**Outputs**:
- Create: `packages/db/src/schema/relations.ts`
- Modify: `packages/db/src/index.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- All relations properly typed
- NO `any` types

**Dependencies**: Phase 2 must complete

---

## Phase 4: Core Middleware & Procedures

**Type**: Sequential

**Requirements**:
- Create `adminProcedure` - requires user.role === 'admin'
- Create `moderatorProcedure` - requires user.role in ['admin', 'moderator']
- Add Redis client setup for sessions/caching
- Create rate limiting middleware pattern

**Inputs**:
- Read: `packages/api/src/index.ts`
- Read: `packages/api/src/context.ts`

**Outputs**:
- Modify: `packages/api/src/index.ts`
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

**PRD Reference**: PRD chunk `02-ai-game-system.md` - Pricing & Credits section

**Requirements**:
- Implement `creditsRouter` with:
  - `getBalance`: Get user credit balance
  - `getTransactions`: List credit transaction history
  - `deductCredits`: Internal helper (not exposed)
  - `addCredits`: Admin-only credit grant

**Inputs**:
- Read: `packages/db/src/schema/credits.ts`
- Read: `packages/api/src/index.ts`
- Reference: PRD chunk `02-ai-game-system.md`

**Outputs**:
- Create: `packages/api/src/routers/credits.ts`
- Create: `packages/api/src/lib/credits.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Credit deduction is transactional
- All Zod schemas validate inputs
- NO `any` types

**Dependencies**: Phase 4 must complete

---

## Phase 6: Themes Router

**Type**: Sequential

**Requirements**:
- Implement `themesRouter` with:
  - `list`: Get all themes (public)
  - `getCurrent`: Get active theme
  - `getById`: Get theme by ID
  - `create`: Admin-only theme creation
  - `update`: Admin-only theme update
  - `updateStatus`: Admin-only status change

**Inputs**:
- Read: `packages/db/src/schema/themes.ts`
- Read: `packages/api/src/index.ts`

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

**PRD Reference**: PRD chunk `04-ui-components.md` - Prompts Router section

**Requirements**:
- Implement `promptsRouter` with:
  - `create`: Create new prompt (protected)
  - `update`: Create new version (immutable)
  - `fork`: Fork another user's prompt
  - `getById`: Get prompt by ID
  - `listVersions`: List all versions
  - `getVersion`: Get specific version
  - `listMine`: List user's prompts
  - `listPublic`: List public prompts
- Token counting using AI SDK tokenizer
- Content hashing with SHA-256

**Inputs**:
- Read: `packages/db/src/schema/prompts.ts`
- Read: `packages/api/src/routers/todo.ts`

**Outputs**:
- Create: `packages/api/src/routers/prompts.ts`
- Create: `packages/api/src/lib/tokenizer.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Immutability enforced
- Visibility rules enforced
- NO `any` types

**Dependencies**: Phase 6 must complete

---

## Phase 8: API Keys Router (BYOK)

**Type**: Sequential

**PRD Reference**: PRD chunk `02-ai-game-system.md` - API Key Encryption section

**Requirements**:
- Implement `apiKeysRouter` with:
  - `addKey`: Store encrypted API key
  - `listKeys`: List user's keys (masked)
  - `deleteKey`: Remove API key
  - `testKey`: Validate key works
- Implement AES-256-GCM encryption
- Never expose decrypted keys

**Inputs**:
- Read: `packages/db/src/schema/models.ts`
- Reference: PRD chunk `02-ai-game-system.md`

**Outputs**:
- Create: `packages/api/src/routers/api-keys.ts`
- Create: `packages/api/src/lib/encryption.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Keys encrypted at rest
- Keys never returned in API responses
- NO `any` types

**Dependencies**: Phase 5 must complete

---

## Phase 9: Model Config Router (Admin)

**Type**: Sequential

**PRD Reference**: PRD chunk `03-moderation-admin.md` - Model Management section

**Requirements**:
- Implement model management:
  - `getModels`: List all models
  - `toggleModelActive`: Activate/deactivate
  - `updateModelPricing`: Change credit cost
  - `addModel`: Add new model
- Log all actions to adminActions table

**Inputs**:
- Read: `packages/db/src/schema/models.ts`
- Reference: PRD chunk `03-moderation-admin.md`

**Outputs**:
- Create: `packages/api/src/routers/admin/models.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All actions logged to adminActions
- Only admins can access
- NO `any` types

**Dependencies**: Phase 4 must complete

---

## Success Criteria for Chunk 1

- All 9 phases complete
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- Database schema complete and relational
- Core routers functional
- ZERO uses of `any` type
