# Master Product Requirements Document: Arcade Vibe

## 1. Overview

### Executive Summary

Arcade Vibe is a competitive prompt engineering platform disguised as a retro arcade. The core mechanic is a monthly "One-Shot" challenge: participants craft a single, zero-context prompt to generate a fully playable browser-based game. The platform gamifies prompt engineering as a sport, combining strategic model selection (difficulty handicaps), prompt efficiency (brevity scoring), and community validation (ratings/playtime) into a transparent, immortal leaderboard.

Unlike iterative AI coding tools, Arcade Vibe enforces strict constraints: one message, no history, no hand-holding. Success requires mastery of instruction clarity, model behavior prediction, and strategic risk-taking.

### Problem Statement

The prompt engineering discipline lacks a standardized competitive arena. Current tools emphasize conversational iteration, obscuring the pure skill of single-shot instruction design. Practitioners cannot objectively benchmark prompt efficiency against peers, and the community lacks transparent repositories of high-performance prompts for meta-analysis. Furthermore, no existing platform treats model selection as a strategic handicap system, where choosing weaker models yields higher rewards for skilled prompt engineers.

### Value Proposition

**For Prompt Engineers (The Architects):** A rigorous proving ground where prompt craft is the sole competitive variable. Gain permanent reputation through immutable leaderboard rankings, detailed prompt genealogy tracking, and recognition for achieving high scores with "Impossible" tier models.

**For Players & Learners (The Arcade):** Access to a curated, monthly-refreshed gallery of unique AI-generated games with full provenance transparency. The ability to inspect, fork, and re-run any public prompt facilitates meta-learning and community-driven prompt analysis.

**For the Ecosystem:** A living dataset correlating prompt characteristics (length, structure, model selection) with engagement metrics and output quality, advancing the collective understanding of single-shot generation limits.

---

## 2. Objectives

### Business Goals

- **Category Leadership:** Establish Arcade Vibe as the definitive competitive authority for prompt engineering within 12 months.
- **Sustainable Engagement:** Drive recurring monthly participation through the "Season" cycle, achieving 40% month-over-month retention for prompt engineers.
- **Community-Owned Content:** Build a permanent, searchable archive of 10,000+ prompt-game pairs within 6 months.
- **Network Effects:** Achieve a "Prompt Run" to Original Submission ratio > 2:1, indicating deep community engagement and meta-analysis.

### Technical Goals

- **Type-Safe Architecture:** Maintain 100% end-to-end type safety via tRPC v11, Zod 4, and Drizzle ORM.
- **Zero-Context Enforcement:** Implement strict "One-Shot" pipeline preventing conversational context leakage.
- **Scalable Infrastructure:** Support 500+ concurrent generation requests and 10,000+ concurrent WebSocket connections during leaderboard freeze events.
- **Security-First Design:** Sandbox untrusted AI-generated code with iframe isolation, CSP headers, and automated content scanning.

### Success Metrics (KPIs)

| Metric                             | Target (Launch) | Target (Month 6) | Measurement Method            |
| ---------------------------------- | --------------- | ---------------- | ----------------------------- |
| **Engagement**                     |                 |                  |                               |
| Avg. session length (gameplay)     | >5 min          | >8 min           | Web beacon tracking in iframe |
| Games rated per user/month         | 5               | 15               | Database aggregation          |
| **Quality**                        |                 |                  |                               |
| % entries rated ≥4 stars           | >40%            | >55%             | Bayesian average rating       |
| Average rating across platform     | 3.5             | 4.0              | Weighted calculation          |
| **Virality**                       |                 |                  |                               |
| Prompt runs : Original submissions | >0.5:1          | >2:1             | Database relation tracking    |
| Social shares per month            | 500             | 2,000            | Analytics tracking            |
| **Retention**                      |                 |                  |                               |
| Month 1→2 participant return rate  | >35%            | >50%             | Cohort analysis               |
| Monthly active prompt engineers    | 100             | 500              | Auth session tracking         |
| **Innovation**                     |                 |                  |                               |
| Model diversity (Shannon entropy)  | >2.5            | >3.0             | Distribution analysis         |
| Fork rate (% prompts forked)       | >15%            | >30%             | Version control tracking      |

