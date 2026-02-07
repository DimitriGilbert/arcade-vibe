# Product Requirements Document: Arcade Vibe

## 1. Overview

### Executive Summary
Arcade Vibe is a competitive monthly prompt engineering platform where participants craft a single, zero-context prompt to generate a playable web-based game. The platform combines AI-generated game creation with a retro arcade aesthetic and a sophisticated, transparent scoring system that rewards quality, efficiency, and difficulty selection. It serves as both a competitive arena for prompt engineers and an educational repository for the community.

### Problem Statement
Current prompt engineering challenges lack a persistent, gamified competitive structure with clear, multi-faceted success metrics. Existing "AI game jams" often allow multiple iterations, extensive hand-holding, or lack transparency into prompt evolution. There is no platform that treats prompt engineering as a pure skill-based sport where the quality of a single instruction is paramount, and where community analysis of prompt portability and model performance is a first-class feature.

### Value Proposition
*   **For Prompt Engineers:** A quantifiable, competitive proving ground. Your skill is measured by a holistic score (quality, brevity, difficulty) on a frozen monthly leaderboard. Your prompt evolution is permanently documented and publicly inspectable, building your reputation.
*   **For Players & Learners:** Access to a curated, monthly arcade of AI-generated games. Deep transparency allows you to see *how* a game was made and even re-run the prompt yourself with different models, facilitating meta-analysis and learning.
*   **For the Community:** A living database of prompt-to-game mappings, model performance data, and strategy forks that pushes the collective understanding of single-shot generation limits.

## 2. Objectives

### Key Goals
**Business Goals:**
1.  Acquire and retain a core community of 500+ active prompt engineers within 6 months.
2.  Achieve a 40% month-over-month retention rate for participants (M2+).
3.  Drive a "prompt run" to "original submission" ratio of > 2:1, indicating deep community engagement and meta-analysis.
4.  Establish Arcade Vibe as the canonical benchmark for single-shot game generation capability.

**Technical Goals:**
1.  Support 500+ concurrent game generation requests per monthly cycle without degradation.
2.  Ensure 100% uptime during submission windows (Week 1-4) and game play.
3.  Implement a secure, scalable system for users to store and use their own external AI API keys.
4.  Maintain a Lighthouse performance score > 90 for all user-facing pages, especially game iframes.

### Success Metrics (KPIs & North Stars)
*   **Engagement:** Average session duration per game played (Target: > 5 minutes).
*   **Quality:** Percentage of monthly submissions achieving an average community rating of ≥ 4/5 stars (Target: > 25%).
*   **Virality & Learning:** `Prompt Runs / Original Submissions` ratio (Target: > 2.0).
*   **Retention:** Percentage of participants in Month N who also submit in Month N+1 (Target: > 40%).
*   **Innovation & Diversity:** Shannon Diversity Index of chosen models across all submissions (Target: > 0.6). No single model used in > 50% of submissions.
*   **Platform Health:** Average time from prompt submission to game URL availability (< 120 seconds). Daily Active Users (DAU) to Monthly Active Users (MAU) ratio (> 0.3).

## 3. Target Audience

### User Personas
1.  **Competitive Prompt Engineer (Primary Creator):** "Alex." 25-45, tech-savvy, follows AI research, active on Twitter/Reddit forums (r/PromptEngineering). Motivated by leaderboard rank, status, and demonstrating mastery. Seeks clear rules, robust scoring, and public recognition.
2.  **Casual Player & Learner (Primary Consumer):** "Sam." 18-35, enjoys web games, curious about AI. Motivated by quick, novel gaming experiences and understanding "how it's made." Values easy browsing, playable games, and the ability to peek behind the curtain.
3.  **Researcher/Analyst (Meta-User):** "Dr. Chen." Academic or industry researcher studying prompt engineering or model capabilities. Motivated by batch data export, model comparison tools, and access to the full prompt evolution graph.

