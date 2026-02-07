# Arcade Vibe – Product Requirements Document (PRD)

**Version:** 1.0  
**Author:** Product Management  
**Date:** 2025‑11‑03  
**Stakeholders:** Engineering, Design, Data, Marketing, Community Ops, Legal  

---  

## 1. Overview  

### 1.1 Executive Summary  
Arcade Vibe is a **competitive prompt‑engineering platform** built around a retro‑arcade UI. Participants craft **single‑message prompts** that must generate a **playable game** in one shot. Each month a new theme is released, with a fixed set of game‑mechanic requirements (scoring, lives, levels, responsiveness, iframe compatibility). Prompts are evaluated on a composite score that blends community ratings, model difficulty multipliers, brevity, average playtime, and vote volume.  

The platform doubles as a **meta‑learning sandbox**: the community can inspect every prompt evolution, fork strategies, and re‑run prompts on alternative models. Successful games become permanent artifacts in a public gallery with locked rankings, while the competition resets each month for fresh challenges.  

### 1.2 Problem Statement  
- **Prompt engineers** have few venues to showcase the *craft* of prompting, not just the output.  
- Existing AI‑generated‑games tools emphasize *generation* over *prompt design* and lack competitive structure.  
- The community craves **transparent, reproducible, and gamified** evaluation of prompts across heterogeneous models.  
- There is no persistent, archival showcase for “best‑in‑class” AI‑generated games that also serves as a learning library.  

### 1.3 Value Proposition  
- **For Prompt Engineers:** A structured sport where *brevity, risk‑taking, and model choice* are first‑class metrics; all prompt iterations are documented and discoverable.  
- **For Players:** A curated arcade of provably single‑shot games, each with a difficulty badge, playtime metrics, and the ability to **re‑run** any published prompt on any supported model.  
- **For the Ecosystem:** A living library of prompt patterns, model capabilities, and game‑design ideas, created organically by the community.  

---  

## 2. Objectives  

