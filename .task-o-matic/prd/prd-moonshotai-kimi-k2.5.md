 # Product Requirements Document: Arcade Vibe

## 1. Overview

### Executive Summary
Arcade Vibe is a competitive gamification platform that transforms prompt engineering into an e-sport. Participants compete monthly to craft the single most effective one-shot prompt that generates a complete, playable browser-based game via LLM inference. The platform combines retro arcade aesthetics with sophisticated algorithmic scoring, creating a permanent archive of prompt engineering evolution.

### Problem Statement
Current AI coding platforms focus on iterative development or chat-based refinement. There exists no competitive venue that rewards **constraint-based prompt engineering**—the ability to deliver complete, executable specifications in a single context window. Additionally, the prompt engineering community lacks:
- Objective benchmarks for prompt efficiency vs. output quality
- Persistent repositories of high-performance zero-shot prompts
- Risk/reward mechanics that balance model capability against skill expression

### Value Proposition
**For Prompt Engineers**: A verified proving ground where prompt craft is the sole competitive variable. Gain reputation through immutable leaderboard rankings and prompt lineage documentation.

**For Players**: Access to an infinite arcade of AI-generated games with full provenance transparency, enabling meta-learning and community-driven prompt analysis.

**For the Ecosystem**: A living dataset correlating prompt characteristics (length, structure, model selection) with engagement metrics and output quality.

---

## 2. Objectives