---

## 3. Target Audience

### User Personas

#### Persona 1: The Competitive Architect (Prompt Engineer)

**Demographics:** 25-40, Software Engineers, ML Researchers, Technical Writers, AI Enthusiasts
**Psychographics:** Optimization-obsessed, competitive, values intellectual property protection but craves validation. Seeks to prove mastery through constraint-based problem solving.
**Goals:**

- Win monthly rankings and achieve "Impossible" tier victories
- Master model-specific quirks and prompt portability
- Build a public portfolio of prompt evolution and lineage
- Demonstrate efficiency through brevity scoring
  **Frustrations:**
- Platforms that don't track or reward genuine prompt engineering skill
- Lack of standardized benchmarks for single-shot generation
- Difficulty finding high-quality learning resources and prompt patterns
- Fear of prompt theft without attribution
  **Arcade Vibe Value:** Clear competitive structure with transparent scoring, detailed analytics on prompt performance, permanent reputation tracking, and protection via visibility controls.

#### Persona 2: The Curious Explorer (Player/Learner)

**Demographics:** 18-35, Students, Hobbyist Developers, Casual Gamers, AI Curious
**Psychographics:** Curious, analytical, enjoys reverse-engineering. Values learning through observation and low-stakes experimentation.
**Goals:**

- Discover unique, AI-generated games and novel mechanics
- Learn prompt engineering through inspection of successful examples
- Experiment with public prompts using personal API keys
- Contribute to community knowledge through ratings and comments
  **Frustrations:**
- Overly complex platforms with high barriers to entry
- Lack of educational pathways and clear examples
- Intimidating community environments dominated by experts
- Black-box AI tools that hide the prompting process
  **Arcade Vibe Value:** Easy entry point with educational content through public prompts, low-stakes experimentation via "Prompt Runs," clear guidance, and transparent prompt evolution histories.

#### Persona 3: The Meta-Researcher (Analyst)

**Demographics:** 30-50, ML Researchers, Data Scientists, Technical Writers, Academics
**Psychographics:** Systematic, data-driven, focused on pattern recognition and comparative analysis.
**Goals:**

- Study prompt portability across different foundation models
- Analyze correlations between prompt structure and output quality
- Build datasets for research on single-shot generation capabilities
- Track model performance evolution over time
  **Frustrations:**
- Lack of export functionality and standardized data formats
- Inconsistent data schemas across platforms
- Limited API access for batch analysis
- Difficulty tracking prompt lineage and evolution
  **Arcade Vibe Value:** Comprehensive data access via CSV export and API, consistent schemas, ability to run batch experiments, and complete prompt genealogy tracking.

### 3.2 User Stories

| As a...         | I want to...                                         | So that...                                       | Priority |
| --------------- | ---------------------------------------------------- | ------------------------------------------------ | -------- |
| Prompt Engineer | Submit a one-shot prompt to generate a complete game | I can compete in the monthly challenge           | P0       |
| Prompt Engineer | Select from multiple AI model difficulty tiers       | I can optimize my risk/reward strategy           | P0       |
| Prompt Engineer | Run my prompt against multiple models simultaneously | I can compare outputs before final submission    | P0       |
| Prompt Engineer | Create private versions of my prompt                 | I can iterate without revealing strategies early | P0       |
| Prompt Engineer | Fork existing public prompts                         | I can build upon community knowledge             | P1       |
| Prompt Engineer | View detailed analytics on my submissions            | I can understand performance drivers             | P1       |
| Player          | Browse games by difficulty and rating                | I can find quality experiences                   | P0       |
| Player          | Play games in a secure iframe                        | I can enjoy generated content safely             | P0       |
| Player          | Rate games on a 5-star scale                         | I can contribute to quality rankings             | P0       |
| Player          | View the prompt that generated a game                | I can learn from successful examples             | P1       |
| Player          | Run public prompts with my own API key               | I can experiment with different models           | P1       |
| Researcher      | Export competition data as CSV                       | I can perform external analysis                  | P2       |
| Researcher      | Access a public API                                  | I can integrate with research tools              | P2       |