### User Stories
**As a Prompt Engineer (Alex), I want to...**
*   ...see the unambiguous, published monthly theme and core requirements (scoring rules, iframe compat) on Day 0.
*   ...select a target AI model (e.g., "Hard Mode: Deepseek-3.2") from a defined list, knowing the exact handicap multiplier.
*   ...submit one, final, immutable prompt per theme per model. The system locks it after submission.
*   ...see my game's public page with its live rating, playtime stats, and model difficulty badge.
*   ...browse the public evolution tree of *any* public prompt, seeing every fork and version, even after the month ends.
*   ...have my private prompts automatically published to the permanent gallery at month-end if they meet a minimum rating threshold.
*   ...use my own external API key to run *another user's* public prompt on a different model and have those "prompt runs" attributed to me.
*   ...have my final monthly score calculated transparently from: `(Avg Rating * Handicap * Brevity * Engagement Multiplier) + (Popularity Points)`.

**As a Player (Sam), I want to...**
*   ...browse the current month's arcade, sorted by popularity or score, with clear model difficulty badges.
*   ...click a game and play it immediately in an embedded, responsive iframe with no ads.
*   ...rate a game on a 5-star scale after playing for at least 30 seconds.
*   ...see the exact prompt that generated the game on its detail page (if public).
*   ...see a timeline/visualization of that prompt's development history (if public).
*   ..."Run This Prompt" using my own OpenAI/Anthropic/etc. API key and select a different model to generate my own version, which is added to the "Prompt Runs" list.

**As a Researcher (Dr. Chen), I want to...**
*   ...export a CSV of all prompts, their models, raw scores, and component metrics (rating, brevity, playtime) for a given month.
*   ...view aggregate statistics on model performance (average score by model).
*   ...query the database to see fork frequency and depth for high-scoring prompts.

## 4. Features

### 4.1 Core Features (MVP - Minimum Viable Product)
**Definition of Done:** Features necessary for the first public monthly competition cycle.

1.  **Theme & Requirement Management System**
    *   **Description:** Admin-only interface to create a new "Monthly Challenge." Defines: Theme Name/Description, Start Date, End Date, Core Requirements (JSON schema for validation, e.g., `{"mustInclude": "scoreSystem", "mustSupport": "touchControls"}`).
    *   **Acceptance Criteria:**
        *   Admin can create a theme with a title, description, and date range.
        *   Admin can define a set of mandatory core requirements (textual checklist).
        *   Theme becomes visible to all users on the start date.
        *   Theme "locks" for new submissions at the end date; existing submissions become editable only for authors.

2.  **Prompt Submission & Versioning**
    *   **Description:** User workflow to submit a single prompt for a chosen theme and model. System creates an immutable "Submission" record. Users can create "Forks" of any **public** prompt during the month to create their own derivative version.
    *   **Acceptance Criteria:**
        *   User can select active theme and a single model from the predefined list (e.g., `"GPT-5.3|Opus-4.6 (Cheater)"`).
        *   A `Zod` schema validates prompt: must be 50-1000 characters, plain text only.
        *   On "Submit," system generates a unique `promptId`, records `userId`, `themeId`, `model`, `promptText`, `submissionTimestamp`. Status = `GENERATING`.
        *   User can click "Fork" on any public prompt's page. This creates a new draft submission pre-filled with the forked prompt, linked to the `parentPromptId`.
        *   Each fork/submission version is stored in full. A separate `PromptEvolution` table tracks the graph of relationships.

3.  **Game Generation Engine Integration**
    *   **Description:** Backend service that takes a `promptId`, calls the selected AI model via Vercel AI SDK, streams the response (an HTML file), and stores it as a static, iframe-compatible game bundle.
    *   **Acceptance Criteria:**
        *   System queues generation jobs (using a lightweight queue like BullMQ or a simple DB-backed worker).
        *   Worker uses Vercel AI SDK `generateText` with the user's prompt + a **secret, fixed system prompt** that enforces core requirements (e.g., "You are a game engine. Output ONLY a single HTML file with embedded CSS/JS. Must include an HTML5 score display. Must be responsive.").
        *   Output HTML is sanitized (DOMPurify), stored in object storage (e.g., S3/Vercel Blob) with a public URL, and its hash is saved to the `Submission` record.
        *   `Submission` status updates to `READY` or `FAILED`. On failure, error is logged and user notified.
        *   Total generation time from submission to `READY` < 2 minutes on average.

