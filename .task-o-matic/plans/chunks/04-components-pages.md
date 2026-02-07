# Plan Chunk 4: Components & Pages (Phases 23-31)

**PRD Reference**: `.task-o-matic/prd/chunks/04-ui-components.md`

---

## Critical Implementation Rules

**FOR ALL IMPLEMENTER SUBAGENTS:**

1. **FULL TYPE SAFETY REQUIRED** - The use of `any` is **STRICTLY PROHIBITED** per `AGENTS.md`
2. **PRD LINE REFERENCES** - Every implementation MUST cite specific PRD line numbers
3. **Load Skills** - Load `frontend-design` for UI, `formedible` for forms

---

## Prerequisites

- Phases 1-22 (Chunks 1-3) must be complete
- Full API layer functional
- `pnpm run check-types` and `pnpm run build` passing

---

## Phase 23: Prompt Diff Component

**Type**: Sequential

**PRD Reference**: PRD chunk `04-ui-components.md` - Visual Prompt Diff Tool section

**Requirements**:
- Create `PromptDiff` component
- Use `diff` library for word-level diffing
- Side-by-side view with color-coded changes:
  - Added: `bg-green-200 text-green-900`
  - Removed: `bg-red-200 text-red-900 line-through`
  - Unchanged: `text-gray-900`
- Integrate with version selection

**Inputs**:
- Reference: PRD chunk `04-ui-components.md`

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

**Requirements**:
- Create streaming code viewer with Shiki highlighting
- Display code as it streams from generation
- Support theme toggle (github-dark, github-light)
- Show generation progress indicator
- Copy button for code

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Reference: PRD chunk `04-ui-components.md`

**Outputs**:
- Create: `apps/web/src/components/streaming-code-viewer.tsx`
- Create: `apps/web/src/lib/shiki.ts`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Smooth streaming display
- Syntax highlighting works
- NO `any` types

**Dependencies**: Phase 22 must complete

---

## Phase 25: Game Player Component (Iframe)

**Type**: Sequential

**PRD Reference**: PRD chunk `04-ui-components.md` - Client Components section

**Requirements**:
- Create game player iframe component
- Sandbox attributes: `allow-scripts allow-same-origin`
- `referrerpolicy="no-referrer"`
- Loading state with spinner
- Error boundary for broken games
- Session token injection via URL param or postMessage

**Inputs**:
- Reference: PRD chunk `04-ui-components.md`

**Outputs**:
- Create: `apps/web/src/components/game-player.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- Sandbox security enforced
- Loading states work
- NO `any` types

**Dependencies**: Phase 23 must complete

---

## Phase 26: Prompt Editor Page

**Type**: Sequential

**PRD Reference**: PRD chunk `04-ui-components.md` - Required Pages section

**Requirements**:
- Create prompt editor page with:
  - Monaco editor for prompt writing
  - Model selector with tier badges (Cheater/Easy/Normal/Hard/Impossible)
  - Credit cost display (updates based on selected model)
  - Generate button with streaming output
  - Version history sidebar
  - Diff viewer for comparing versions
  - Fork button for public prompts

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Read: Components from Phases 23-25
- Reference: PRD chunk `04-ui-components.md`

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
  - Theme selector (current + archived)
  - Game grid with difficulty badges
  - Sorting options (score, popularity, recent)
  - Search/filter by creator
  - Click to play

**Load Skill**: `frontend-design` before implementation

**Inputs**:
- Reference: PRD chunk `04-ui-components.md`

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

**PRD Reference**: PRD chunk `04-ui-components.md` - Component Requirements section

**Requirements**:
- Create game play page with:
  - Full-screen game iframe
  - Leaderboard sidebar (real-time updates)
  - Rating form (enabled after 60s playtime)
  - Share button
  - View prompt button (if public)
  - Report button

**Load Skill**: `frontend-design`, `formedible`, `trpc` before implementation

> **CRITICAL WARNING - READ BEFORE IMPLEMENTING:**
>
> 1. **Load the `trpc` skill first** - Do NOT guess tRPC patterns from training data
>
> 2. **Study existing patterns in the codebase:**
>    - `apps/web/src/app/ai/page.tsx` - Example of streaming with `useChat`
>    - `apps/web/src/app/api/generate/route.ts` - SSE streaming pattern
>    - `apps/web/src/utils/trpc.ts` - Client uses `httpBatchLink` ONLY
>
> 3. **DO NOT use tRPC subscriptions** - The client has NO subscription link configured.
>    The `gameLeaderboard.subscribe` router exists but CANNOT be used from the frontend.
>    Use **polling with `refetchInterval`** instead for "real-time" updates:
>    ```typescript
>    const { data } = trpc.gameLeaderboard.getTop.useQuery(
>      { gameId },
>      { refetchInterval: 5000 } // Poll every 5 seconds
>    );
>    ```
>
> 4. **Run `pnpm run check-types` before marking complete** - Zero errors required

**Inputs**:
- Read: Components from Phase 25
- Read: `apps/web/src/utils/trpc.ts` - Understand client configuration
- Read: `apps/web/src/app/editor/page.tsx` - Follow established patterns
- Reference: PRD chunk `04-ui-components.md`

**Outputs**:
- Create: `apps/web/src/app/game/[id]/page.tsx`
- Create: `apps/web/src/app/game/[id]/components/rating-form.tsx`
- Create: `apps/web/src/app/game/[id]/components/leaderboard-sidebar.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- Rating enforces 60s playtime
- Leaderboard updates via polling (NOT subscriptions)
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
- Reference: PRD chunk `04-ui-components.md`

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