---

## 4. Features

### 4.1 Core Features (MVP)

#### Feature 1: Monthly Challenge System

**Description:** The foundational competitive structure that drives recurring engagement. Each month features a unique theme with immutable technical requirements.

**Detailed Requirements:**

- **Theme Management:** Admin interface to create themes with title, description, start/end dates (UTC), and core requirements schema
- **Core Requirements (Immutable):** Every submission must generate games including:
  - Scoring system (persistent across sessions)
  - Lives system
  - Level progression (minimum 2 distinct levels)
  - Responsive controls (keyboard + touch)
  - iframe compatibility (no external dependencies or build, pure js in an iframe)
- **Lifecycle Automation:**
  - Week 1: Theme announcement, submissions open
  - Weeks 2-3: Active competition, community testing
  - Week 4: Final submissions, leaderboard volatility
  - Month End: Automatic freeze, archive creation, new theme activation

**Acceptance Criteria:**

- [ ] Theme transitions automatically at UTC midnight on 1st of month
- [ ] Previous month games remain playable with "Frozen Rank" badges
- [ ] Core requirements enforced via automated validation (schema check)
- [ ] Submission lock occurs automatically at month-end (no manual intervention)
- [ ] New theme announcement triggers email/push notifications to active users

---

#### Feature 2: Prompt Engineering Workspace

**Description:** The central creation environment where users craft, test, and manage one-shot prompts with strict zero-context enforcement.

**Detailed Requirements:**

- **Zero-Context Enforcement:**
  - Single text input field (no chat history, no file uploads)
  - System automatically appends hidden "Core Requirements" prompt (invisible to user)
  - No multi-turn conversation capability
- **Model Selection Interface:**
  - Visual tier system with difficulty badges:
    - **Cheater Tier** (0.8x multiplier): GPT-5.3, Opus-4.6
    - **Easy Tier** (0.9x multiplier): sonnet-4.5
    - **Normal Tier** (1.0x multiplier): GLM-4.7, Kimi-k2.5
    - **Hard Tier** (1.25x multiplier): Deepseek-3.2, GPT-5.1-mini, Haiku-4.5
    - **Impossible Tier** (2.5x multiplier): Tiny models (<7B parameters)
  - Real-time cost estimation display per model
- **Multi-Model Execution:**
  - "Compare Mode": Run prompt on many models simultaneously
  - Side-by-side diff viewer for generated outputs
  - Parallel streaming display for up to 3 models simultaneously, others display as tabs
- **Version Control & Forking:**
  - Immutable version history with SHA-256 hashing
  - Visual diff between versions
  - Fork capability (creates new prompt lineage linked to parent)
  - Branch visualization using react-flow (prompt genealogy tree)
- **Privacy Controls:**
  - **Private**: Creator only (hidden from leaderboard until published)
  - **Public (End of Month)**: Auto-reveals at month freeze
  - **Full Public**: Immediately visible with full prompt text

**Acceptance Criteria:**

- [ ] Prompt input enforces single-message constraint (no conversation history)
- [ ] Model selector displays correct difficulty multipliers and cost estimates
- [ ] "Compare Mode" executes 2-3 models in parallel with progress indicators
- [ ] Version control creates immutable snapshots with parent-child relationships
- [ ] Privacy toggle updates visibility state within 5 seconds
- [ ] Fork operation preserves attribution and creates new editable copy
- [ ] Brevity score calculates in real-time (character/token count)

---

#### Feature 3: Secure Game Execution Environment

**Description:** A hardened sandbox for running untrusted AI-generated code safely.

**Detailed Requirements:**

- **Iframe Isolation:**
  - Strict sandbox attributes: `sandbox="allow-scripts"` (no allow-same-origin to prevent cookie access)
  - Separate subdomain or blob URL origin for generated content
  - CSP headers blocking external network requests (data URIs and internal APIs only)
- **Content Sanitization:**
  - DOMPurify server-side processing of generated HTML
  - Removal of non white listed external script references (`<script src="...">`)
  - Size limits (max 500KB gzipped per game)