4.  **Game Rating & Playtime Tracking**
    *   **Description:** Embedded script in each generated game iframe that pings the backend on load, periodic heartbeats, and on explicit "Rate" button click.
    *   **Acceptance Criteria:**
        *   Every game iframe loads `https://arcadevibe.com/_next/static/telemetry.js`.
        *   Telemetry script sends `gameStart(promptId, sessionId)` event.
        *   Sends `heartbeat(promptId, sessionId)` every 30 seconds.
        *   On "Rate" button (provided by platform UI outside iframe), sends `rate(promptId, sessionId, 1-5)`.
        *   Backend aggregates: `total_play_seconds` (sum of unique session durations), `rating_count`, `rating_sum`.

5.  **Public Leaderboard & Scoring Engine**
    *   **Description:** Calculates and displays the final, holistic score for each submission in the active theme. Score is computed only after submission deadline.
    *   **Scoring Formula (Post-Month):**
        `FinalScore = (AvgRating * HandicapMultiplier * BrevityMultiplier * EngagementMultiplier) + PopularityPoints`
        *   `AvgRating = rating_sum / rating_count` (min 5 ratings required, else null).
        *   `HandicapMultiplier`: Predefined per model (e.g., `Cheater=0.8`, `Normal=1.0`, `Hard=1.5`, `Impossible=2.5`).
        *   `BrevityMultiplier = MIN(1.0, 500 / promptLength)`. Max score for ≤500 chars. Linear decay to 0 at 1000 chars.
        *   `EngagementMultiplier = MIN(1.5, 1.0 + (avgPlaySec - 60) / 240)`. Capped at 1.5x for >4 min avg play.
        *   `PopularityPoints = LOG(1 + rating_count) * 10`. Logarithmic scaling to reward volume.
    *   **Acceptance Criteria:**
        *   Leaderboard page shows submissions ranked by `FinalScore` (descending).
        *   Shows columns: Rank, Game Title (auto-generated by AI?), Model Badge, Final Score, Avg Rating, Plays.
        *   Score calculation job runs daily during the month (for preview) and finalizes at month-end. Hidden submissions are excluded.
        *   User profile shows their personal rank for the current month.

6.  **User Profile & Submission Gallery**
    *   **Description:** Public profile pages showing a user's created submissions and their "prompt runs" (games they generated using others' prompts).
    *   **Acceptance Criteria:**
        *   Profile page (`/u/[username]`) has two tabs: "My Games" (own submissions) and "My Runs" (prompt runs).
        *   "My Games" shows for each: title, theme, model, current score, status (Ready/Failed), visibility (Public/Private).
        *   "My Runs" shows for each: original prompt link, model used by user, date run.
        *   After month-end, all submissions with a score are automatically moved to a "Permanent Gallery" section on the creator's profile.

7.  **Authentication & Basic Authorization**
    *   **Description:** User sign-up/login using Better Auth. Handles user identity and session.
    *   **Acceptance Criteria:**
        *   Support for Email/Password and OAuth (GitHub, Google).
        *   Session is managed via HTTP-only cookies.
        *   tRPC middleware protects procedures: `createSubmission` requires auth, `getLeaderboard` is public.
        *   User can only edit/delete their own *draft* submissions.

