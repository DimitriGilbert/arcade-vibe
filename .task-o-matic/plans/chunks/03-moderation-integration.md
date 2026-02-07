# Plan Chunk 3: Moderation & Admin + Integration (Phases 19-22)

**PRD Reference**: `.task-o-matic/prd/chunks/03-moderation-admin.md`

---

## Critical Implementation Rules

**FOR ALL IMPLEMENTER SUBAGENTS:**

1. **FULL TYPE SAFETY REQUIRED** - The use of `any` is **STRICTLY PROHIBITED** per `AGENTS.md`
2. **PRD LINE REFERENCES** - Every implementation MUST cite specific PRD line numbers
3. **Zod Validation** - All inputs validated with Zod 4 schemas
4. **Load Skills** - Load `trpc` skill for routers

---

## Prerequisites

- Phases 1-9 (Chunk 1) must be complete: Database, Core Routers
- Phases 10-18 (Chunk 2) must be complete: AI, Game System

---

## Phase 19: Moderation Router

**Type**: Sequential

**PRD Reference**: PRD chunk `03-moderation-admin.md` - Moderation Router section

**Requirements**:
- Implement `moderationRouter` with:
  - `submitReport`: User submits report
    - Check for duplicate reports from same user
    - Notify moderators via Redis Stream
  - `getQueue`: Moderator gets pending reports (with optional targetType filter)
  - `getReport`: Moderator gets report details with target content and flag history
  - `resolveReport`: Moderator resolves report
    - Actions: approved, rejected, requested_changes, escalated
    - Execute action (hide game, disqualify prompt, suspend user, delete review)
    - Invalidate cache where needed
  - `appealResolution`: User appeals resolution (content owner only)
  - `getAppeals`: Moderator gets pending appeals
  - `resolveAppeal`: Moderator resolves appeal
    - If approved, revert original resolution
- All actions logged to adminActions table

**Inputs**:
- Read: `packages/db/src/schema/moderation.ts`
- Reference: PRD chunk `03-moderation-admin.md`

**Outputs**:
- Create: `packages/api/src/routers/moderation.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- All actions logged
- Role-based access enforced (moderatorProcedure)
- Duplicate report prevention works
- Appeal ownership validation works
- NO `any` types

**Dependencies**: Phase 4 must complete

---

## Phase 20: Admin Router (Direct Actions)

**Type**: Sequential

**PRD Reference**: PRD chunk `03-moderation-admin.md` - Direct Admin Actions section

**Requirements**:
- Implement admin direct actions:
  - `hideGame`: Admin hides game directly with reason
    - Update game status to 'hidden'
    - Invalidate leaderboard cache
    - Log to adminActions
  - `suspendUser`: Admin suspends user
    - Duration options: 7d, 30d, permanent
    - Log to adminActions
  - `updateScoringWeights`: Admin updates scoring weights for theme
    - Weights must sum to 1.0 (validated with Zod refine)
    - Trigger score recalculation
    - Uses upsert pattern (onConflictDoUpdate)
  - `getModerationQueue`: Admin gets flagged content (for severe cases)
- All actions require adminProcedure

**Inputs**:
- Read: `packages/db/src/schema/moderation.ts`
- Read: `packages/db/src/schema/platform.ts`
- Reference: PRD chunk `03-moderation-admin.md`

**Outputs**:
- Create: `packages/api/src/routers/admin/direct.ts`
- Create: `packages/api/src/routers/admin/index.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Admin-only access enforced
- All actions logged to adminActions
- Scoring weight validation (sum to 1.0)
- NO `any` types

**Dependencies**: Phase 19 must complete

---

## Phase 21: Subscription Plan Router (Admin)

**Type**: Sequential

**PRD Reference**: PRD chunk `03-moderation-admin.md` - Subscription Plan Management section

**Requirements**:
- Implement subscription plan management:
  - `getPlans`: List all plans (ordered by price)
  - `updatePlan`: Update plan pricing and configuration
    - Log old vs new values in adminActions metadata
  - `togglePlanActive`: Activate/deactivate plan
- All actions logged with before/after metadata

**Inputs**:
- Read: `packages/db/src/schema/subscriptions.ts`
- Reference: PRD chunk `03-moderation-admin.md`

**Outputs**:
- Create: `packages/api/src/routers/admin/plans.ts`
- Modify: `packages/api/src/routers/admin/index.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Admin-only access
- Actions logged with metadata
- NO `any` types

**Dependencies**: Phase 5 must complete

---

## Phase 22: Router Integration

**Type**: Sequential

**Requirements**:
- Combine all routers into appRouter
- Export types for client consumption
- Verify all procedures properly namespaced
- Ensure no circular dependencies

**Router Structure**:
```typescript
export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  
  // Auth & User
  credits: creditsRouter,
  apiKeys: apiKeysRouter,
  
  // Content
  themes: themesRouter,
  prompts: promptsRouter,
  games: gamesRouter,
  ratings: ratingsRouter,
  promptRuns: promptRunsRouter,
  
  // Generation
  generate: generateRouter,
  
  // Leaderboards
  leaderboard: leaderboardRouter,
  gameLeaderboard: gameLeaderboardRouter,
  gameSdk: gameSdkRouter,
  
  // Moderation
  moderation: moderationRouter,
  
  // Admin
  admin: adminRouter, // combines models, plans, direct actions
});
```

**Inputs**:
- Read: All router files from previous phases
- Read: `packages/api/src/routers/index.ts`

**Outputs**:
- Modify: `packages/api/src/routers/index.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- All routers accessible
- Types exported correctly
- NO `any` types

**Dependencies**: Phases 5-21 must complete

---

## Success Criteria for Chunk 3

- All 4 phases (19-22) complete
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- Moderation system fully functional
- Admin dashboard routers complete
- All routers integrated into appRouter
- ZERO uses of `any` type

---

## Post-Chunk Verification

After Chunk 3 completes, the full API layer should be functional:

1. **Database**: All tables, relations, indexes
2. **Auth**: Protected procedures, role-based access
3. **Content**: Themes, Prompts, Games, Ratings
4. **AI**: Generation, Streaming, SDK
5. **Leaderboards**: Per-game and per-theme with real-time
6. **Moderation**: Reports, Appeals, Direct actions
7. **Admin**: Plans, Models, Weights

Run full validation:
```bash
pnpm run check-types
pnpm run build
```
