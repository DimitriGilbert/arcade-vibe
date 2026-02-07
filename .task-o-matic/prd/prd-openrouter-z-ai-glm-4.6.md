
# Product Requirements Document

## 1. Overview

### Executive Summary
Arcade Vibe is a competitive platform for prompt engineering, framed as a retro arcade. The core mechanic challenges users to craft a single, perfect prompt to generate a fully playable HTML5 game based on a monthly theme. The platform gamifies AI interaction, turning prompt engineering into a competitive sport with leaderboards, community analysis, and strategic model selection.

### Problem Statement
The field of prompt engineering lacks a standardized, competitive arena to showcase skill. Existing tools focus on iterative, conversational AI interaction, providing no true test of one-shot instruction quality. There is no platform that celebrates the craft of creating precise, efficient prompts that can generate complex, functional outputs like games.

### Value Proposition
Arcade Vibe provides the ultimate proving ground for prompt engineers by:
- Creating a level playing field with standardized challenges and scoring.
- Introducing strategic depth through model selection handicaps.
- Fostering a community of practice through prompt transparency and analysis.
- Validating prompt engineering skill through immutable, competitive rankings.

## 2. Objectives

### Key Goals

#### Business Goals
- Establish Arcade Vibe as the premier competitive platform for prompt engineering.
- Achieve a vibrant, self-sustaining community with high monthly retention.
- Create a new content category (AI-generated games) that attracts both creators and players.

#### Technical Goals
- Build a robust, scalable platform to handle concurrent AI generation requests.
- Ensure a seamless, low-latensity user experience for both game creation and gameplay.
- Implement a secure and fair system for running user-provided prompts against various AI models.

### Success Metrics (KPIs)
- **Engagement**: Average session length > 5 minutes per game played.
- **Quality**: >60% of monthly entries rated ≥4 stars by the community.
- **Virality**: Prompt run-to-original submission ratio > 0.5.
- **Retention**: >40% of participants return to compete in the second month.
- **Innovation**: Less than 50% of submissions use the most powerful model category ("Cheater").

## 3. Target Audience

### User Personas

**1. Alex "The Architect" (Prompt Engineer)**
- **Demographics**: 28, Software Developer, AI/ML Enthusiast
- **Motivation**: To test the limits of LLM capabilities and master the craft of prompt engineering.
- **Goals**: Win the monthly competition, have their prompt studied by the community, achieve high scores with difficult models.
- **Frustrations**: Vague AI outputs, lack of a true benchmark for skill, conversational AI interfaces that obscure the core prompt's power.

**2. Bella "The Browser" (Player/Community Member)**
- **Demographics**: 22, Student, Casual Gamer
- **Motivation**: To discover unique, novel games and understand how they were made.
- **Goals**: Find fun games, learn about prompt engineering by example, contribute to ratings.
- **Frustrations**: Generic mobile games, lack of insight into the creative process of game development.

**3. Chris "The Competitor" (Hardcore Prompt Engineer)**
- **Demographics**: 35, AI Researcher, Competitive by nature
- **Motivation**: To dominate the leaderboard using strategic model choices and hyper-efficient prompts.
- **Goals**: Achieve the #1 rank, maximize the handicap multiplier, analyze and fork winning prompts.
- **Frustrations**: Platforms that don't reward risk or technical mastery, leaderboards that can be easily gamed.

### User Stories

**As a Prompt Engineer (Alex), I want to:**
- Submit a single prompt to generate a complete, playable game based on the monthly theme.
- Choose from a list of AI models, understanding the difficulty handicap associated with each.
- Save multiple versions of my prompt and track their evolution.
- Publish my prompt to the competition, choosing its visibility (private, public at month-end, or always public).
- View a detailed leaderboard that reflects the composite scoring formula.
- Analyze the prompts of top-performing, public entries to learn and improve.

**As a Player (Bella), I want to:**
- Browse a gallery of games generated for the current month's theme.
- Play games directly within the browser in an iframe.
- Rate games I've played on a 1-5 star scale.
- Filter and sort games by rating, model difficulty, and popularity.
- View the prompt and its version history for public games.
- "Run" a public prompt myself using my own API key to see the output on a different model.

**As a Competitor (Chris), I want to:**
- Run my prompt against multiple models simultaneously to compare outputs before submission.
- See a clear breakdown of my score, including the model handicap and brevity bonus.
- Fork another user's public prompt to use as a baseline for my own experiments.
- Have my monthly achievements and rankings permanently recorded in my profile.

## 4. Features

### 4.1 Core Features (MVP)

#### 4.1.1 Monthly Theme & Challenge System
- **Description**: A system to define and display a monthly theme with static, unchanging core requirements for game generation (e.g., must include scoring, lives, levels, be responsive, and iframe-compatible).
- **Acceptance Criteria**:
  - Admin interface to create and schedule new monthly themes.
  - Public-facing page clearly displaying the current theme, requirements, and a countdown timer to the next theme.
  - At month-end, the leaderboard for the previous theme is frozen, and its games are moved to a permanent "Gallery" section.