- **Technical Enforcement:**
  - Standardized viewport (responsive down to 320px)
  - Message passing API for score reporting (`postMessage` protocol)
  - Automatic session termination after 30 minutes idle
  - Error boundary capture for game crashes

**Acceptance Criteria:**

- [ ] Generated code executes without access to parent window cookies/localStorage
- [ ] External network requests blocked by CSP (except approved resources)
- [ ] Games load within 2 seconds
- [ ] Responsive layout functions from 320px to 1920px widths
- [ ] Crash in game iframe does not affect parent application
- [ ] Malicious code (infinite loops, alerts) terminated automatically

---

#### Feature 4: Composite Scoring & Leaderboard Engine

**Description:** A multi-dimensional scoring algorithm that ranks submissions based on quality, difficulty, efficiency, and engagement.

**Detailed Requirements:**

- **Scoring Formula:**

  ```
  FinalScore = (Quality × 0.40) + (Difficulty × 0.25) + (Efficiency × 0.20) + (Engagement × 0.15)

  Where:
  Quality = BayesianAverageRating × 20 (Wilson score interval, 95% confidence)
  Difficulty = ModelMultiplier × 20 (Cheater: 0.8, Normal: 1.0, Hard: 1.5, Impossible: 2.5)
  Efficiency = BrevityBonus × 20 (Max at ≤500 chars, logarithmic decay to 0 at 4000 chars)
  Engagement = min(AvgPlaytimeSeconds / 300, 1.0) × 20 (Capped at 5 minutes)
  ```

- **Anti-Gaming Measures:**
  - Bayesian averaging to prevent early low-volume rating manipulation
  - Minimum 5 ratings required for leaderboard eligibility
  - Proof-of-playtime: Minimum 60 seconds playtime required before rating submission
  - IP + User Agent fingerprinting for vote deduplication
- **Leaderboard Features:**
  - Real-time updates via tRPC subscriptions (WebSocket)
  - Filtering by model tier, theme, and time period
  - Frozen historical archives (immutable post-month-end)
  - Top 100 cached in Redis with 5-minute TTL
  - Tie-breaking by earliest submission time (encourages early participation)

**Acceptance Criteria:**

- [ ] Scores recalculate within 5 minutes of new ratings
- [ ] Bayesian confidence intervals prevent "early voter" advantage
- [ ] Leaderboard filters respond within 200ms
- [ ] Historical month archives remain immutable (frozen rankings)
- [ ] Difficulty multipliers correctly apply based on model selection
- [ ] Brevity scoring uses token count (cl100k_base) not just characters

---

#### Feature 5: Community Interaction & Prompt Portability

**Description:** Tools for the community to learn from, test, and build upon existing prompts.

**Detailed Requirements:**

- **Prompt Genealogy:**
  - Visual tree view showing fork lineage and version history
  - Diff viewer comparing any two prompt versions
  - Attribution tracking (original author credit on all forks)
- **"Run This Prompt" Functionality:**
  - Execute any public prompt using user's own API key (BYOK)
  - Model selection override (test GPT prompt on Claude, etc.)
  - Results saved as "Prompt Runs" in user profile
  - Contribution to portability metrics (cross-model success rates)
- **Rating & Feedback System:**
  - 5-star overall rating + category ratings (Gameplay, Visuals, Creativity, Technical)
  - Mandatory minimum playtime (60 seconds) before rating
  - Optional written review (max 500 characters)
  - Rating weight based on user reputation (anti-sybil)

**Acceptance Criteria:**

- [ ] Fork creates new prompt with parent reference preserved
- [ ] Diff viewer highlights text changes between versions
- [ ] "Run This Prompt" accepts user API keys (encrypted storage)
- [ ] Cross-model runs populate portability analytics
- [ ] Rating submission blocked if playtime < 60 seconds
- [ ] Reviews display with user reputation badges

---

### 4.2 Future Features (Post-MVP)