### 4.2 Future Features (Post-MVP / Post-Launch)
1.  **Team Competitions:** Form teams, combine scores, team-specific leaderboards.
2.  **Live 24-Hr Prompt Jams:** Special event mode with shorter themes, real-time leaderboard updates.
3.  **Prompt Marketplace:** Authors can "publish" winning prompts as templates for sale (platform takes cut).
4.  **Advanced Model Leaderboards:** Separate rankings per model to see "best prompt for GPT-5.1" vs "best for Haiku."
5.  **Community Curation & Tags:** Post-scale, allow users to add genre tags (`platformer`, `puzzle`) to games.
6.  **Advanced Analytics Dashboard (for user):** Personal stats dashboard: model success rate, prompt length history, fork impact analysis.
7.  **Admin Moderation Tools:** Flag inappropriate generated games, suspend users, manually adjust scores/resolve disputes.
8.  **API for Public Data:** Official REST/GraphQL API for accessing non-sensitive public data (submissions, prompts, scores).

## 5. Technical Requirements

### Tech Stack (Strict Adherence)
*   **Frontend Framework:** Next.js 16 (App Router). Server and Client Components used appropriately.
*   **API Layer:** tRPC v11. All data fetching and mutations via type-safe procedures. No conventional REST endpoints.
*   **Database & ORM:** PostgreSQL 18. Drizzle ORM for all queries (SQL generation, migrations, type-safety).
*   **Authentication:** Better Auth (with `better-auth` package). Handles sessions, OAuth, email verification.
*   **Styling:** Tailwind CSS v4 + shadcn/ui for pre-built, accessible components.
*   **AI Integration:** Vercel AI SDK v6 and `ai/react` for streaming and generation logic.
*   **Validation:** Zod 4. Used for:
    *   tRPC input validation.
    *   Prompt submission schema.
    *   Core requirement validation (parsing JSON schema from theme).
    *   API response shaping.
*   **Deployment Target:** Vercel (optimized for Next.js, AI SDK, and Edge Functions).

### System Architecture Overview
```mermaid
graph TD
    A[User Browser] --> B[Next.js App Router<br/>React Pages]
    B --> C[tRPC Client]
    C --> D[tRPC Server Router<br/>(App Router)]
    
    D --> E{Procedure Type}
    E --> F[Public/Protected<br/>Query/Mutation]
    F --> G[Drizzle ORM]
    G --> H[(PostgreSQL 18<br/>User, Theme, Submission, etc.)]
    
    D --> I[AI Generation Procedure<br/>(Server Action)]
    I --> J[Vercel AI SDK Core]
    J --> K[External AI Provider APIs<br/>(OpenAI, Anthropic, etc.)]
    I --> L[Queue (e.g., BullMQ)]
    L --> M[Worker Process]
    M --> N[Generate HTML Game]
    M --> O[Store Game in<br/>Vercel Blob / S3]
    M --> P[Update Submission Record<br/>(status, url, hash)]
    
    Q[Game Iframe] --> R[Game Bundle<br/>(from Blob/S3)]
    R --> S[Telemetry Script<br/>(from /public)]
    S --> D
```

**Key Components:**
1.  **App Router Pages:** `/`, `/arcade`, `/theme/[id]`, `/game/[submissionId]`, `/u/[username]`, `/admin`.
2.  **tRPC Router:** Organized by context: `auth`, `theme`, `submission`, `game`, `user`, `admin`.
3.  **Database Schema (Key Tables):**
    *   `users`: id, email, username, created_at.
    *   `themes`: id, name, description, start_date, end_date, requirements (jsonb), created_by.
    *   `submissions`: id, user_id, theme_id, model_key, prompt_text, status ('DRAFT', 'GENERATING', 'READY', 'FAILED'), game_url, game_hash, created_at, parent_prompt_id (for forks), visibility ('PRIVATE', 'PUBLIC_AFTER', 'PUBLIC_NOW').
    *   `game_metrics`: submission_id (FK), total_plays, total_play_seconds, rating_count, rating_sum, last_played_at.
    *   `prompt_runs`: id, original_submission_id, user_id, model_used, prompt_text_used, generated_game_url, created_at.
4.  **Async Worker:** Separate process (could be a Next.js API route with a queue processor) that handles long-running AI generation jobs to avoid blocking the main serverless function.