#### 4.1.2 Prompt Creation & Management Interface
- **Description**: A dedicated workspace for users to craft, edit, version, and manage their prompts.
- **Acceptance Criteria**:
  - A text editor with character count for prompt input.
  - A "Model Selector" with clearly defined categories (Cheater, Normal, Hard, Impossible) and their associated models.
  - A "Run on Multiple Models" button that triggers parallel generation jobs and displays the results side-by-side in iframes.
  - Version control allowing users to save forks of their prompt with descriptive notes.
  - A "Publish" button with options for prompt visibility (Private, Public at End of Month, Always Public).

#### 4.1.3 Game Generation & Execution Engine
- **Description**: The core backend service that securely sends user prompts to selected AI model APIs and captures the generated output.
- **Acceptance Criteria**:
  - Integration with Vercel AI SDK to support streaming for real-time generation feedback.
  - Secure handling of API keys for "Run your own" scenarios, where users provide their own key for a one-off generation.
  - The system must send *only* the user's prompt, with no conversational history or hidden pre-prompts.
  - Generated game code is stored and served within a sandboxed iframe on the platform.

#### 4.1.4 Competition Leaderboard & Scoring
- **Description**: A dynamic leaderboard that ranks submissions based on a composite score.
- **Acceptance Criteria**:
  - The scoring formula must be implemented as: `Score = (AvgRating * RatingWeight) + (ModelHandicap) + (BrevityBonus) + (AvgPlaytime * EngagementWeight) + (VoteVolume * PopularityWeight)`.
  - Leaderboard updates in near real-time as new ratings and playtime data are collected.
  - Display shows rank, username, game title, score, and a breakdown of the score components.

#### 4.1.5 Game Gallery & Player Interface
- **Description**: The public-facing interface for browsing, playing, and rating generated games.
- **Acceptance Criteria**:
  - Games are displayed in a grid/list with thumbnails, titles, author, model difficulty badge, and average rating.
  - Clicking a game opens it in a full-page view with the game in an iframe, rating controls, and prompt details (if public).
  - Users can filter by model difficulty and sort by rating, popularity, or newest.
  - A "Run this Prompt" button for public games, which allows a user to re-run the prompt on a model of their choice (using their own API key).

#### 4.1.6 User Profiles & Authentication
- **Description**: Secure user accounts that track all user activity on the platform.
- **Acceptance Criteria**:
  - Integration with Better Auth for secure login/signup (e.g., email/password, OAuth providers like GitHub).
  - User profile pages display:
    - Submitted prompts for current and past competitions.
    - "Prompt Runs" history (games they generated from others' prompts).
    - All-time rankings and monthly achievements.
  - Users can edit their profile information (username, avatar, bio).

### 4.2 Future Features (Post-MVP)

- **Team Competitions**: Allow users to form teams to collaborate on a single prompt submission for monthly team-based leaderboards.
- **Live Prompt Jams**: Time-limited, 24-hour events with a unique theme and a separate, more intense leaderboard.
- **Prompt Marketplace**: A system for users to sell or license their winning prompts as templates for others to use.
- **Model-Specific Leaderboards**: Secondary leaderboards that rank which AI model is most successful at generating high-quality games based on community ratings.
- **Advanced Analytics**: Dashboards showing prompt performance trends, model effectiveness over time, and community engagement metrics.

## 5. Technical Requirements

### Tech Stack Recommendations
*This stack is strictly mandated as per the vision document.*

- **Frontend Framework**: Next.js 16 (App Router)
- **API Layer**: tRPC v11 for end-to-end type safety.
- **Database**: PostgreSQL 18 with Drizzle ORM for schema management and queries.
- **Authentication**: Better Auth for a modern, secure, and extensible auth system.
- **Styling**: Tailwind CSS v4 for utility-first styling, combined with shadcn/ui for a pre-built, accessible component library.
- **AI Integration**: Vercel AI SDK v6 and `ai-sdk-react` for handling streaming responses and UI hooks.
- **Validation**: Zod v4 for runtime type checking and schema validation across the frontend, backend, and database.

### System Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client (Next  │    │   Server (tRPC   │    │  AI Providers  │
│     .js App)    │◄──►│      API)        │◄──►│ (OpenAI, Anthropic,│
│                 │    │                  │    │   etc.)         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │  ▲                      │  ▲
       │  │                      │  │
       ▼  │                      ▼  │
┌─────────────────┐    ┌──────────────────┐
│   shadcn/ui     │    │ Drizzle ORM     │
│   Components    │    │                  │
└─────────────────┘    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  PostgreSQL 18   │
                    │   Database       │
                    └──────────────────┘
