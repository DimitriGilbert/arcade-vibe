# Product Requirements Document (PRD)

## 1. Overview

### Executive Summary
Arcade Vibe is a competitive platform gamifying the art of prompt engineering. Unlike standard code-generation tools, it functions as a "meta-game" where users compete monthly to generate the best playable games using a single prompt. The platform restricts context to zero—relying purely on the quality of the instruction—and employs a sophisticated scoring system that rewards prompt efficiency, model handicapping, and community engagement.

### Problem Statement
While Large Language Models (LLMs) are increasingly used for code generation, there is no standardized, competitive arena to benchmark "One-Shot" prompting capabilities. Existing tools rely on iterative chat interfaces, obscuring the skill required to craft a perfect, self-contained system instruction. Furthermore, the community lacks a centralized repository to analyze, fork, and compare how specific prompts perform across different foundational models.

### Value Proposition
Arcade Vibe transforms prompt engineering into a spectator sport and a competitive discipline.
*   **For Prompt Engineers:** It provides a rigorous training ground to refine zero-shot instruction crafting, with version tracking and performance analytics across multiple models.
*   **For the AI Community:** It creates a living library of high-fidelity prompts, fostering transparency and knowledge sharing via forking and re-running mechanisms.
*   **For Players:** It offers a constantly refreshed library of unique, AI-generated retro games with built-in social rating and depth inspection of how the game was made.

---

## 2. Objectives

### Key Goals
*   **Business:** Establish a high-retention monthly competition cycle (The "Season") that drives recurring traffic. Create a defensible moat through proprietary dataset accumulation of high-quality prompt-game pairs.
*   **Technical:** Build a highly secure, type-safe, zero-latency execution environment capable of sandboxing untrusted AI-generated code. Implement a rigorous "One-Shot" pipeline that strictly prevents conversational context leakage.

### Success Metrics (KPIs)
*   **Engagement:** Average playtime per game > 3 minutes.
*   **Quality:** >60% of entries rated ≥ 4 stars in a given month.
*   **Innovation:** <40% of submissions use "Cheater" (High capability) models; incentivize use of Hard/Impossible modes.
*   **Retention:** >40% of Month 1 participants return to submit for Month 2.
*   **Virality:** Fork-to-Original ratio > 1.5 (indicating active community iteration).

---

## 3. Target Audience

### User Personas
1.  **The Optimization Architect (The "Pro"):** Expert AI users focused on brevity and logic. They prefer "Hard" or "Impossible" modes to maximize their leaderboard multiplier.
2.  **The Experimental Hobbyist:** Curious developers who want to see how different models interpret the same abstract instructions. They focus on the "Compare" feature.
3.  **The Arcade Gamer:** Consumer end-users who browse the gallery to play games, vote, and occasionally peek at the "magic code" (prompts) behind the curtain.

### User Stories
*   **As a Prompt Engineer**, I want to write a single prompt and select a "Impossible" tier model so that my score is weighted higher, assuming the game is playable.
*   **As a Creator**, I want to fork a winning prompt from the previous month, tweak the instructions, and re-run it against a different model to see if it porting improves performance.
*   **As a Player**, I want to view the "Git history" of a prompt to understand the creator's thought process and refinement iterations.
*   **As an Admin**, I want to freeze the leaderboard at the end of the month and archive the games into a permanent "Hall of Fame."

---

## 4. Features

### 4.1 Core Features (MVP)

#### 4.1.1 Monthly Challenge Engine
*   **Description:** A CMS-driven system that defines the monthly constraints (e.g., "Space Shooter," "Endless Runner," "Grid Puzzle"). Enforces strict technical requirements for generated games (HTML5/JS, responsive, iframe-safe).
*   **Acceptance Criteria:**
    *   Admins can create a new "Season" with a start/end date and theme.
    *   System automatically closes submissions at Month-End.
    *   Leaderboard transitions to "Frozen" state post-season.

#### 4.1.2 Zero-Context Prompt Editor
*   **Description:** A text editor restricted to a single input field. No chat history, no follow-up questions. Users input their "System Prompt" here.
*   **Acceptance Criteria:**
    *   Character counter is visible (used for Brevity scoring).
    *   Syntax highlighting for plain text.
    *   "Fork" button creates a copy of an existing prompt into the editor, tagged as a descendant.

#### 4.1.3 Model Selection & Multi-Model Runner
*   **Description:** A selector to choose the LLM engine. Includes difficulty badges.
    *   *Cheater:* GPT-5.3, Opus-4.6
    *   *Normal:* GLM-4.7, Kimi-k2.5
    *   *Hard:* Deepseek-3.2, GPT-5.1-mini, Haiku-4.5
    *   *Impossible:* Tiny/Open Weights models
*   **Acceptance Criteria:**
    *   Users can select "Compare Mode" to run the prompt against up to 3 models simultaneously (if credits allow).
    *   System validates user API keys for paid execution if the user chooses to bring their own key (BYOK).

#### 4.1.4 Secure Game Sandboxing (The Arcade Cabinet)
*   **Description:** An iframe environment to render the generated game code safely.
*   **Acceptance Criteria:**
    *   Generated code must be sanitized (strip `script` tags pointing to external domains, enforce CSP).
    *   Iframe uses `sandbox` attribute to restrict access to parent window cookies/localStorage.
    *   Capture console errors from the iframe to display to the user if the game crashes.

#### 4.1.5 The Scoring Algorithm
*   **Description:** A weighted formula to rank games.
    *   `Score = (AvgRating * 10) + (DifficultyMultiplier * 20) + ((1000 / PromptLength) * 5) + (AvgPlayTimeSeconds * 0.5)`