### Security Requirements
1.  **API Key Management:** User-provided API keys for "Run This Prompt" feature must be stored **encrypted at rest** (using a server-side key). Never exposed to client. Used only in secure backend worker.
2.  **Input Sanitization:** All prompts and AI-generated HTML must be aggressively sanitized (DOMPurify on server before storage) to prevent XSS. CSP headers must be strict.
3.  **Rate Limiting:** Apply tRPC-middleware rate limiting on:
    *   `createSubmission` (e.g., 5/min, 20/day).
    *   `runExternalPrompt` (e.g., 10/min, tied to API key usage costs).
4.  **Authorization:** Enforce ownership checks on all `submission` mutations and profile data.
5.  **Secret System Prompt:** The fixed, core-enforcing system prompt sent to the AI must be a **server-side secret**, never sent to the client.

### Performance Requirements
1.  **CDN:** All static assets (generated game bundles, JS, CSS, images) served via Vercel Edge Network/CDN.
2.  **Database Indexing:** Critical indexes on `submissions(theme_id, status, created_at)`, `game_metrics(submission_id)`, `prompt_runs(original_submission_id)`.
3.  **Caching:** Cache public, static pages (leaderboard, theme list) at the Edge (`revalidate` 60s). Cache individual public game pages for 5 minutes.
4.  **Generation Queue:** Must be reliable. Failed jobs should have retry logic (max 3 retries). Monitor queue depth.

## 6. Timeline & Milestones (Rough Estimation)

**Phase 0: Foundation & Discovery (Week 1-2)**
*   Finalize core scoring formula details with stakeholders.
*   Set up Next.js monorepo with strict tech stack.
*   Implement Better Auth, Drizzle, basic tRPC setup.
*   Design and create initial database schema.
*   **Milestone:** "Hello World" app with user login and protected tRPC router.

**Phase 1: MVP Core Loop (Week 3-6)**
*   Implement Theme and Submission CRUD (tRPC + Drizzle).
*   Build Prompt Submission UI with fork functionality.
*   Integrate Vercel AI SDK for *basic* game generation (no queue yet).
*   Implement game iframe embedding and **basic** telemetry (play count).
*   Build 5-star rating system.
*   **Milestone:** Can submit a prompt, get a generated game (in dev mode), play it, rate it.

**Phase 2: Polish & Scoring (Week 7-9)**
*   Implement robust generation queue/worker.
*   Implement full telemetry (playtime tracking).
*   Build and finalize **Scoring Engine** with all multipliers. Make it recalculatable.
*   Build public Leaderboard page with correct ranking.
*   Implement user profile pages (My Games, My Runs).
*   Add "Run This Prompt" feature with external API key handling (encrypted storage).
*   **Milestone:** Full monthly lifecycle works in staging: submit, generate, play, rate, see leaderboard.

**Phase 3: Launch & Stability (Week 10-12)**
*   **Beta Launch (Soft):** Invite 50-100 trusted users from target communities. Run a **private** beta month.
    *   Monitor: generation success rate, queue times, cost projections, user feedback on UX.
    *   Stress test: simulate 300 concurrent submissions.
*   Fix critical bugs, optimize slow queries, tweak scoring weights.
*   Prepare admin tools (theme creation, manual submission override).
*   **Milestone:** **Public V1 Launch.** First official "Arcade Vibe" monthly challenge goes live.
    *   Day 0: Theme announcement.
    *   Week 1-4: Submissions open.
    *   Month End: Automatic leaderboard freeze and gallery creation.

**Ongoing (Post-Launch):**
*   Month 2: Monitor KPIs, user retention.
*   Month 3: Evaluate first "Post-MVP" feature (likely Team Competitions or Marketplace).

## 7. Open Questions / Risks