| Feature                | Description                                                                                 | Target Quarter |
| ---------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| **Team Competitions**  | Squad-based prompt engineering (2-4 members) with shared workspaces and combined scoring    | Q3 2026        |
| **Live Prompt Jams**   | 24-hour time-boxed events with real-time leaderboards and streaming overlays                | Q4 2026        |
| **Prompt Marketplace** | Tokenized exchange for proven prompt templates with creator royalties                       | Q2 2027        |
| **Model Leaderboards** | Aggregate statistics showing which AI models generate highest-rated games across all themes | Q2 2027        |
| **Advanced Analytics** | AST diff analysis, prompt entropy scoring, and model capability heatmaps                    | Q3 2027        |
| **Mobile App**         | Native iOS/Android wrapper for game browsing and prompt submission                          | Q4 2027        |
| **API Access**         | Public REST/GraphQL endpoints for researchers and third-party integrations                  | Q3 2026        |

---

## 5. Technical Requirements

### 5.1 Technology Stack (Strict Compliance)

The following stack is mandated based on the original vision document and technical constraints:

| Layer                  | Technology                      | Justification                                                                                        |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Frontend Framework** | Next.js 16 (App Router)         | Server Components for performance, Edge runtime support, file-system routing                         |
| **API Layer**          | tRPC v11                        | End-to-end type safety, zero serialization overhead, subscription support for real-time leaderboards |
| **Database**           | PostgreSQL 18                   | ACID compliance for scoring integrity, JSONB for flexible prompt metadata, mature ecosystem          |
| **ORM**                | Drizzle ORM                     | Type-safe queries, minimal overhead, excellent tRPC integration, migration support                   |
| **Authentication**     | Better Auth                     | Modern security flows, OAuth providers (GitHub/Google), session management, MFA support              |
| **Styling**            | Tailwind CSS v4 + shadcn/ui     | Utility-first consistency, retro arcade theming support, accessible components                       |
| **AI Integration**     | Vercel AI SDK v6 + AI SDK-React | Unified multi-provider interface, streaming support, React hooks for real-time generation            |
| **Validation**         | Zod 4                           | Runtime type checking, schema composition, tRPC input validation, prompt structure validation        |
| **Queue System**       | BullMQ (Redis-based)            | Reliable generation job processing, fair scheduling, retry logic for failed generations              |
| **Storage**            | Vercel Blob / S3                | Static asset hosting for generated games, CDN distribution, cost-effective archiving                 |
| **Caching**            | Redis 7                         | Leaderboard real-time updates, session storage, rate limiting counters                               |

### 5.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  Next.js 16 (App Router) + tRPC Client + Vercel AI SDK React  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Prompt     │  │   Game      │  │   Leaderboard           │  │
│  │  Editor     │  │   Player    │  │   & Profile             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                        API Layer (tRPC v11)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐     │
│  │ Auth     │ │ Prompts  │ │ Games    │ │ Leaderboard  │     │
│  │ Router   │ │ Router   │ │ Router   │ │ Router       │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Scoring  │ │ Themes   │ │ Runs     │                       │
│  │ Engine   │ │ Admin    │ │ (BYOK)   │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐        ┌──────────────────┐
│  PostgreSQL  │        │      Redis       │
│  - Users     │        │  - Sessions      │
│  - Prompts   │        │  - Leaderboards  │
│  - Games     │        │  - Rate Limits   │
│  - Ratings   │        │  - Job Queues    │
│  - Scores    │        │                  │
└──────────────┘        └──────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│         External Services               │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ OpenAI   │  │ Anthropic│  │ DeepSeek│ │
│  │ API      │  │ API      │  │ API     │ │
│  └──────────┘ └──────────┘ └─────────┘ │
│  ┌──────────┐ ┌──────────┐             │
│  │ GLM/Zhipu│  │ Moonshot │             │
│  │ API      │  │ API      │             │
│  └──────────┘ └──────────┘             │
└─────────────────────────────────────────┘
```

### 5.3 Database Schema (Core Entities)

```typescript
// Drizzle ORM Schema Definition

// Users table - Better Auth integration
const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  reputation: integer("reputation").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Monthly themes/challenges
const themes = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: jsonb("requirements").notNull(), // Schema for validation
  status: themeStatusEnum("status").default("upcoming").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prompts table - the core creative artifact