```
- **Client**: The Next.js application handles the UI, user interactions, and state management. It communicates with the backend exclusively via tRPC procedures.
- **Server**: The tRPC server contains all business logic. It will handle authentication, data validation (with Zod), database interactions (via Drizzle), and communication with external AI APIs (via Vercel AI SDK).
- **Database**: PostgreSQL will store user data, prompts, game submissions, ratings, and all leaderboard data. Drizzle will manage the schema and provide a type-safe query interface.
- **AI Integration**: The server will call various AI model APIs. User-provided API keys for "Run this Prompt" will be used directly for that specific call and not stored.

### Security and Performance Requirements

#### Security
- **Prompt Injection Prevention**: All prompts sent to third-party AI models must be treated as untrusted user input. The system will enforce a strict "one-shot" context, ensuring no system prompts or user data are leaked.
- **API Key Management**: User-provided API keys must be handled with extreme care. They should be used for the immediate API call and then discarded. They must never be stored in the database or logs.
- **Sandboxed Game Execution**: All generated games must run in a sandboxed iframe with `sandbox` attributes (e.g., `allow-scripts`, `allow-same-origin`) to prevent malicious code execution. CSP headers should be configured to restrict resource loading.
- **Authentication & Authorization**: Better Auth will manage session security. All tRPC procedures must be protected and validate user permissions before data access or mutation.

#### Performance
- **Low Latency API**: tRPC procedures should be optimized for fast response times. Database queries must be efficient, with proper indexing on leaderboards, user profiles, and game metadata.
- **Scalable Generation**: The system must handle concurrent AI generation requests. This may involve a job queue (e.g., using a service like Upstash QStash or Inngest) to process generation requests asynchronously, preventing API timeouts.
- **Efficient Game Serving**: Generated game code (HTML/CSS/JS) should be stored efficiently (e.g., in a database blob or a CDN) and served quickly. The iframe loading experience should be seamless.
- **Real-time Updates**: Leaderboards and game ratings should feel real-time. This can be achieved with optimistic updates on the client and/or server-sent events (SSE) to push updates to connected clients.

## 6. Timeline & Milestones

**Phase 1: Foundation & Core Loop (6-8 weeks)**
- **Week 1-2**: Project setup, Next.js 16 + tRPC + Drizzle + Better Auth integration. Database schema design.
- **Week 3-4**: Implement user authentication, prompt creation interface, and the core game generation engine using one AI model.
- **Week 5-6**: Build the game gallery, player interface, and the basic rating system.
- **Week 7-8**: Implement the composite scoring system and the dynamic leaderboard. Initial testing and bug fixing.

**Phase 2: Competition & Community Features (4-5 weeks)**
- **Week 9-10**: Implement the monthly theme lifecycle system (admin panel, theme switching, gallery archive).
- **Week 11-12**: Build out user profiles, prompt versioning/forking, and the "Run this Prompt" functionality.
- **Week 13**: Integrate multiple AI models and the difficulty handicap system.
- **Week 14**: Final testing, performance optimization, and security audit.

**MVP Launch**: End of Week 14.

**Phase 3: Post-Launch Iteration (Ongoing)**
- **Month 1 Post-Launch**: Monitor KPIs, gather user feedback, fix bugs, and begin planning the first post-MVP feature (e.g., Team Competitions).

## 7. Open Questions / Risks

### Open Questions
- **Cost Management**: AI generation via powerful models (e.g., Opus-4.6) can be expensive. What is the cost model for allowing users to run prompts? Will there be a limit on free runs?
- **Content Moderation**: How do we handle prompts that generate inappropriate, offensive, or non-functional games? An automated and manual moderation strategy is needed.
- **API Key Security for "Run this Prompt"**: What is the most secure and user-friendly way for a user to provide their API key for a one-off run without it being perceived as risky?
- **Defining "Brevity"**: The anti-cheating brevity score needs a precise, fair, and transparent formula. How do we quantify it? (e.g., log of character count, token count?).

### Risks
- **Technical Risk**: The core premise relies on the ability of current LLMs to generate functional, bug-free games from a single prompt. If the quality is consistently too low, user engagement will suffer. **Mitigation**: Thoroughly test model capabilities during Phase 1. If needed, provide a minimal, standard "game wrapper" that the AI only needs to fill in, increasing success rates.
- **Security Risk**: Executing untrusted AI-generated code in iframes is inherently risky. A vulnerability could lead to XSS or other attacks. **Mitigation**: Strict iframe sandboxing, CSP policies, and regular security audits.
- **Engagement Risk**: The monthly cycle might be too long for some users and too short for others. A poorly timed theme could result in low participation. **Mitigation**: Start with a bi-weekly cycle to iterate faster. Use A/B testing on theme announcements and community engagement features.
- **Gamification Risk**: The scoring formula could be exploited ("gamed") by users in ways not anticipated, devaluing the competition. **Mitigation**: Keep the formula flexible. Monitor for anomalous patterns and be prepared to adjust weights in the first few months. Radical transparency about the formula will help the community self-police.