### Open Questions (Requires Clarification)
1.  **Scoring Formula Specifics:** The provided formula is a starting point. We need to define exact target values (e.g., what is the "base" `AvgRating` weight? Should `PopularityPoints` be additive or multiplicative?). A/B testing in early betas will be crucial.
2.  **Game Title Generation:** How should game titles be generated? Option A: Use a separate, cheap model call to generate a title from the prompt. Option B: Let users enter a title on submission. **Risk:** Option A adds cost/queue time. Option B adds UI friction.
3.  **Prompt Publicity Threshold:** The spec says "private at the end of the month or full public from their run." What's the threshold for "private at the end"? e.g., `if (FinalScore > X)` or `if (rating_count > Y)`? Need a concrete rule.
4.  **Model List Management:** How are new models added/removed? Who decides the `HandicapMultiplier`? Should this be an admin-configurable table?

### Technical Risks & Mitigations
1.  **AI Cost Explosion (High Risk):** If 500 users each run 3 models, that's 1500+ generation API calls/month. Costs could balloon.
    *   *Mitigation:* Implement strict rate limiting per user *per model*. Consider a "credits" system where each user gets 2 free runs/month, additional runs cost a fee (even if just to cover API cost). Monitor usage daily.
2.  **Generation Quality & Consistency (High Risk):** The "secret system prompt" might not be robust enough to guarantee `iframe compatible`, `responsive`, `core requirements` output from all models.
    *   *Mitigation:* Extensive testing of the system prompt across all target models *before* launch. Have fallback validation: if generated HTML fails basic checks (no `<html>` tag, no `<canvas>`/`<div>` for game), mark submission `FAILED` and notify user. Consider allowing a *single* regenerated attempt on failure (within 1 min of first submission).
3.  **Scalability of Queue (Medium Risk):** During Week 1, 100s of submissions may flood in. The worker queue must scale.
    *   *Mitigation:* Use a managed queue (BullMQ with Redis, or managed service). On Vercel, use a queue that can burst to many serverless functions. Monitor `queue.waitTime` metric closely.
4.  **User-Supplied API Key Security (High Risk):** Storing user keys is a liability.
    *   *Mitigation:* Use strong encryption (AES-256-GCM) with a key stored in environment variable. Never log the key. Provide clear UI: "Your key is stored encrypted and only used server-side." Offer an option to "revoke" (delete) the key.
5.  **Game iframe Compatibility & Performance (Medium Risk):** Generated games could be huge, use blocking JS, or break in iframes.
    *   *Mitigation:* The system prompt must mandate "All code must be inline, no external resource requests." Sanitize output to remove `<script src=...>`. Enforce a size limit (e.g., 500KB gzipped). Test iframe sandbox attributes (`allow-scripts`, `allow-same-origin`).
6.  **Abuse & Prompt Theft (Medium Risk):** Users could submit prompts they know work well, or scrape others' prompts.
    *   *Mitigation:* The scoring formula's `BrevityMultiplier` strongly discourages long, copied prompts. Public fork tree *encourages* remixing as part of the meta-game. Legal: Terms of Service must state that by submitting, users grant a license to display the prompt and game publicly. Add a simple "Report Plagiarism" button.

### Business/Product Risks
1.  **Community Cold Start:** No games = no players = no ratings = no competition.
    *   *Mitigation:* Seed the first month with 20-30 "demo" submissions from the founding team/known prompt engineers with high-quality prompts.
2.  **Scoring Complexity Confusion:** Users may not understand why their score is low.
    *   *Mitigation:* On the leaderboard and profile, break down the final score into its component parts with tooltips (e.g., "Brevity: 0.92x (562 chars)"). Publish the formula openly.
3.  **Theme Ambiguity:** A vague theme leads to low-quality or wildly divergent games, making fair scoring hard.
    *   *Mitigation:* Themes must be specific but open-ended ("Make a game about *gravity*"). Core requirements (scoring, lives) provide necessary constraints. Have an admin review theme proposals.

---
**Document Approval**
*   Product Owner: [Pending]
*   Lead Engineer: [Pending]
*   Design Lead: [Pending]