const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .references(() => users.id)
    .notNull(),
  themeId: uuid("theme_id")
    .references(() => themes.id)
    .notNull(),
  parentId: uuid("parent_id").references(() => prompts.id), // For forks
  content: text("content").notNull(), // The actual prompt text
  contentHash: varchar("content_hash", { length: 64 }).notNull(), // SHA-256
  tokenCount: integer("token_count").notNull(), // cl100k_base
  visibility: visibilityEnum("visibility").default("private").notNull(),
  status: promptStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Generated games (submissions)
const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptId: uuid("prompt_id")
    .references(() => prompts.id)
    .notNull(),
  modelKey: varchar("model_key", { length: 100 }).notNull(), // gpt-4, claude-3, etc.
  modelTier: modelTierEnum("model_tier").notNull(),
  generatedCode: text("generated_code"), // Stored HTML/JS
  assetUrl: varchar("asset_url", { length: 500 }), // CDN link to static file
  executionTime: integer("execution_time"), // ms
  status: gameStatusEnum("status").default("generating").notNull(),
  isSubmitted: boolean("is_submitted").default(false), // Official entry flag
  frozenRank: integer("frozen_rank"), // Null until month-end
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prompt runs (user experiments on others' prompts)
const promptRuns = pgTable("prompt_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalPromptId: uuid("original_prompt_id")
    .references(() => prompts.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  modelUsed: varchar("model_used", { length: 100 }).notNull(),
  generatedGameId: uuid("generated_game_id").references(() => games.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ratings and engagement
const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .references(() => games.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  overallScore: integer("overall_score").notNull(), // 1-5
  gameplayScore: integer("gameplay_score"), // 1-5
  visualsScore: integer("visuals_score"), // 1-5
  creativityScore: integer("creativity_score"), // 1-5
  technicalScore: integer("technical_score"), // 1-5
  playtimeSeconds: integer("playtime_seconds").notNull(),
  reviewText: text("review_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calculated scores (materialized view or table)
const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .references(() => games.id)
    .notNull(),
  bayesianRating: decimal("bayesian_rating", { precision: 5, scale: 2 }),
  difficultyMultiplier: decimal("difficulty_multiplier", {
    precision: 3,
    scale: 2,
  }),
  brevityScore: decimal("brevity_score", { precision: 5, scale: 2 }),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  popularityScore: decimal("popularity_score", { precision: 5, scale: 2 }),
  finalScore: decimal("final_score", { precision: 8, scale: 4 }).notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(), // For audit trail
});

// Indexes for performance
const indexes = {
  // Leaderboard queries
  idx_scores_final_desc:
    "CREATE INDEX idx_scores_final ON scores(finalScore DESC)",
  idx_games_theme_status:
    "CREATE INDEX idx_games_theme ON games(themeId, status)",
  idx_ratings_game: "CREATE INDEX idx_ratings_game ON ratings(gameId)",
  // User queries
  idx_prompts_author: "CREATE INDEX idx_prompts_author ON prompts(authorId)",
  idx_prompts_theme: "CREATE INDEX idx_prompts_theme ON prompts(themeId)",
};
```

### 5.4 Security & Compliance Requirements

**Authentication & Authorization:**

- Better Auth with JWT session tokens (15-minute expiry, refresh token rotation)
- OAuth 2.0 providers: GitHub, Google (optional: Twitter/Discord)
- Role-based access control: Admin, Moderator, Participant, Viewer
- Two-factor authentication for top-ranked accounts (optional)

**Data Protection:**

- AES-256 encryption for user-provided API keys (envelope encryption with KMS)
- API keys never logged or exposed to client-side code
- GDPR compliance: Right to data export (CSV/JSON) and deletion
- PII minimization: Store only email, username, and reputation metrics

**Content Security:**

- **Sandbox Isolation:** Generated games run in separate origin iframes with `sandbox="allow-scripts"` (no allow-same-origin)
- **CSP Headers:** `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'` (no external resources)
- **Input Sanitization:** DOMPurify server-side before storage; removal of `<script src>` tags
- **Prompt Injection Defense:** System prompt (core requirements) separated from user input; no user override of system instructions
- **Automated Moderation:** OpenAI Moderation API scan on generated content; community flagging system

**Rate Limiting & Abuse Prevention:**

- Generation limits: 10/hour per user (Cheater tier), 20/hour (Hard tier)
- Rating limits: 50/day per user to prevent spam
- IP-based fingerprinting for vote deduplication
- CAPTCHA on registration and high-frequency actions

### 5.5 Performance Requirements

**Latency Targets:**

- **Page Load:** First Contentful Paint < 1.0s, Time to Interactive < 2.5s
- **API Response:** tRPC procedures < 200ms (p95) for cached data, < 500ms for complex queries
- **Generation Start:** Time to first token < 2 seconds
- **Game Load:** iframe render < 2 seconds from CDN
- **Leaderboard Updates:** Real-time subscription latency < 500ms

**Scalability Targets:**

- Support 1,000 concurrent game generations during peak (Week 4)
- Support 10,000 concurrent WebSocket connections for live leaderboard
- Database handling 100k+ ratings per month without degradation
- CDN serving 10M+ game loads per month

**Optimization Strategies:**

- **Database:** Connection pooling (PgBouncer), read replicas for leaderboard queries, composite indexes on `(theme_id, status, created_at)` and `(game_id, created_at)`
- **Caching:** Redis for session storage, leaderboard top 100 (5-min TTL), and rate limiting counters; Next.js ISR for static pages
- **CDN:** Vercel Edge Network for global game asset distribution
- **Queue:** BullMQ for generation job processing to prevent API timeouts
- **Streaming:** Vercel AI SDK for token-by-token generation feedback

---

## 6. Timeline & Milestones

### Phase 1: Foundation & Infrastructure (Weeks 1-3)

**Objective:** Establish type-safe foundation and authentication

- **Week 1:** Next.js 16 setup, tRPC v11 configuration, Drizzle ORM schema design, PostgreSQL 18 provisioning
- **Week 2:** Better Auth integration (OAuth + Email), user profile schema, basic UI shell with Tailwind v4 + shadcn/ui
- **Week 3:** Database migrations, CI/CD pipeline (GitHub Actions), staging environment deployment
- **Deliverable:** "Hello World" app with auth, protected routes, and database connectivity

### Phase 2: Core Generation Engine (Weeks 4-6)

**Objective:** Build the AI generation pipeline and sandbox

- **Week 4:** Vercel AI SDK v6 integration, model provider abstraction (OpenAI, Anthropic, DeepSeek, GLM), generation queue implementation (BullMQ)
- **Week 5:** Secure iframe sandbox implementation, CSP headers, game validation (core requirements check), asset storage pipeline (Vercel Blob/S3)
- **Week 6:** Prompt versioning system (immutable storage), fork functionality, privacy controls (private/public/delayed), multi-model comparison runner
- **Deliverable:** Users can submit prompts, generate games, and view them in sandboxed iframes

### Phase 3: Competition & Community (Weeks 7-9)

**Objective:** Implement scoring, leaderboards, and social features

- **Week 7:** Rating system (5-star + categories), playtime tracking (iframe telemetry), composite scoring algorithm implementation
- **Week 8:** Real-time leaderboard (tRPC subscriptions), monthly theme lifecycle automation, gallery browsing with filters
- **Week 9:** "Run This Prompt" functionality (BYOK), prompt genealogy visualization, user profile enhancements (stats, achievements)
- **Deliverable:** Complete competition loop: submit → generate → rate → score → rank

### Phase 4: Polish & Launch (Weeks 10-12)

**Objective:** Security, performance, and public launch

- **Week 10:** Security audit (sandbox escape testing, XSS prevention), rate limiting implementation, API key encryption verification
- **Week 11:** Performance optimization (database indexing, Redis caching, CDN configuration), load testing (500 concurrent generations)
- **Week 12:** Beta testing with 100 users, bug fixes, documentation, "Month 0" theme launch (internal)
- **Deliverable:** Production-ready platform ready for public "Month 1" challenge

### Phase 5: Post-Launch (Ongoing)

- **Month 1-2:** Monitor KPIs, gather feedback, optimize scoring weights
- **Month 3:** Evaluate first post-MVP feature (Team Competitions or Live Jams)
- **Month 6:** Review model diversity and adjust difficulty multipliers if needed

---

## 7. Open Questions / Risks

### Critical Open Questions

1. **Cost Model & API Key Management**
   - **Question:** Who bears the cost of AI generation? Platform (SaaS) or User (BYOK)?
   - **Recommendation:** Hybrid approach for MVP:
     - Platform provides limited free generations per month (e.g., 10) for "Hard" and "Impossible" tiers to encourage diversity
     - "Cheater" tier (expensive models) requires BYOK (Bring Your Own Key) or premium subscription
     - "Run This Prompt" feature always uses BYOK to prevent cost explosion

2. **Scoring Formula Calibration**
   - **Question:** Exact weights for the composite score need validation. How do we prevent gaming the brevity score with gibberish?
   - **Recommendation:**
     - Launch with adjustable weights (stored in database) to tune during first 3 months
     - Implement minimum quality gate: prompts must generate playable games (pass validation) to qualify for brevity bonuses
     - Use token count (cl100k_base) not character count for brevity to prevent whitespace padding

3. **Content Moderation & Safety**
   - **Question:** How to handle NSFW, copyrighted, or malicious code generation?
   - **Recommendation:**
     - Automated pre-screening: OpenAI Moderation API on prompts + generated code
     - Community flagging with human review queue
     - Strict CSP in iframe prevents external resource loading (mitigates copyright issues)
     - Terms of Service: User retains IP rights to prompts, platform gets display license

### Technical Risks & Mitigations

| Risk                     | Impact                                                              | Mitigation Strategy                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AI Model Drift**       | High - Model updates mid-month invalidate "Impossible" tier balance | Pin specific model versions (e.g., `gpt-4-1106-preview`) at month start; maintain version history in database                                          |
| **Sandbox Escape**       | Critical - Generated game escapes iframe, accesses cookies/parent   | Strict `sandbox="allow-scripts"` (no allow-same-origin), separate subdomain origin, CSP headers blocking external requests, automated security testing |
| **API Cost Explosion**   | High - 500 users × 3 models × 20 generations = $15K/month           | Hybrid BYOK model; rate limiting (10/hour free, unlimited with BYOK); cost estimation UI before generation                                             |
| **Database Performance** | Medium - Leaderboard queries slow with 100k+ entries                | Composite indexes on `(theme_id, final_score)`, Redis caching for top 100, read replicas for analytics                                                 |
| **Prompt Injection**     | Medium - Users override system instructions via clever prompts      | System prompt isolation (concatenated server-side), input validation, no user-accessible system message editing                                        |
| **Content Moderation**   | Medium - NSFW or copyrighted game generation                        | Automated screening (OpenAI Moderation), community flagging, human review queue, strict CSP preventing external assets                                 |

### Business Risks

| Risk                   | Impact                                        | Mitigation                                                                                                                   |
| ---------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Cold Start**         | High - Month 1 has no games, no players       | Seed with 20-30 curated submissions from founding team; invite-only beta for Month 0; influencer partnerships                |
| **Scoring Complexity** | Medium - Users don't understand why they lost | Transparent formula breakdown in UI; tooltips explaining each component; blog posts on optimization strategies               |
| **Community Toxicity** | Medium - Rating manipulation, prompt theft    | Bayesian rating averages; fork attribution requirements; "Protected" mode for final week strategy hiding; moderation tools   |
| **Retention Cliff**    | Medium - Users quit after failing Month 1     | "Practice Mode" (unlimited iterations, excluded from leaderboard); tutorial system; beginner-friendly "Normal" tier emphasis |

---

**Document Control**

- **Version:** 1.0 (Master)
- **Status:** Approved for Development
- **Next Review:** Post Month-1 Launch Retrospective
- **Owner:** Senior Product Lead
- **Stakeholders:** Engineering, Design, Community, Legal

**"One prompt. One shot. One month to prove you're the best prompt engineer."**