*   **Acceptance Criteria:**
    *   Scores update in real-time as ratings come in.
    *   "Brevity" bonus caps at a maximum prompt length to prevent gibberish spam.

#### 4.1.6 Visibility Controls
*   **Description:** Granular privacy settings for prompts.
*   **Acceptance Criteria:**
    *   **Private:** Only the creator can see the prompt and run the game.
    *   **Public (End of Month):** Prompt is hidden until the season ends.
    *   **Full Public:** Prompt is visible immediately (useful for sharing strategies).

### 4.2 Future Features (Post-MVP)
*   **Team Competitions:** "Clans" submit prompts under a team banner.
*   **Prompt Marketplace:** Monetization of top-tier prompts (users pay to download the prompt text).
*   **Live Jam Mode:** A 24-hour timed event with a real-time ticking clock leaderboard.
*   **AI Judge Integration:** An automated agent that plays the games for 5 minutes to generate an initial "Technical Stability" score before human voting.

---

## 5. Technical Requirements

### Tech Stack (Strict)
*   **Frontend Framework:** Next.js 16 (App Router)
*   **API Layer:** tRPC v11 (for end-to-end type safety)
*   **Database:** PostgreSQL 18
*   **ORM:** Drizzle ORM
*   **Authentication:** Better Auth
*   **Styling:** Tailwind CSS v4 + shadcn/ui
*   **AI/LLM:** Vercel AI SDK v6 + AI SDK-React
*   **Validation:** Zod 4

### System Architecture Overview
1.  **Web Client (Next.js):** Handles the editor, game lobby, and iframe rendering. Uses React Server Components (RSC) for the initial leaderboard load for SEO.
2.  **API Layer (tRPC):**
    *   `submitPrompt`: Validates prompt via Zod, initiates generation.
    *   `streamGeneration`: Uses Vercel AI SDK to stream the code output back to the client.
    *   `rateGame`: Updates the scoring database.
3.  **Generation Service:**
    *   Receives the prompt and selected model ID.
    *   Constructs the "One Shot" payload (System prompt = User prompt).
    *   Calls the LLM Provider (OpenAI/Anthropic/etc).
    *   Parses the response (extracts code blocks).
4.  **Database (Postgres):**
    *   `Users`: Auth data and API keys.
    *   `Seasons`: Monthly themes and dates.
    *   `Prompts`: The text content, parent_id (for forking), and visibility settings.
    *   `Games`: The generated code, selected model, and performance metrics.
    *   `Ratings`: User votes and playtime tracking.

### Security and Performance
*   **Sandboxing:** Critical security feature. All generated HTML/JS runs in an `iframe` with `sandbox="allow-scripts allow-same-origin"`. Dynamic imports of external libraries must be blocked or proxied through a strict allowlist.
*   **Rate Limiting:** Limit API calls per user to prevent model exhaustion (especially on lower-tier "Hard" models which might have rate limits).
*   **Content Moderation:** Use a lightweight LLM pass (e.g., GPT-4o-mini) to check prompts for NSFW/Prohibited content before sending to the generation model.
*   **Caching:** Cache the generated code result if the exact same prompt + model combination is submitted (deduplication).

---

## 6. Timeline & Milestones

*   **Phase 1: Foundation (Weeks 1-3)**
    *   Setup Next.js 16 + tRPC + Drizzle + Better Auth boilerplate.
    *   Define Database Schema (Migrations).
    *   Implement basic Auth flow.
*   **Phase 2: The Core Engine (Weeks 4-6)**
    *   Integrate Vercel AI SDK v6.
    *   Build the Prompt Editor and "One Shot" generation pipeline.
    *   Implement Model Selector.
*   **Phase 3: The Arcade (Weeks 7-9)**
    *   Build the Sandboxed Game Renderer (Iframe component).
    *   Implement "Compare Mode" (side-by-side execution).
    *   Build Season Management logic.
*   **Phase 4: Community & Gamification (Weeks 10-12)**
    *   Build Leaderboard and Scoring Algorithm implementation.
    *   Implement Rating and Playtime tracking.
    *   Profile pages and Prompt History/Forking views.
*   **Phase 5: Polish & Beta Launch (Weeks 13-14)**
    *   UI refinement (Retro Arcade aesthetic with Tailwind).
    *   Load testing.
    *   Launch "Month 0" (Internal test) -> "Month 1" (Public).

---

## 7. Open Questions / Risks

### Open Questions
*   **Cost Model:** Who pays for the inference?
    *   *Option A:* Platform pays (ad-supported/sub model).
    *   *Option B:* User brings API Key (BYOK).
    *   *Decision:* MVP will likely require BYOK for "Cheater" models to keep overhead low, while providing a free quota of "Hard" model calls sponsored by the platform.
*   **Code Format Standardization:** How do we ensure different LLMs output code that works in the iframe? (e.g., Python vs JS).
    *   *Resolution:* The system prompt (hidden instruction injected by us) will mandate: "Output a single HTML file containing CSS and JavaScript. No external dependencies other than CDNs from [Allowlist]."

### Risks
*   **Malicious Code Generation:** Users might prompt the AI to generate "XSS" or phishing interfaces inside the game.
    *   *Mitigation:* Strict CSP headers in the iframe. No cookies/localStorage access in the sandbox.
*   **Model Drift:** If an LLM provider updates their model (e.g., GPT-5.3.1), it might break old prompts in the gallery.
    *   *Mitigation:* Store the specific model version ID used in the database. Allow "Re-run" button to users.
*   **Copyright/Plagiarism:** Users dumping code from GitHub into the prompt.
    *   *Mitigation:* The "Brevity Score" is the primary defense here. It is harder to paste 500 lines of code and win due to the "Brevity Penalty." Community reporting feature for takedowns.