| Type | Goal | Success Metric (KPIs) |
|------|------|-----------------------|
| **Business** | Launch MVP with monthly competition cycle | 2,000 active prompt engineers by end of Q2 2026 |
| **Community Growth** | Foster a self‑sustaining creator loop | ≥ 30 % of participants return for month 2; Prompt‑run / original‑submission ratio ≥ 0.6 |
| **Quality Assurance** | Ensure high‑quality, playable games | % of entries receiving ≥ 4 stars ≥ 45 % |
| **Retention** | Drive repeat engagement | Average session length per game ≥ 5 minutes; 70 % of sessions result in a rating |
| **Innovation** | Encourage diverse model usage | Entropy of model‑choice distribution (Shannon) ≥ 2.5 (max = log (#models)) |
| **Technical Validation** | Prove single‑shot generation works at scale | 99 % of submitted prompts complete inference within 30 seconds on the target model |

---  

## 3. Target Audience  

### 3.1 Personas  

| Persona | Demographics | Goals | Pain Points | How Arcade Vibe Solves It |
|---------|--------------|-------|-------------|---------------------------|
| **Prompt Prodigy** | 25‑38, technical writer / AI researcher, uses GPT‑4‑Turbo daily | Prove prompt craftsmanship, win monthly trophies | No public arena, no reproducible benchmarking | Structured competition, public gallery, model‑choice multipliers |
| **Arcade Curator** | 20‑35, community manager / streamer | Discover novel games, build content, engage audience | Hard to find truly **single‑shot** games; evaluating quality manually | Badge system, playtime metrics, community ratings, evolution view |
| **Model Tinkerer** | 30‑45, ML engineer, enjoys testing small LLMs | Compare model strengths across genres | Lack of unbiased cross‑model prompts; hidden evaluation bias | Ability to **run any public prompt** on any supported model with own API key |
| **Casual Player** | 18‑30, gamer who enjoys short experiences | Play quick, varied games; see ranking shifts | Games are often too long or lack scoring clarity | Fixed mechanics, difficulty badge, time‑boxed sessions |
| **Meta‑Researcher** | 30‑50, academic / industry analyst | Study emergent behavior of LLMs on game generation | No persistent, curated dataset of prompts & outputs | Immutable monthly archives, versioned prompt histories, vote & rating data |

### 3.2 User Stories  

**Prompt Prodigy**  
*As a Prompt Prodigy, I want to submit a one‑shot prompt that must generate a playable platformer with lives, scoring, and iframe compatibility, so that I can be ranked against other engineers using a transparent composite score.*

**Arcade Curator**  
*As an Arcade Curator, I want to browse games filtered by difficulty badge and see each game’s entire prompt evolution, so that I can understand the design decisions and produce content for my audience.*

**Model Tinkerer**  
*As a Model Tinkerer, I want to clone a published prompt, paste it into the UI, connect my own API key for a small model, and see the generated game, so that I can evaluate model portability.*

**Casual Player**  
*As a Casual Player, I want to start a game, play it for a few minutes, and submit a rating, so that the leaderboard reflects real engagement, not just download counts.*

**Meta‑Researcher**  
*As a Meta‑Researcher, I want to download a CSV export of all prompts, ratings, model choices, and playtime data for a given month, so that I can perform statistical analysis of prompt engineering trends.*

---  

## 4. Features  

### 4.1 Core Features (MVP)  

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| **Monthly Theme Engine** | Admin UI to create theme JSON (theme name, required mechanics, scoring weight vector). | - Theme can be published and consumed by all participants.<br>- Mechanics are enforceable via automated validation API. |
| **Prompt Submission Form** | Single‑message text box; model selector dropdown; “Publish” button (private/public). | - Validation: exactly one prompt string, no hidden context.<br>- Prompt stored immutably with metadata (timestamp, model, mode, visibility). |
| **Model Provider Integration** | Plug‑in abstraction for Vercel AI SDK models: GPT‑5.3, Opus‑4.6, GLM‑4.7|Kimi‑k2.5, Deepseek‑3.2, etc. | - Each model returns a game instance within ≤ 30 s.<br>- Token limits enforced per model (configurable). |
| **Composite Scoring Engine** | Formula: `Score = (AvgRating * WeightRating) + (Playtime * WeightPlaytime) + (VoteCount * WeightVote) * (DifficultyMultiplier) / (PromptLength)` | - Score automatically computed after game submission.<br>- Score displayed on public leaderboard; higher score = better rank. |
| **Public / Private Visibility States** | Private = only author can view; Public (end‑of‑month) = visible to all; Full Public (on run) = viewable immediately while unlocked. | - Visibility toggle enforced via RBAC.<br>- Public games become immutable at month‑end; only rating updates are allowed (no re‑submission). |
| **Gallery & Evolution Viewer** | Each submitted prompt shows a timeline of versions/forks, with diff viewer. | - All versions are persisted; diff uses three‑way merge algorithm.<br>- Viewer displays original prompt, date, model, score. |
| **Rating & Voting System** | Users can rate (1‑5 stars) and vote (thumb up/down). Rate + vote contribute to composite score. | - Rate must be submitted after gameplay; vote optional.<br>- Rate‑ and vote‑records stored with immutable audit trail. |
| **Responsive & iFrame Compatibility** | Games rendered in sandboxed iframe that must meet size, scroll, and click‑through requirements. | - Validation API checks iframe dimensions (> 300×200), no external network calls, and responsive layout. |
| **Leaderboard** | Real‑time ranking aggregated by composite score; filters by model, difficulty, theme. | - Leaderboard updates within 5 seconds of new submission.<br>- Persistent historic leaderboards per month. |
| **User Dashboard** | Shows own prompt history, pending submissions, personal stats, and “Prompt Runs” (games generated from others’ prompts). | - Dashboard reflects real‑time data via tRPC queries.<br>- Export button for CSV of personal stats. |
| **Auth & Identity** | Better Auth (email + OAuth) with role‑based access (admin, participant, player). | - Passwordless login works; password reset functional.<br>- Admin can reset monthly theme. |
| **Admin Theme Management** | UI for admins to schedule themes, lock themes after week 4, and archive month data. | - Admin can preview any theme JSON.<br>- Once locked, theme cannot be edited. |
| **API & Validation Layer** | tRPC endpoints for every user action; Zod schemas for input/output validation. | - 100 % of endpoints covered by automated contract tests.<br>- Errors returned as structured Zod validation failures. |

### 4.2 Future Features (Post‑MVP)  

| Feature | Description | Target Release (Quarter) |
|---------|-------------|--------------------------|
| **Team Competitions** | Multi‑user prompt squads; shared submission slot; combined score calculation. | Q3 2026 |
| **Live Prompt Jams** | 24‑hour community events with real‑time leaderboard updates. | Q4 2026 |
| **Prompt Marketplace** | Sell high‑performing prompts as reusable templates; royalty split. | Q2 2027 |
| **Model Leaderboards** | Aggregated performance stats per model across months (quality, latency, diversity). | Q2 2027 |
| **Category/Tag System** | Auto‑classify games by genre (platformer, puzzle, shooter) using classifier; allow browsing by tag. | Q3 2027 |
| **Gamified Onboarding** | Tutorial mini‑arcade that awards starter badges for first submissions. | Q1 2027 |
| **Mobile App (Hybrid)** | Native wrapper for iOS/Android to view leaderboards and submit prompts via mobile‑optimized UI. | Q4 2027 |
| **GDPR / Data Export** | Full user data export and deletion tooling. | Q1 2028 |
| **Admin Moderation Dashboard** | Flagging, abuse prevention, and bulk re‑rating tools. | Q2 2028 |

---  

## 5. Technical Requirements  

### 5.1 Technology Stack  

| Layer | Recommended Technology | Rationale |
|-------|------------------------|-----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript | Server‑side rendering + file‑system routing for SEO; supports middleware for auth. |
| **Styling** | Tailwind v4 + shadcn/ui components | Utility‑first CSS ensures consistent design; reproducible theming. |
| **API / Backend** | tRPC v11 (type‑safe end‑to‑end) on Node.js/Edge Runtime | Eliminates REST boilerplate; shares Typescript types with frontend. |
| **Database** | PostgreSQL 18 + Drizzle ORM | Mature, ACID‑compliant, supports JSONB for storing prompt versions. |
| **Auth** | Better Auth (email + OAuth2 + WebAuthn) | Modern security (rate‑limiting, password‑less, MFA). |
| **AI Integration** | Vercel AI SDK v6 + AI SDK‑React (streaming/v1) | Handles token streaming, fallback models, and built‑in rate limiting. |
| **Validation** | Zod 4 (schema validation shared across stack) | Guarantees end‑to‑end contract consistency. |
| **Hosting** | Vercel (edge functions) + Railway for background workers | Zero‑ops scaling for AI inference; supports scheduled theme publishing. |
| **CI/CD** | GitHub Actions + Preview Deployments | Automated testing of tRPC contracts, Zod schemas, and linting. |
| **Observability** | Sentry (error tracking) + Vercel Analytics + Prometheus metrics (via Vercel) | End‑to‑end tracing of prompt flow to inference latency. |
| **Testing** | Jest + React Testing Library + Playwright E2E | Unit, integration, and UI tests for critical flows (submission, scoring). |

### 5.2 System Architecture Overview  

```
+-------------------+      +---------------------+      +-------------------+
|   Frontend (NF)   | ---> |   tRPC Router (NF)  | ---> |   API Service     |
+-------------------+      +---------------------+      +-------------------+
                                   |                               |
                                   v                               v
                         +-------------------+               +-------------------+
                         |   Better Auth     |               |   Vercel AI SDK   |
                         +-------------------+               +-------------------+
                                   |                               |
                                   v                               v
                         +-------------------+               +-------------------+
                         |   PostgreSQL      | <--- Stores --- |   Prompt History  |
                         +-------------------+               +-------------------+
                                   |
                                   v
                         +-------------------+
                         |   Drizzle ORM     |
                         +-------------------+

Supporting Services:
- Vercel Functions (Edge) for AI inference
- Railway Workers for background scoring & validation
- Redis (optional) for session caching & rate limiting
- S3 (or Vercel Blob) for immutable prompt archives
```

### 5.3 Security & Compliance  

- **Authentication:** Better Auth with email OTP + OAuth (Google, GitHub). All JWTs signed with HS256 and short‑lived (15 min).  
- **Authorization:** Role‑based ACLs (Admin, Moderator, Participant, Player).  
- **Data Protection:** Prompt submissions stored immutable; only metadata mutable. GDPR‑compliant export/delete endpoints.  
- **Model Abuse Prevention:**  
  - Rate‑limit per user per model (configurable).  
  - Content filter on generated output ( profanity, copyrighted assets).  
  - Token budget enforcement per model tier.  
- **Performance SLA:**  
  - End‑to‑end inference (prompt → game) ≤ 30 s for supported models.  
  - Page load < 1 s for dashboard; < 2 s for game iframe load.  
- **Scalability:** Horizontal scaling of API via Vercel Edge Functions; DB read replicas for leaderboard queries.  

### 5.4 Accessibility  

- WCAG 2.1 AA compliance for UI components.  
- Keyboard‑navigable arcade games (focusable iframe elements).  
- ARIA labels on rating widgets and leaderboard entries.  

---  

## 6. Timeline & Milestones  

| Milestone | Duration | Key Deliverables | Owner |
|-----------|----------|------------------|-------|
| **M0 – Discovery & Specs** | 3 weeks | Final PRD, wireframes, data model diagram | PM / UX |
| **M1 – Core Platform Scaffold** | 6 weeks | Next.js app, auth, DB schema, tRPC skeleton | FE / BE |
| **M2 – AI Integration & Validation** | 4 weeks | Model provider adapters, Zod validation, sandbox iframe runner | AI Eng / BE |
| **M3 – Prompt Submission & Scoring MVP** | 5 weeks | Submission UI, composite scoring engine, leaderboards | FE / BE |
| **M4 – Public Gallery & Evolution Viewer** | 3 weeks | Version diff viewer, immutable archives, visibility states | FE / BE |
| **M5 – Beta Testing & Iteration** | 4 weeks | Internal beta, bug‑fix sprint, performance tuning | QA |
| **M6 – Public Launch (Month 1)** | 2 weeks | Theme publishing, live competition, community onboarding | PM / Marketing |
| **M7 – Post‑Launch Analytics & Retrospective** | 3 weeks | KPI dashboards, user feedback synthesis, roadmap update | Data / PM |
| **M8 – Post‑MVP Feature Kickoff** | Ongoing | Team competitions, marketplace spec, live jams | Engineering |

*Target launch date:* **4 weeks after M0 completion** (early Q1 2026).  

---  

## 7. Open Questions / Risks  

| Question | Impact | Mitigation |
|----------|--------|------------|
| **Model Availability & Cost** – Which LLMs will be offered on Vercel’s free tier vs paid tiers? | High – may limit participant diversity; cost overruns. | Partner with model providers for discounted inference; implement cost‑capping per user; allow self‑hosted model endpoints via API key. |
| **Prompt Length vs Difficulty Multiplier** – How to quantify “brevity” fairly across wildly different game complexities? | Medium – could incentivize overly terse prompts that produce low‑quality games. | Use normalized length metric (tokens / expected game size) and weight it against quality score; enforce a minimum token budget for core mechanics. |
| **Anti‑Gaming & Prompt Dumping** – Users may generate prompts that encode pre‑written games. | High – undermines fairness of “single‑shot” claim. | Integrity checks: require a random seed or procedural step; compute entropy of generated assets; allow community audit of submitted prompts. |
| **Scalability of Game Rendering** – Running many model inferences concurrently may overload inference endpoints. | High – affects latency SLA. | Auto‑scale inference workers; use request queue with back‑pressure; prioritize early submissions for limited slots. |
| **Data Ownership & IP** – Who owns the generated games and prompts? | Medium – legal exposure. | Include clear T&Cs assigning IP to the creator; provide opt‑out for public archiving; store attribution metadata. |
| **Community Moderation Overhead** – Rating manipulation or toxic behavior in public feeds. | Medium – can degrade user experience. | Deploy moderation bots (toxicity detection); empower community moderators; rate‑limit voting. |
| **Retention of Monthly Themes** – Keeping themes fresh while ensuring enough variety to avoid repeat mechanics. | Low – long‑term engagement. | Pre‑curate a theme library for 12 months; allow community proposals submitted via UI; rotate themes bi‑weekly. |

---  

### Approval  

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Lead |  |  |  |
| Engineering Lead |  |  |  |
| Design Lead |  |  |  |
| Data Science Lead |  |  |  |
| Legal/Compliance |  |  |  |

---  

*Prepared for internal development and stakeholder review. All sections are ready for sprint planning and backlog grooming.*