**PRD Reference**: PRD chunk `04-ui-components.md` - Admin Tables section

**Requirements**:
- Create admin dashboard with:
  - Plan Management: Table of plans with pricing, credits, markup
  - Model Management: Table with activate/deactivate, credit cost
  - Moderation Queue: Table with reports, resolution actions
  - User Management: List with suspend action
  - Audit Log: Filterable table of admin actions
  - Theme Management: CRUD interface
- All tables: Sortable, paginated, with confirmation dialogs

**Load Skill**: `frontend-design`, `formedible` before implementation

**Inputs**:
- Read: Admin routers from Phases 9, 20, 21
- Reference: PRD chunk `04-ui-components.md`

**Outputs**:
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/plans/page.tsx`
- Create: `apps/web/src/app/admin/models/page.tsx`
- Create: `apps/web/src/app/admin/moderation/page.tsx`
- Create: `apps/web/src/app/admin/themes/page.tsx`
- Create: `apps/web/src/app/admin/users/page.tsx`
- Create: `apps/web/src/app/admin/audit/page.tsx`
- Create: `apps/web/src/app/admin/layout.tsx`

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
  - Profile settings (username, email)
  - API key management (BYOK) - add, list (masked), delete
  - Subscription management - current plan, upgrade
  - Credit purchase - extra credits

**Load Skill**: `frontend-design`, `formedible` before implementation

**Inputs**:
- Read: API keys router from Phase 8
- Read: Credits router from Phase 5

**Outputs**:
- Create: `apps/web/src/app/settings/page.tsx`
- Create: `apps/web/src/app/settings/profile/page.tsx`
- Create: `apps/web/src/app/settings/api-keys/page.tsx`
- Create: `apps/web/src/app/settings/subscription/page.tsx`
- Create: `apps/web/src/app/settings/layout.tsx`

**Validation Criteria**:
- `pnpm run check-types`: Zero errors
- API keys never displayed in full (masked)
- Subscription status displayed correctly
- NO `any` types

**Dependencies**: Phase 30 must complete

---

## Success Criteria for Chunk 4

- All 9 phases (23-31) complete
- `pnpm run check-types`: Zero errors
- `pnpm run build`: Success
- All pages functional
- All components render correctly
- ZERO uses of `any` type

---

## Final Validation (Post All Chunks)

After all chunks complete:

```bash
# Full validation
pnpm run check-types
pnpm run build

# Test critical flows
# 1. User signup → Create prompt → Generate game → Submit → Rate
# 2. Admin: Manage models, moderate content
# 3. BYOK: Add key → Generate with own key
```

Verify:
- All PRD requirements implemented
- Zero `any` types in codebase
- All routers accessible
- All pages functional