### Business Goals
- Establish Arcade Vibe as the definitive competitive authority in prompt engineering within 12 months
- Achieve 10,000 monthly active participants (MAU) by Month 6 post-launch
- Maintain 40% Month-2 retention rate for registered prompt engineers
- Generate viral coefficient >1.2 through "Prompt Run" mechanics (users re-running others' prompts)

### Technical Goals
- Support concurrent generation of 500+ game instances via serverless infrastructure
- Ensure <3s time-to-first-byte (TTFB) for game iframe rendering
- Implement Byzantine-fault-tolerant scoring algorithm resistant to manipulation
- Maintain 99.9% uptime during monthly leaderboard freeze events

### Success Metrics (KPIs)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Engagement Depth** | Avg 4+ minutes playtime per game | Web beacon tracking in iframe sandbox |
| **Quality Threshold** | 65% of entries rated ≥4/5 stars | Bayesian average rating system |
| **Prompt Portability** | 3:1 ratio of Prompt Runs to Original Submissions | Database relation tracking |
| **Model Diversity** | No single model >40% of top-100 leaderboard | Distribution analysis |
| **Brevity Efficiency** | Median prompt length <800 tokens | Tokenization via tiktoken |
| **Retention Cohort** | 45% of Month-N participants return for Month-N+1 | Auth session tracking |

---

## 3. Target Audience

### Primary Persona: "The Architect" (Prompt Engineer)
**Demographics**: ML Engineers, Technical Writers, AI Researchers, Hobbyist Coders
**Psychographics**: Optimization-obsessed, competitive, values intellectual property protection but craves validation
**Pain Points**: 
- Existing AI coding tools feel like "cheating" via iterations
- No way to prove "pure" prompt engineering skill
- Prompts get stolen/scraped without attribution
**Needs**: Version control for prompts, difficulty multipliers to demonstrate skill, permanent reputation tracking

### Secondary Persona: "The Archaeologist" (Player/Analyst)
**Demographics**: Game developers, CS students, AI enthusiasts
**Psychographics**: Curious, analytical, enjoys reverse-engineering
**Pain Points**: 
- Generated games lack transparency (black box prompting)
- No way to learn from top performers
**Needs**: Full prompt visibility (when public), fork capabilities, comparative model analysis tools

### User Stories

**US-001**: As a Prompt Engineer, I want to create a private prompt version that executes against multiple models simultaneously, so I can compare output quality before selecting my submission target.

**US-002**: As a Prompt Engineer, I want to fork my previous attempt while preserving the lineage, so I can iterate without losing my evolutionary history.

**US-003**: As a Player, I want to view the complete prompt that generated a public game, so I can study the techniques used by top-ranked engineers.

**US-004**: As a Player, I want to execute a public prompt against a different model using my own API key, so I can verify prompt portability and contribute to meta-analysis.

**US-005**: As a System, I want to calculate scores using the weighted formula (Quality × Difficulty × Efficiency × Engagement × Volume), so that gaming the system requires optimizing all dimensions simultaneously.

**US-006**: As an Admin, I want to automatically freeze leaderboards and archive games at month-end, so the historical record remains immutable and tamper-proof.

---

## 4. Features

### 4.1 Core Features (MVP)

#### F-001: Monthly Theme Engine
**Description**: Automated theme rotation system with immutable base requirements enforced across all submissions.

**Acceptance Criteria**:
- System supports exactly one active theme at a time with strict date boundaries (UTC midnight start/end)
- Theme entity contains: `title`, `description`, `startDate`, `endDate`, `requirements` (JSON schema)
- Base requirements (immutable): Score persistence, 3+ lives system, minimum 3 levels, responsive controls (keyboard/touch), iframe containment compatibility
- Upon month-end, automatic archive process triggers: leaderboard freezing, prompt visibility state changes (private→public based on user selection), game URL permanence validation

#### F-002: Prompt Studio (One-Shot Builder)
**Description**: Isolated prompt crafting environment enforcing zero-context constraints.

**Acceptance Criteria**:
- Prompt input field enforces single-message constraint (no conversation history preservation)
- Real-time token counter display (cl100k_base encoding) with brevity scoring preview
- Model selection dropdown with tier classification:
  - **Cheater Tier**: GPT-5.3, Opus-4.6 (0.5x multiplier)
  - **Standard Tier**: GLM-4.7, Kimi-k2.5 (1.0x multiplier)  
  - **Hard Mode**: Deepseek-3.2, GPT-5.1-mini, Haiku-4.5 (1.5x multiplier)
  - **Impossible Tier**: [Tiny models <7B params] (2.5x multiplier)
- "Execute" action initiates generation job via Vercel AI SDK with streaming response
- Generated code auto-sandboxed in isolated iframe with `sandbox="allow-scripts"` (no allow-same-origin)
- Version control: Each execution creates immutable `PromptVersion` record with SHA-256 hash of content, parent-child lineage tracking, and success/failure status

#### F-003: Multi-Model Execution Matrix
**Description**: Parallel generation capability for comparative analysis.

**Acceptance Criteria**:
- User can select 1-4 models simultaneously for execution (rate-limited per user tier)
- Execution queue displays real-time progress bars for each model stream
- Side-by-side diff viewer comparing generated code outputs
- Cost estimation display (token count × model pricing) before execution
- Results stored as `GenerationRun` entity linked to parent `PromptVersion`

#### F-004: Scoring Algorithm & Leaderboard
**Description**: Multi-dimensional scoring system resistant to manipulation.

**Acceptance Criteria**:
Score formula implementation:
```
FinalScore = (R_avg × 0.4) × (D_mult × 0.3) × (E_inv × 0.15) × (P_norm × 0.1) × (V_log × 0.05)

Where:
R_avg = Bayesian average rating (Wilson score interval, 95% confidence)
D_mult = Difficulty multiplier (0.5, 1.0, 1.5, 2.5)
E_inv = Inverse token efficiency (max(0, 1 - (tokens/4000)))
P_norm = Normalized playtime (min(actual/300s, 1.0))
V_log = Logarithmic vote volume (ln(vote_count + 1))
```
- Leaderboard updates in real-time via tRPC subscriptions (WebSocket)
- Top 100 entries cached in Redis with 5-minute TTL
- Anti-gaming: Ratings require minimum 2-minute playtime before submission; IP + User Agent fingerprinting for vote deduplication

#### F-005: Game Execution Sandbox
**Description**: Secure, persistent game hosting environment.

**Acceptance Criteria**:
- Generated code stored as static asset (HTML/CSS/JS bundle) in object storage with CDN distribution
- iframe wrapper provides:
  - Standardized 800×600 viewport (responsive down to 320px)
  - Message passing API for score reporting (`postMessage` protocol)
  - Automatic termination after 30 minutes idle
  - CSP headers blocking external network requests (data URI only)
- Games remain playable indefinitely post-month-end (cold storage archive after 12 months)

#### F-006: Privacy & Visibility Controls
**Description**: Granular access control for intellectual property protection.

**Acceptance Criteria**:
- Three visibility states per prompt version:
  - **Private**: Visible only to owner during active month
  - **Delayed Public**: Auto-converts to Public at month-end freeze
  - **Immediate Public**: Visible to community immediately upon submission
- Public prompts display full lineage tree (fork history)
- "Prompt Run" feature allows users to execute public prompts with their own API keys, creating new `GenerationRun` records linked to original prompt (attribution preserved)

#### F-007: Community Interaction Layer
**Description**: Rating, commenting, and analysis tools.

**Acceptance Criteria**:
- 5-star rating system with mandatory 50-character minimum review text
- "Fork" action creates deep copy of prompt text linked to parent ID
- Comment threading on public prompts with markdown support
- Analytics dashboard for authors: playtime heatmaps, rating distributions, model success rates

### 4.2 Future Features (Post-MVP)

#### FF-001: Team Competitions
- Squad-based prompt engineering (2-4 members)
- Shared prompt repository with merge conflict resolution
- Team ELO rankings separate from individual leaderboard

#### FF-002: Live Event Mode
- 24-hour constraint mode with rotating themes every 2 hours
- Real-time spectator view showing current prompt edits (stream delay 60s)
- Instant elimination brackets

#### FF-003: Prompt Marketplace
- NFT-style ownership of winning prompts (Month 1-3 winners)
- Licensing mechanism for commercial use of proven prompts
- Revenue sharing with original authors on Prompt Runs

#### FF-004: Advanced Analytics
- AST diff analysis showing structural differences between prompt versions
- Model capability heatmaps (which models excel at which game genres)
- Prompt entropy scoring (measuring information density)

---

## 5. Technical Requirements

### 5.1 Tech Stack (Strict Compliance)

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Framework** | Next.js 16 (App Router) | Server Components for SEO/static generation, Edge runtime for low-latency |
| **API** | tRPC v11 | End-to-end type safety, eliminates REST boilerplate, supports subscriptions |
| **Database** | PostgreSQL 18 + Drizzle ORM | Relational integrity for complex graph relationships (prompt lineage), ACID compliance for scoring |
| **Auth** | Better Auth | Session management, OAuth providers (GitHub/Google essential), JWT with refresh token rotation |
| **Styling** | Tailwind v4 + shadcn/ui | Design system consistency, retro arcade theme implementation |
| **AI Integration** | Vercel AI SDK v6 + AI SDK-React | Unified interface for multi-model streaming, automatic backoff/retry logic |
| **Validation** | Zod 4 | Runtime schema validation for prompt outputs, type inference across stack |
| **Caching** | Redis 7 | Leaderboard real-time updates, rate limiting counters, session store |
| **Storage** | Cloudflare R2 / S3 | Static game asset hosting, prompt version archives |
| **Queue** | BullMQ (Redis-based) | Generation job queue management, fair scheduling across users |

### 5.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js App Router (Server Components) + tRPC Client       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       Edge Layer                             │
│  Vercel Edge Functions (Rate Limiting, Auth Validation)     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      API Layer (tRPC)                        │
│  ├── Prompt Router (CRUD, versioning, lineage)              │
│  ├── Generation Router (AI SDK orchestration)               │
│  ├── Scoring Router (Algorithm computation)                 │
│  ├── Game Router (Asset management, iframe serving)         │
│  └── Leaderboard Router (Real-time subscriptions)           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Service Layer                              │
│  ├── GenerationService (Queue management, model routing)    │
│  ├── ScoringService (Bayesian calculations, anti-gaming)    │
│  └── ArchiveService (Monthly freeze, CDN invalidation)      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐        ┌──────────────────┐
│  PostgreSQL  │        │      Redis       │
│  - Users     │        │  - Sessions      │
│  - Prompts   │        │  - Leaderboards  │
│  - Games     │        │  - Rate Limits   │
│  - Ratings   │        │  - Job Queues    │
└──────────────┘        └──────────────────┘
```

### 5.3 Database Schema (Critical Entities)

```typescript
// Pseudocode representation for Drizzle schema

Table users {
  id: uuid pk
  email: string unique
  username: string unique
  reputation: int // accumulated score history
  createdAt: timestamp
}

Table themes {
  id: uuid pk
  title: string
  description: text
  requirements: jsonb // schema for validation
  status: enum('upcoming', 'active', 'archived')
  startDate: timestamp
  endDate: timestamp
}

Table prompts {
  id: uuid pk
  authorId: uuid fk > users.id
  themeId: uuid fk > themes.id
  parentId: uuid fk > prompts.id // self-referential for forks
  content: text // the actual prompt text
  contentHash: string // SHA-256 for deduplication
  tokenCount: int
  visibility: enum('private', 'delayed_public', 'public')
  createdAt: timestamp
}

Table generations {
  id: uuid pk
  promptId: uuid fk > prompts.id
  modelId: string // gpt-4, claude-3-opus, etc.
  status: enum('pending', 'streaming', 'completed', 'failed')
  outputCode: text // stored HTML/JS
  assetUrl: string // CDN link
  executionTime: int // ms
  cost: decimal // estimated API cost
  createdAt: timestamp
}

Table games {
  id: uuid pk
  generationId: uuid fk > generations.id unique
  isSubmitted: boolean // only one per prompt can be official entry
  avgPlaytime: int // seconds, rolling average
  totalPlays: int
  frozenRank: int // null until month-end
}

Table ratings {
  id: uuid pk
  gameId: uuid fk > games.id
  userId: uuid fk > users.id
  score: int // 1-5
  playtime: int // seconds, enforced minimum
  review: text
  createdAt: timestamp
}

Table scores {
  id: uuid pk
  gameId: uuid fk > games.id
  bayesianRating: float
  difficultyMultiplier: float
  brevityScore: float
  engagementScore: float
  voteVolumeScore: float
  finalScore: float
  calculatedAt: timestamp
  version: int // incrementing for audit trail
}
```

### 5.4 Security Requirements

**Prompt Injection Prevention**:
- All generated code sanitized via DOMPurify before storage
- iframe sandbox enforces `allow-scripts` only (no forms, no popups, no navigation)
- CSP headers: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'`

**API Abuse Mitigation**:
- Generation rate limiting: 10 requests/hour per user (Cheater tier), 20/hour (Hard mode)
- Token bucket algorithm for expensive models (Opus/GPT-5)
- Prompt length hard cap: 4000 tokens (anti-spam)

**Data Integrity**:
- Immutable prompt versions (soft delete only, cryptographic hash verification)
- Leaderboard freeze creates blockchain-style hash chain (SHA-256 of previous month + current data)

**Content Moderation**:
- Automated screening of generated games via OpenAI Moderation API
- Community flagging system with human review queue
- Immediate takedown capability for malicious code (XSS attempts)

### 5.5 Performance Requirements

- **Generation Latency**: P95 <45s for complete game generation (including streaming)
- **Leaderboard Load**: Support 10,000 concurrent WebSocket connections during final week
- **Asset Delivery**: Game iframe load time <2s global (99th percentile)
- **Database**: Query time for prompt lineage <100ms for 10-generation depth
- **Search**: Full-text search across public prompts <50ms (PostgreSQL FTS with GIN indexes)

---

## 6. Timeline & Milestones

### Phase 1: Foundation (Weeks 1-4)
- Database schema migration (Drizzle)
- Authentication flow (Better Auth integration)
- Theme management system (Admin CRUD)
- Basic prompt studio (single model execution)

**Deliverable**: Internal alpha with fake AI responses

### Phase 2: Generation Engine (Weeks 5-8)
- Vercel AI SDK integration (multi-model support)
- Generation queue system (BullMQ)
- iframe sandbox implementation
- Asset storage pipeline (R2/S3)

**Deliverable**: Users can generate and play single games

### Phase 3: Competition Layer (Weeks 9-12)
- Scoring algorithm implementation
- Leaderboard with real-time updates
- Prompt versioning and fork system
- Privacy controls

**Deliverable**: Closed beta with first test theme

### Phase 4: Community & Polish (Weeks 13-16)
- Rating and review system
- Public prompt gallery
- Prompt run functionality (user API keys)
- Anti-gaming measures (fingerprinting, Bayesian ratings)

**Deliverable**: Public launch ready

### Phase 5: Launch (Month 5)
- First official monthly theme
- Marketing push
- Monitoring and optimization

---

## 7. Open Questions / Risks

### Technical Risks

**R-001: API Cost Explosion**
- *Risk*: Users generating thousands of failed attempts burning OpenAI credits
- *Mitigation*: Credit system with monthly allotments; require user-owned API keys for "Impossible" tier; cost estimation gates

**R-002: Malicious Code Generation**
- *Risk*: LLM generates phishing forms or crypto miners within iframe
- *Mitigation*: Static analysis of generated JS (AST parsing for dangerous patterns); automated sandbox testing; strict CSP; community reporting

**R-003: Scoring Manipulation**
- *Risk*: Bot farms rating specific entries; prompt padding to game brevity score
- *Mitigation*: Proof-of-playtime (JavaScript challenges within games); machine learning detection of coordinated voting; brevity scoring asymptotic curve (diminishing returns below 500 tokens)

### Product Risks

**R-004: Barrier to Entry**
- *Risk*: One-shot constraint too difficult for casual users, high churn
- *Mitigation*: Tutorial mode with example winning prompts from previous months; "Practice Mode" with unlimited iterations (excluded from leaderboard)

**R-005: Model Drift**
- *Risk*: OpenAI updates models mid-month, invalidating "Impossible" tier balance
- *Mitigation*: Pin specific model versions (gpt-4-1106-preview vs generic gpt-4); freeze model versions at month start

### Open Questions

**Q-001**: Should we implement an escrow system for "Delayed Public" prompts to prevent last-day deletion to hide strategies?
**Q-002**: How do we handle copyright claims if generated games resemble existing IP (Nintendo, etc.)?
**Q-003**: What is the policy on hidden "meta-prompts" (prompts that generate prompts)? Strictly forbidden or allowed?
**Q-004**: Do we persist generated game state (save games) or treat each session as ephemeral?
**Q-005**: How to handle model outages (OpenAI downtime) during final submission hours? Extension policy?

### Dependencies

- **External**: Stability of AI SDK providers (Vercel AI SDK v6 must support all target models)
- **Legal**: Terms of Service must explicitly state user retains rights to prompts, we retain rights to generated game archives
- **Financial**: Seed funding for initial API credits (estimated $15K/month at 1000 active users)

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Owner**: Product Team  
**Stakeholders**: Engineering, Design, Legal, Community Management