# Arcade Vibe - Vision Document v2.1

## Mission

Create a competitive prompt engineering platform disguised as a retro arcade, where the game IS the meta-game: crafting the perfect one-shot prompt to generate playable arcade games.

## Core Philosophy

**"One prompt. One shot. One month to prove you're the best prompt engineer."**

This isn't about who can code the best game - it's about who can make AI code the best game. Every month is a fresh challenge, a new theme, and a clean leaderboard. The community doesn't just play games; they dissect prompts, fork strategies, and push the boundaries of what single-shot generation can achieve.

---

## The Experience

### For Participants (Prompt Engineers)

You receive a monthly theme with core requirements (scoring system, lives, levels, iframe compatibility). You craft a single-message prompt with zero context, zero history - pure instruction. You choose your weapon from difficulty tiers:

- **Cheater Tier** (0.8x): GPT-5.3, Opus-4.6 - The easy road
- **Easy Tier** (0.9x): Sonnet-4.5 - Still pretty comfortable
- **Normal Tier** (1.0x): GLM-4.7, Kimi-k2.5, Gemini-3-Pro-Preview - The baseline
- **Hard Tier** (1.25x): Deepseek-3.2, GPT-5.1-mini, Haiku-4.5, Gemini-3-Flash-Preview - Real challenge
- **Impossible Tier** (2.5x): Tiny models (<7B params) - Glory awaits

You iterate privately, creating versions and forks. Each attempt is preserved - your evolution as a prompt engineer is documented. When you're ready, you publish. The community plays your game, rates it, and - here's the kicker - can run your prompt on different models to see if your prompt was model-specific genius or universal excellence.

**Real-time streaming**: Watch your game being generated live with syntax-highlighted code (Shiki). No dead spinners - see the AI think.

Your score combines:

- **Quality** (40%): Bayesian average rating × 20
- **Difficulty** (25%): Model tier multiplier × 20
- **Efficiency** (20%): Brevity bonus (logarithmic, peaks at ≤500 tokens) × 20
- **Engagement** (10%): Average playtime (capped at 5min) × 20
- **Popularity** (5%): Vote volume (number of ratings) × 20

### For Players (The Community)

You browse the monthly arcade. Each game shows its difficulty badge and **public leaderboard** (top scores). You play, you rate (minimum 60 seconds playtime required), you see the leaderboard shift in real-time. If a prompt is public, you can view its entire evolution - every fork, every refinement. You can even run that prompt yourself on a different model with your own API key, contributing to the meta-analysis of prompt portability.

**Anonymous Play**: Anyone can play games without an account. However:
- Anonymous scores are NOT recorded on the per-game leaderboard
- Anonymous playtime does NOT count toward the game's engagement score
- Rating requires authentication (to prevent vote manipulation)

Your profile tracks both your creations and your "prompt runs" - games you generated using others' prompts.

### Monthly Lifecycle

1. **Week 1**: Theme announcement. Chaos. Everyone experimenting.
2. **Week 2-3**: Refinement. Leaders emerge. Community testing intensifies.
3. **Week 4**: Final push. Leaderboard solidifies.
4. **Month End**: Rankings freeze. Games become permanent gallery pieces with locked rankings. New theme drops.

---

## Technical Architecture

### Stack (LOCKED - DO NOT MODIFY VERSIONS)

- **Frontend**: Next.js 16 (App Router)
- **API Layer**: tRPC v11 (type-safe, subscriptions for real-time)
- **Database**: Drizzle ORM on PostgreSQL 18
- **Auth**: Better Auth (OAuth: GitHub/Google)
- **Styling**: Tailwind v4 + shadcn/ui
- **AI Integration**: Vercel AI SDK v6 + AI SDK-React (streaming)
- **Code Highlighting**: Shiki (syntax highlighting for streamed code)
- **Diff Visualization**: diff (word-level diffing for prompt comparison)
- **Validation**: Zod 4 (end-to-end type safety)
- **Queue System**: BullMQ (Redis-based generation jobs)
- **Storage**: Vercel Blob / S3 (game assets, CDN) with exponential backoff retry
- **Caching**: Redis 7 with Streams (leaderboard, sessions, rate limits, real-time updates)

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js 16)                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Prompt     │  │     Game     │  │   Leaderboard    │  │
│   │   Editor     │  │    Player    │  │   & Profile      │  │
│   │  (Monaco)    │  │  (iframe)    │  │  (WebSocket)     │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Streaming  │  │   Version    │  │   Genealogy      │  │
│   │   Code View  │  │    Control   │  │    Tree          │  │
│   │  (Shiki)     │  │  (Diff View) │  │  (react-flow)    │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Admin      │  │   Game       │  │   Moderation     │  │
│   │  Dashboard   │  │  Leaderboard │  │     Queue        │  │
│   │  (Reports)   │  │  (Per-Game)  │  │   ( Appeals )    │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ tRPC v11
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                   API Layer (tRPC Routers)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth    │ │ Prompts  │ │  Games   │ │  Leaderboard  │  │
│  │  Router  │ │  Router  │ │  Router  │ │   Router      │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Scoring  │ │  Themes  │ │   Runs   │ │     Admin     │  │
│  │  Engine  │ │  (Admin) │ │  (BYOK)  │ │  (Direct)     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────────────┐   │
│  │ Credits  │ │ Game SDK │ │    Moderation Queue       │   │
│  │  Router  │ │  Router  │ │    (Reports + Appeals)    │   │
│  └──────────┘ └──────────┘ └────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Streaming Generation Pipeline (AI SDK)        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│   │  │ streamText│→ │  Shiki   │→ │  CDN Upload     │  │   │
│   │  │  (Multi- │  │ Highlight│  │  (w/ Retry)     │  │   │
│   │  │  Provider)│  │          │  │                  │  │   │
│   │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │
              ┌───────────┴──────────┐
              ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   PostgreSQL 18  │   │     Redis 7      │
    │  (Drizzle ORM)   │   │                  │
    │  ┌────────────┐  │   │  ┌────────────┐  │
    │  │ users      │  │   │  │ sessions   │  │
    │  │ themes     │  │   │  │ lb_cache   │  │
    │  │ prompts    │  │   │  │ rate_limit │  │
    │  │ games      │  │   │  │ job_queue  │  │
    │  │ ratings    │  │   │  │ game_tokens│  │
    │  │ scores     │  │   │  └────────────┘  │
    │  │ prompt_runs│  │   │                  │
    │  │ game_scores│  │   │                  │
     │  │ credits    │  │   │                  │
     │  │ model_config│ │   │                  │
     │  │ subscription│ │   │                  │
     │  │    _plans   │ │   │                  │
     │  │ moderation  │ │   │                  │
     │  │    _reports│ │   │                  │
     │  │ moderation  │ │   │                  │
     │  │    _appeals│ │   │                  │
     │  └────────────┘  │   │                  │
    └──────────────────┘   └──────────────────┘
              │
              ▼
    ┌──────────────────────────────────────────┐
    │         External AI Providers            │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
    │  │ OpenAI   │ │ Anthropic│ │ Google   │ │
    │  │ (custom  │ │ (custom  │ │ (Gemini) │ │
    │  │  URL)    │ │  URL)    │ │          │ │
    │  └──────────┘ └──────────┘ └──────────┘ │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
    │  │ DeepSeek │ │GLM/Zhipu │ │OpenRouter│ │
    │  │          │ │          │ │ (unified)│ │
    │  └──────────┘ └──────────┘ └──────────┘ │
    │  ┌──────────┐ ┌──────────┐              │
    │  │ Moonshot │ │  Custom  │              │
    │  │          │ │  (BYOK)  │              │
    │  └──────────┘ └──────────┘              │
    └──────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────────┐
    │      CDN / Storage (Vercel Blob/S3)      │
    │  - Generated game HTML/JS files          │
    │  - Static assets for iframe rendering    │
    │  - Arcade Vibe SDK script                │
    └──────────────────────────────────────────┘
```

### Key Technical Flows

#### 1. Prompt Submission & Streaming Generation

```typescript
// User flow
User crafts prompt →
Selects model(s) + difficulty tier →
Uses credits OR provides own API key (BYOK) →
[SUBMIT] →

// Backend flow (tRPC procedure with streaming)
Validate input (Zod schema) →
Check credits (skip if BYOK) →
Store prompt version (Drizzle, immutable) →
Create game record with 'generating' status →
Return stream connection to client →

// Streaming flow (AI SDK streamText)
streamText({
  model: selectedProvider(modelKey),
  prompt: fullPrompt,
  // NO maxTokens - let model generate until done
}) →
Stream chunks to client →
Client renders with Shiki syntax highlighting →
On completion: upload to CDN (with exponential backoff retry) →
Update game status to 'completed'

// Credit Policy
Credits are deducted BEFORE generation starts. No refunds for:
- AI generating invalid/broken code (that's the game)
- Stream disconnections
- Model errors
CDN upload failures trigger automatic retry with exponential backoff.
```

#### 2. Arcade Vibe Game SDK (Secure Iframe Communication)

The SDK is **automatically injected** into every generated game. AI models are instructed via system prompt to use `ArcadeVibe.reportScore()` for score tracking.

**SDK Script (Loaded in iframe):**

```typescript
// arcade-vibe-sdk.js - Injected into every game iframe
(function () {
  "use strict";

  // Session token injected by server (JWT, short-lived)
  const SESSION_TOKEN = "__ARCADE_VIBE_SESSION_TOKEN__";
  const API_ENDPOINT = "__ARCADE_VIBE_API_ENDPOINT__";
  const GAME_ID = "__ARCADE_VIBE_GAME_ID__";

  // Internal state
  let sessionStart = Date.now();
  let lastHeartbeat = Date.now();
  let isSessionActive = true;

  // Heartbeat for playtime tracking (every 5 seconds)
  const heartbeatInterval = setInterval(() => {
    if (!isSessionActive) return;

    const playtime = Math.floor((Date.now() - sessionStart) / 1000);

    fetch(`${API_ENDPOINT}/game-sdk/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SESSION_TOKEN}`,
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        playtime,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silent fail - don't break game
    });

    lastHeartbeat = Date.now();
  }, 5000);

  // Public API exposed to games
  window.ArcadeVibe = {
    /**
     * Report a score to the leaderboard
     * @param {number} score - The player's score (must be positive integer)
     */
    reportScore(score) {
      if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
        console.warn("[ArcadeVibe] Invalid score. Must be a positive integer.");
        return;
      }

      const playtime = Math.floor((Date.now() - sessionStart) / 1000);

      fetch(`${API_ENDPOINT}/game-sdk/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SESSION_TOKEN}`,
        },
        body: JSON.stringify({
          gameId: GAME_ID,
          score,
          playtime,
          timestamp: Date.now(),
        }),
      }).catch(() => {
        console.warn("[ArcadeVibe] Failed to submit score. Check connection.");
      });
    },

    /**
     * Get the current session playtime in seconds
     * @returns {number} Playtime in seconds
     */
    getPlaytime() {
      return Math.floor((Date.now() - sessionStart) / 1000);
    },

    /**
     * Check if SDK is properly initialized
     * @returns {boolean}
     */
    isReady() {
      return SESSION_TOKEN !== "__ARCADE_VIBE_SESSION_TOKEN__";
    },
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    isSessionActive = false;
    clearInterval(heartbeatInterval);

    // Final playtime report (beacon API for reliability)
    const playtime = Math.floor((Date.now() - sessionStart) / 1000);
    navigator.sendBeacon(
      `${API_ENDPOINT}/game-sdk/end-session`,
      JSON.stringify({
        gameId: GAME_ID,
        token: SESSION_TOKEN,
        playtime,
      }),
    );
  });

  console.log(
    "[ArcadeVibe SDK] Initialized. Use ArcadeVibe.reportScore(score) to submit scores.",
  );
})();
```

**System Prompt Addition (for AI models):**

````
## Core Requirements (MANDATORY)

Your game MUST include:
- Scoring system with visible score display
- Lives system (player can lose and game over)
- Multiple levels or progressive difficulty
- Touch controls (tap, swipe) for mobile compatibility
- Responsive design that works in any iframe size

## Arcade Vibe SDK Integration

Your game runs in an iframe with the Arcade Vibe SDK pre-loaded. You MUST use it for score tracking.

### Available API:
- `ArcadeVibe.reportScore(score)` - Submit a score to the leaderboard. Call this when:
  - Player completes a level
  - Player loses all lives (game over)
  - Player achieves a new high score

- `ArcadeVibe.getPlaytime()` - Get current session playtime in seconds

### Example:
```javascript
// When player gets game over
function gameOver() {
  ArcadeVibe.reportScore(playerScore);
  showGameOverScreen();
}

// When player completes a level
function levelComplete() {
  ArcadeVibe.reportScore(playerScore);
  nextLevel();
}
````

DO NOT implement your own score tracking via postMessage. The SDK handles all communication securely.

````

**Server-side Validation:**

```typescript
// tRPC router for game SDK endpoints
export const gameSdkRouter = router({
  heartbeat: publicProcedure
    .input(z.object({
      gameId: z.string().uuid(),
      playtime: z.number().int().min(0),
      timestamp: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate JWT from Authorization header
      const token = ctx.headers.get('authorization')?.replace('Bearer ', '');
      const session = await verifyGameSessionToken(token);

      if (!session || session.gameId !== input.gameId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Server-side validation: playtime cannot exceed wall-clock time
      const wallClockElapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      const maxAllowedPlaytime = wallClockElapsed + 10; // 10s tolerance for network latency

      if (input.playtime > maxAllowedPlaytime) {
        // Log suspicious activity but don't reject immediately
        await logSuspiciousActivity(session.userId, input.gameId, 'playtime_mismatch');
      }

      // Update session playtime
      await redis.hset(`game_session:${session.id}`, {
        lastPlaytime: Math.min(input.playtime, maxAllowedPlaytime),
        lastHeartbeat: Date.now()
      });

      return { ok: true };
    }),

  score: publicProcedure
    .input(z.object({
      gameId: z.string().uuid(),
      score: z.number().int().min(0),
      playtime: z.number().int().min(0),
      timestamp: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const token = ctx.headers.get('authorization')?.replace('Bearer ', '');
      const session = await verifyGameSessionToken(token);

      if (!session || session.gameId !== input.gameId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Validate playtime against wall-clock
      const wallClockElapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      const validatedPlaytime = Math.min(input.playtime, wallClockElapsed + 10);

      // Store score in game leaderboard
      await db.insert(gameScores).values({
        gameId: input.gameId,
        sessionId: session.id,
        userId: session.userId,
        score: input.score,
        playtimeSeconds: validatedPlaytime,
        submittedAt: new Date()
      });

      // Invalidate leaderboard cache
      await redis.del(`game_leaderboard:${input.gameId}`);

      // Publish for real-time updates (Redis Streams)
      await redis.xadd(`game_scores:${input.gameId}`, '*', {
        score: input.score.toString(),
        userId: session.userId
      });

      return { ok: true };
    }),
});

// Game session token creation (when game loads)
async function createGameSessionToken(userId: string, gameId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const startedAt = Date.now();

  // Store session in Redis (expires after 1 hour)
  await redis.hset(`game_session:${sessionId}`, {
    userId,
    gameId,
    startedAt,
    lastPlaytime: 0,
    lastHeartbeat: startedAt
  });
  await redis.expire(`game_session:${sessionId}`, 3600);

  // Create JWT (short-lived, 1 hour)
  const token = jwt.sign(
    { sessionId, userId, gameId, startedAt },
    process.env.GAME_SDK_SECRET,
    { expiresIn: '1h' }
  );

  return token;
}
````

**Game Template (with SDK injection):**

Games are served as-is with NO sanitization. The generated HTML/JS runs directly in a sandboxed iframe. This is intentional - broken games are part of the competition. The sandbox attributes restrict dangerous capabilities.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
    <!-- Arcade Vibe SDK (injected with session token) -->
    <script>
      // SDK code with replaced placeholders:
      // __ARCADE_VIBE_SESSION_TOKEN__ → actual JWT
      // __ARCADE_VIBE_API_ENDPOINT__ → https://api.arcade-vibe.com
      // __ARCADE_VIBE_GAME_ID__ → actual game UUID
    </script>
  </head>
  <body>
    <!-- AI-generated game code inserted here (NO sanitization) -->
  </body>
</html>
```

**Iframe Sandbox Attributes:**
```html
<iframe 
  src="..." 
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer"
></iframe>
```

#### 3. Per-Game Leaderboard

Each generated game has its own public leaderboard tracking player scores.

**Database Schema:**

```typescript
// Game scores (per-game leaderboard)
export const gameScores = pgTable(
  "game_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id").notNull(), // From game session token
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    score: integer("score").notNull(),
    playtimeSeconds: integer("playtime_seconds").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => ({
    idx_game_score: index("idx_game_scores_game_score").on(
      table.gameId,
      table.score.desc(),
    ),
    idx_game_user: index("idx_game_scores_game_user").on(
      table.gameId,
      table.userId,
    ),
  }),
);
```

**tRPC Router:**

```typescript
export const gameLeaderboardRouter = router({
  getLeaderboard: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      // Check cache first
      const cached = await redis.get(`game_leaderboard:${input.gameId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const leaderboard = await db.query.gameScores.findMany({
        where: eq(gameScores.gameId, input.gameId),
        orderBy: [desc(gameScores.score), asc(gameScores.submittedAt)],
        limit: input.limit,
        with: {
          user: {
            columns: { id: true, username: true },
          },
        },
      });

      // Cache for 1 minute
      await redis.setex(
        `game_leaderboard:${input.gameId}`,
        60,
        JSON.stringify(leaderboard),
      );

      return leaderboard;
    }),

  getStats: publicProcedure
    .input(z.object({ gameId: z.string().uuid() }))
    .query(async ({ input }) => {
      const stats = await db
        .select({
          totalPlays: count(),
          highScore: max(gameScores.score),
          avgScore: avg(gameScores.score),
          avgPlaytime: avg(gameScores.playtimeSeconds),
          uniquePlayers: countDistinct(gameScores.userId),
        })
        .from(gameScores)
        .where(eq(gameScores.gameId, input.gameId));

      return stats[0];
    }),

  // Real-time subscription for leaderboard updates (Redis Streams)
  subscribe: publicProcedure
    .input(z.object({ gameId: z.string().uuid() }))
    .subscription(async function* ({ input }) {
      let lastId = '$'; // Start from latest

      while (true) {
        // Read from stream with blocking (5 second timeout)
        const results = await redis.xread(
          'BLOCK', 5000,
          'STREAMS', `game_scores:${input.gameId}`, lastId
        );

        if (results) {
          const [streamName, entries] = results[0];
          for (const [entryId, fields] of entries) {
            lastId = entryId;
          }

          // Fetch updated leaderboard
          const leaderboard = await db.query.gameScores.findMany({
            where: eq(gameScores.gameId, input.gameId),
            orderBy: [desc(gameScores.score)],
            limit: 50,
            with: { user: { columns: { id: true, username: true } } },
          });

          yield leaderboard;
        }
      }
    }),
});
```

#### 4. Streaming Generation with Shiki

```typescript
// Generation route with streaming + syntax highlighting
import { streamText } from "ai";
import { createHighlighter } from "shiki";

// Pre-initialize highlighter
const highlighterPromise = createHighlighter({
  themes: ["github-dark", "github-light"],
  langs: ["html", "javascript", "css"],
});

export const generateRouter = router({
  streamGeneration: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        modelKey: z.string(),
        apiKeyId: z.string().uuid().optional(), // For BYOK
      }),
    )
    .mutation(async function* ({ input, ctx }) {
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, input.promptId),
        with: { theme: true },
      });

      // Check credits if not BYOK
      if (!input.apiKeyId) {
        const creditCost = await getModelCreditCost(input.modelKey);
        const userCredits = await getUserCredits(ctx.user.id);

        if (userCredits < creditCost) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: `Insufficient credits. Need ${creditCost}, have ${userCredits}.`,
          });
        }

        await deductCredits(ctx.user.id, creditCost);
      }

      // Get API key (platform or user's BYOK)
      const apiKey = input.apiKeyId
        ? await getDecryptedUserKey(input.apiKeyId)
        : await getPlatformKey(input.modelKey);

      // Create game record
      const game = await db
        .insert(games)
        .values({
          promptId: input.promptId,
          modelKey: input.modelKey,
          modelTier: getModelTier(input.modelKey),
          status: "generating",
        })
        .returning();

      // Full prompt with system prompt
      const fullPrompt = `${prompt.theme.systemPrompt}

USER PROMPT:
${prompt.content}`;

      // Stream generation
      const model = getProviderModel(input.modelKey, apiKey);
      const highlighter = await highlighterPromise;

      const result = streamText({
        model,
        prompt: fullPrompt,
        // NO maxTokens - let the model complete naturally
      });

      let fullCode = "";

      // Stream chunks with syntax highlighting
      for await (const chunk of result.textStream) {
        fullCode += chunk;

        // Highlight the accumulated code
        const highlighted = highlighter.codeToHtml(fullCode, {
          lang: "html",
          theme: "github-dark",
        });

        yield {
          type: "chunk",
          gameId: game[0].id,
          code: fullCode,
          highlighted,
          isComplete: false,
        };
      }

      // Sanitize and finalize
      const assetUrl = await uploadToCDN(fullCode, game[0].id);

      await db
        .update(games)
        .set({
          generatedCode: fullCode,
          assetUrl,
          tokenUsage: (await result.usage).totalTokens,
          status: "completed",
        })
        .where(eq(games.id, game[0].id));

      yield {
        type: "complete",
        gameId: game[0].id,
        assetUrl,
        tokenUsage: (await result.usage).totalTokens,
        isComplete: true,
      };
    }),
});
```

#### 5. Real-Time Leaderboard Updates

```typescript
// tRPC subscription (client)
const { data: leaderboard } = trpc.leaderboard.subscribe.useSubscription(
  { themeId },
  {
    onData(data) {
      // Real-time leaderboard updates
    },
  },
);

// Server (tRPC router) - Redis Streams for scalable real-time updates
subscribe: publicProcedure
  .input(z.object({ themeId: z.string().uuid() }))
  .subscription(async function* ({ input, ctx }) {
    let lastId = '$'; // Start from latest

    while (true) {
      // Read from stream with blocking (5 second timeout)
      const results = await redis.xread(
        'BLOCK', 5000,
        'STREAMS', `leaderboard:${input.themeId}`, lastId
      );

      if (results) {
        const [streamName, entries] = results[0];
        for (const [entryId, fields] of entries) {
          lastId = entryId;
        }
      }

      // Fetch top 100 from Redis cache (5min TTL)
      const cached = await redis.get(`lb:${input.themeId}`);

      if (!cached) {
        // Cache miss: query DB, update Redis
        const top100 = await db.query.scores.findMany({
          where: eq(scores.themeId, input.themeId),
          orderBy: desc(scores.finalScore),
          limit: 100,
          with: { game: { with: { prompt: { with: { author: true } } } } },
        });
        await redis.setex(`lb:${input.themeId}`, 300, JSON.stringify(top100));
        yield top100;
      } else {
        yield JSON.parse(cached);
      }
    }
  });
```

#### 7. Visual Prompt Diff Tool

A side-by-side comparison tool showing word-level differences between prompt versions.

**Frontend Component:**

```typescript
import { useMemo } from "react";
import { diffWords } from "diff";

interface PromptDiffProps {
  leftContent: string;
  rightContent: string;
  leftVersion: number;
  rightVersion: number;
}

export function PromptDiff({ leftContent, rightContent, leftVersion, rightVersion }: PromptDiffProps) {
  const diff = useMemo(() => {
    return diffWords(leftContent, rightContent);
  }, [leftContent, rightContent]);

  const renderDiff = (d: diff.Change[]) => {
    return d.map((part, index) => {
      const style = part.added
        ? "bg-green-200 text-green-900"
        : part.removed
        ? "bg-red-200 text-red-900 line-through"
        : "text-gray-900";

      return (
        <span key={index} className={style}>
          {part.value}
        </span>
      );
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="border-r pr-4">
        <h3 className="font-bold mb-2">Version {leftVersion}</h3>
        <div className="whitespace-pre-wrap text-sm font-mono">
          {renderDiff(diff.filter((d) => !d.added))}
        </div>
      </div>
      <div className="pl-4">
        <h3 className="font-bold mb-2">Version {rightVersion}</h3>
        <div className="whitespace-pre-wrap text-sm font-mono">
          {renderDiff(diff.filter((d) => !d.removed))}
        </div>
      </div>
    </div>
  );
}
```

**tRPC Router (Version Selection):**

```typescript
export const promptsRouter = router({
  getVersion: publicProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        version: z.number().int().min(1),
      }),
    )
    .query(async ({ input }) => {
      return db.query.prompts.findFirst({
        where: and(
          eq(prompts.id, input.promptId),
          eq(prompts.version, input.version),
        ),
        columns: { content: true, createdAt: true, version: true },
      });
    }),

  listVersions: publicProcedure
    .input(z.object({ promptId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.query.prompts.findMany({
        where: eq(prompts.id, input.promptId),
        orderBy: [asc(prompts.version)],
        columns: {
          id: true,
          version: true,
          createdAt: true,
          contentHash: true,
          tokenCount: true,
        },
      });
    }),
});
```

**Usage in Genealogy View:**

```typescript
// Genealogy tree with diff capability
export function PromptGenealogyTree({ promptId }: { promptId: string }) {
  const versions = trpc.prompts.listVersions.useQuery({ promptId });
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([1, 2]);

  // Fetch actual content for selected versions
  const leftVersion = trpc.prompts.getVersion.useQuery(
    { promptId, version: selectedVersions[0] },
    { enabled: !!versions.data }
  );
  const rightVersion = trpc.prompts.getVersion.useQuery(
    { promptId, version: selectedVersions[1] },
    { enabled: !!versions.data }
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={selectedVersions[0]}
          onChange={(e) => setSelectedVersions([parseInt(e.target.value), selectedVersions[1]])}
        >
          {versions.data?.map((v) => (
            <option key={v.id} value={v.version}>
              Version {v.version} ({new Date(v.createdAt).toLocaleDateString()})
            </option>
          ))}
        </select>
        <select
          value={selectedVersions[1]}
          onChange={(e) => setSelectedVersions([selectedVersions[0], parseInt(e.target.value)])}
        >
          {versions.data?.map((v) => (
            <option key={v.id} value={v.version}>
              Version {v.version} ({new Date(v.createdAt).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {leftVersion.data && rightVersion.data && (
        <PromptDiff
          leftContent={leftVersion.data.content}
          rightContent={rightVersion.data.content}
          leftVersion={selectedVersions[0]}
          rightVersion={selectedVersions[1]}
        />
      )}
    </div>
  );
}
```

#### 8. Scoring Algorithm (Composite)

```typescript
// Executed in background job (BullMQ) on new rating
async function calculateScore(gameId: string) {
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: { ratings: true, prompt: true },
  });

  // Fetch dynamic platform stats from database
  const globalAvgRatingStat = await db.query.platformStats.findFirst({
    where: eq(platformStats.statKey, 'global_avg_rating'),
  });
  const minVotesStat = await db.query.platformStats.findFirst({
    where: eq(platformStats.statKey, 'min_votes_bayesian'),
  });

  const globalAvgRating = Number(globalAvgRatingStat?.statValue) || 3.5; // Fallback
  const minVotes = Number(minVotesStat?.statValue) || 5; // Fallback

  // 1. Quality Score (40%) - Bayesian Average Rating
  const avgRating =
    game.ratings.length > 0
      ? game.ratings.reduce((sum, r) => sum + r.overallScore, 0) /
        game.ratings.length
      : 0;
  const bayesianRating =
    (avgRating * game.ratings.length + globalAvgRating * minVotes) /
    (game.ratings.length + minVotes);
  const qualityScore = bayesianRating * 20; // Scale to 0-100

  // 2. Difficulty Score (25%) - Model Tier Multiplier
  const tierMultipliers = {
    cheater: 0.8,
    easy: 0.9,
    normal: 1.0,
    hard: 1.25,
    impossible: 2.5,
  };
  const difficultyScore = (tierMultipliers[game.modelTier] || 1.0) * 20;

  // 3. Efficiency Score (20%) - Brevity Bonus (Token Count)
  const tokenCount = game.prompt.tokenCount;
  const brevityBonus =
    tokenCount <= 500
      ? 1.0
      : Math.max(0, 1.0 - Math.log10(tokenCount / 500) / 2); // Logarithmic decay
  const efficiencyScore = brevityBonus * 20;

  // 4. Engagement Score (10%) - Average Playtime
  const avgPlaytimeSeconds =
    game.ratings.length > 0
      ? game.ratings.reduce((sum, r) => sum + r.playtimeSeconds, 0) /
        game.ratings.length
      : 0;
  const engagementNormalized = Math.min(avgPlaytimeSeconds / 300, 1.0); // Cap at 5 min
  const engagementScore = engagementNormalized * 20;

  // 5. Popularity Score (5%) - Vote Volume
  const voteCount = game.ratings.length;
  const popularityNormalized = Math.min(voteCount / 100, 1.0); // Cap at 100 votes for maximum score
  const popularityScore = popularityNormalized * 20;

  // Final Score (weighted sum)
  const finalScore =
    qualityScore * 0.4 +
    difficultyScore * 0.25 +
    efficiencyScore * 0.2 +
    engagementScore * 0.1 +
    popularityScore * 0.05;

  // Store in scores table
  await db.insert(scores).values({
    gameId,
    bayesianRating,
    difficultyMultiplier: tierMultipliers[game.modelTier],
    brevityScore: brevityBonus,
    engagementScore: engagementNormalized,
    popularityScore: popularityNormalized,
    finalScore,
    calculatedAt: new Date(),
    version: 1,
  });

  // Publish to Redis Stream for real-time leaderboard update
  await redis.xadd(
    `leaderboard:${game.themeId}`,
    '*',
    { gameId, finalScore: finalScore.toString() }
  );
}
```

### Database Schema (Core Entities - Drizzle ORM)

```typescript
// Complete schema with all relationships

// Enums
export const themeStatusEnum = pgEnum("theme_status", [
  "upcoming",
  "active",
  "frozen",
  "archived",
]);
export const visibilityEnum = pgEnum("visibility", [
  "private",
  "public_on_freeze",
  "public",
]);
export const promptStatusEnum = pgEnum("prompt_status", [
  "draft",
  "submitted",
  "disqualified",
]);
export const gameStatusEnum = pgEnum("game_status", [
  "generating",
  "completed",
  "failed",
  "hidden",
]);
export const modelTierEnum = pgEnum("model_tier", [
  "cheater",
  "easy",
  "normal",
  "hard",
  "impossible",
]);
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "moderator",
  "participant",
  "viewer",
]);
export const providerEnum = pgEnum("provider", [
  "openai",
  "anthropic",
  "google",
  "openrouter",
  "deepseek",
  "glm",
  "glm-coding-plan",
  "moonshot",
  "custom",
  // Note: deepseek, glm, moonshot, and custom use OpenAI-compatible API with custom baseURL
  // Note: glm-coding-plan uses Anthropic-compatible API with custom baseURL https://api.z.ai/api/anthropic
  // custom provider can also use Anthropic-compatible API with custom baseURL
]);

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  role: userRoleEnum("role").default("participant").notNull(),
  reputation: integer("reputation").default(0),
  credits: integer("credits").default(0).notNull(), // Platform credits
  isSuspended: boolean("is_suspended").default(false),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credit transactions (audit log)
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer("amount").notNull(), // Positive for add, negative for deduct
  reason: varchar("reason", { length: 100 }).notNull(), // 'purchase', 'generation', 'refund', 'bonus'
  modelKey: varchar("model_key", { length: 100 }), // Which model consumed credits
  metadata: jsonb("metadata"), // Additional context (plan, transaction ID, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscription plans (admin-configurable)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(), // 'starter', 'pro', 'team'
  displayName: varchar("display_name", { length: 100 }).notNull(), // User-friendly name
  priceUsd: integer("price_usd").notNull(), // In cents: 800, 1800, 3500
  creditsPerMonth: integer("credits_per_month").notNull(),
  extraCreditMarkupPercent: integer("extra_credit_markup_percent")
    .default(30)
    .notNull(), // % markup over base credit cost
  minExtraCreditsPurchase: integer("min_extra_credits_purchase")
    .default(25)
    .notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"), // Feature list
  features: jsonb("features").notNull(), // Array of feature strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => subscriptionPlans.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'active', 'cancelled', 'past_due'
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Keys (encrypted storage) - for BYOK users
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: providerEnum("provider").notNull(),
  encryptedKey: text("encrypted_key").notNull(), // AES-256 encrypted
  customEndpoint: varchar("custom_endpoint", { length: 500 }), // For OpenAI/Anthropic compatible APIs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Models Configuration (admin-managed)
export const modelConfig = pgTable("model_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: providerEnum("provider").notNull(),
  modelKey: varchar("model_key", { length: 100 }).notNull().unique(), // e.g., 'gpt-5.3', 'claude-opus-4.6'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  tier: modelTierEnum("tier").notNull(),
  creditCost: integer("credit_cost").notNull(), // Credits per generation
  isActive: boolean("is_active").default(true), // Admin can activate/deactivate
  supportsStreaming: boolean("supports_streaming").default(true),
  maxContextTokens: integer("max_context_tokens"), // For reference
  metadata: jsonb("metadata"), // Provider-specific config
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Monthly Themes
export const themes = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: jsonb("requirements").notNull(), // { lives: true, levels: true, scoring: true, ... }
  systemPrompt: text("system_prompt").notNull(), // Hidden prompt with core requirements + SDK docs
  status: themeStatusEnum("status").default("upcoming").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prompts (versioned, immutable)
export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  themeId: uuid("theme_id")
    .references(() => themes.id, { onDelete: "cascade" })
    .notNull(),
  parentId: uuid("parent_id").references(() => prompts.id), // For forks
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(), // SHA-256
  tokenCount: integer("token_count").notNull(),
  tokenizer: varchar("tokenizer", { length: 50 }).notNull(), // e.g., 'cl100k_base', 'claude', 'gemini' - from AI SDK provider
  version: integer("version").notNull().default(1), // Version number for diffing
  visibility: visibilityEnum("visibility").default("private").notNull(),
  status: promptStatusEnum("status").default("draft").notNull(),
  // Soft delete for preserving genealogy trees
  hiddenAt: timestamp("hidden_at"),
  hiddenBy: uuid("hidden_by").references(() => users.id),
  hiddenReason: text("hidden_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Generated Games
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptId: uuid("prompt_id")
    .references(() => prompts.id, { onDelete: "cascade" })
    .notNull(),
  modelKey: varchar("model_key", { length: 100 }).notNull(), // gpt-4-turbo, claude-3-opus, etc.
  modelTier: modelTierEnum("model_tier").notNull(),
  generatedCode: text("generated_code"), // Sanitized HTML/JS
  assetUrl: varchar("asset_url", { length: 500 }), // CDN URL
  executionTimeMs: integer("execution_time_ms"),
  tokenUsage: integer("token_usage"),
  status: gameStatusEnum("status").default("generating").notNull(),
  isSubmitted: boolean("is_submitted").default(false), // Official competition entry
  frozenRank: integer("frozen_rank"), // Null until theme freezes
  hiddenAt: timestamp("hidden_at"), // For admin moderation
  hiddenBy: uuid("hidden_by").references(() => users.id),
  hiddenReason: text("hidden_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Game Scores (per-game leaderboard)
export const gameScores = pgTable(
  "game_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id").notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    score: integer("score").notNull(),
    playtimeSeconds: integer("playtime_seconds").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => ({
    idx_game_score: index("idx_game_scores_game_score").on(
      table.gameId,
      table.score.desc(),
    ),
    idx_game_user: index("idx_game_scores_game_user").on(
      table.gameId,
      table.userId,
    ),
  }),
);

// Prompt Runs (community experiments)
export const promptRuns = pgTable("prompt_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalPromptId: uuid("original_prompt_id")
    .references(() => prompts.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  modelUsed: varchar("model_used", { length: 100 }).notNull(),
  generatedGameId: uuid("generated_game_id").references(() => games.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ratings
export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
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
  },
  (table) => ({
    uniqueUserGame: unique().on(table.gameId, table.userId), // One rating per user per game
  }),
);

// Calculated Scores (materialized, recalculated on rating changes)
export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .references(() => games.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  themeId: uuid("theme_id")
    .references(() => themes.id, { onDelete: "cascade" })
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
  version: integer("version").default(1).notNull(),
});

// Platform Statistics (dynamic baseline for scoring algorithms)
export const platformStats = pgTable("platform_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  statKey: varchar("stat_key", { length: 50 }).notNull().unique(), // 'global_avg_rating', 'min_votes_bayesian', etc.
  statValue: decimal("stat_value", { precision: 10, scale: 4 }).notNull(),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Additional context (sample size, etc.)
});

// Admin Actions Log (moderation audit trail)
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .references(() => users.id)
    .notNull(),
  action: varchar("action", { length: 50 }).notNull(), // hide_game, suspend_user, activate_model, etc.
  targetType: varchar("target_type", { length: 50 }).notNull(), // game, user, prompt, model
  targetId: uuid("target_id").notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Moderation Reports (user-generated reports)
export const moderationReports = pgTable("moderation_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(), // 'game', 'prompt', 'profile', 'review'
  targetId: uuid("target_id").notNull(),
  reason: varchar("reason", { length: 50 }).notNull(), // 'inappropriate', 'spam', 'malicious', 'copyright', 'harassment', 'other'
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'reviewing', 'resolved'
  assignedTo: uuid("assigned_to").references(() => users.id),
  resolutionAction: varchar("resolution_action", { length: 20 }), // 'approved', 'rejected', 'requested_changes', 'escalated'
  resolutionReason: text("resolution_reason"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Moderation Appeals (user appeals)
export const moderationAppeals = pgTable("moderation_appeals", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .references(() => moderationReports.id, { onDelete: "cascade" })
    .notNull(),
  appellantId: uuid("appellant_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'approved', 'rejected'
  response: text("response"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes for performance
export const indexDefinitions = {
  // Leaderboard queries
  idx_scores_theme_final: index("idx_scores_theme_final").on(
    scores.themeId,
    scores.finalScore.desc(),
  ),
  idx_games_theme_submitted: index("idx_games_theme_submitted").on(
    games.promptId,
    games.isSubmitted,
    games.status,
  ),

  // User queries
  idx_prompts_author_theme: index("idx_prompts_author_theme").on(
    prompts.authorId,
    prompts.themeId,
  ),
  idx_ratings_game_user: index("idx_ratings_game_user").on(
    ratings.gameId,
    ratings.userId,
  ),

  // Admin queries
  idx_games_status_hidden: index("idx_games_status_hidden").on(
    games.status,
    games.hiddenAt,
  ),
  idx_users_suspended: index("idx_users_suspended").on(users.isSuspended),

  // Model queries
  idx_model_config_active: index("idx_model_config_active").on(
    modelConfig.isActive,
    modelConfig.tier,
  ),

  // Moderation queries
  idx_moderation_status_created: index("idx_moderation_status_created").on(
    moderationReports.status,
    moderationReports.createdAt,
  ),
  idx_moderation_target_status: index("idx_moderation_target_status").on(
    moderationReports.targetType,
    moderationReports.status,
  ),
  idx_moderation_reporter_target: index("idx_moderation_reporter_target").on(
    moderationReports.reporterId,
    moderationReports.targetType,
    moderationReports.targetId,
  ),
  idx_appeals_status: index("idx_appeals_status").on(
    moderationAppeals.status,
    moderationAppeals.createdAt,
  ),
};
```

### Admin Dashboard Features

**Subscription Plan Management**

```typescript
export const adminRouter = router({
  // List all subscription plans
  getPlans: adminProcedure.query(async () => {
    return db.query.subscriptionPlans.findMany({
      orderBy: [asc(subscriptionPlans.priceUsd)],
    });
  }),

  // Update plan pricing
  updatePlan: adminProcedure
    .input(
      z.object({
        planId: z.string().uuid(),
        priceUsd: z.number().int().min(0), // In cents
        creditsPerMonth: z.number().int().min(1),
        extraCreditMarkupPercent: z.number().int().min(0).max(100),
        minExtraCreditsPurchase: z.number().int().min(1),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const oldPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, input.planId),
      });

      await db
        .update(subscriptionPlans)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, input.planId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "update_plan",
        targetType: "plan",
        targetId: input.planId,
        metadata: {
          oldPlan: {
            priceUsd: oldPlan?.priceUsd,
            creditsPerMonth: oldPlan?.creditsPerMonth,
          },
          newPlan: {
            priceUsd: input.priceUsd,
            creditsPerMonth: input.creditsPerMonth,
          },
        },
      });

      return { success: true };
    }),

  // Activate/deactivate a plan
  togglePlanActive: adminProcedure
    .input(
      z.object({
        planId: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(subscriptionPlans)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, input.planId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: input.isActive ? "activate_plan" : "deactivate_plan",
        targetType: "plan",
        targetId: input.planId,
      });

      return { success: true };
    }),
});
```

**Provider & Model Management**

```typescript
export const adminRouter = router({
  // List all models
  getModels: adminProcedure.query(async () => {
    return db.query.modelConfig.findMany({
      orderBy: [asc(modelConfig.provider), asc(modelConfig.tier)],
    });
  }),

  // Activate/deactivate a model
  toggleModelActive: adminProcedure
    .input(
      z.object({
        modelId: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(modelConfig)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(modelConfig.id, input.modelId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: input.isActive ? "activate_model" : "deactivate_model",
        targetType: "model",
        targetId: input.modelId,
      });

      return { success: true };
    }),

  // Update model credit cost
  updateModelPricing: adminProcedure
    .input(
      z.object({
        modelId: z.string().uuid(),
        creditCost: z.number().int().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const oldModel = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.modelId),
      });

      await db
        .update(modelConfig)
        .set({ creditCost: input.creditCost, updatedAt: new Date() })
        .where(eq(modelConfig.id, input.modelId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "update_model_pricing",
        targetType: "model",
        targetId: input.modelId,
        metadata: {
          oldCost: oldModel?.creditCost,
          newCost: input.creditCost,
        },
      });

      return { success: true };
    }),

  // Add new model
  addModel: adminProcedure
    .input(
      z.object({
        provider: z.enum([
          "openai",
          "anthropic",
          "google",
          "openrouter",
          "deepseek",
          "glm",
          "moonshot",
          "custom",
        ]),
        modelKey: z.string().min(1).max(100),
        displayName: z.string().min(1).max(100),
        tier: z.enum(["cheater", "easy", "normal", "hard", "impossible"]),
        creditCost: z.number().int().min(1),
        supportsStreaming: z.boolean().default(true),
        maxContextTokens: z.number().int().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const model = await db
        .insert(modelConfig)
        .values({
          ...input,
          isActive: true,
        })
        .returning();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "add_model",
        targetType: "model",
        targetId: model[0].id,
      });

      return model[0];
    }),
});
```

**Content Moderation Queue**

User-generated reports feed into a moderation queue. All content types can be reported. No auto-flagging.

**Database Schema (Moderation):**

```typescript
// Moderation reports (user-generated)
export const moderationReports = pgTable("moderation_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(), // 'game', 'prompt', 'profile', 'review'
  targetId: uuid("target_id").notNull(),
  reason: varchar("reason", { length: 50 }).notNull(), // 'inappropriate', 'spam', 'malicious', 'copyright'
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'reviewing', 'resolved'
  assignedTo: uuid("assigned_to").references(() => users.id),
  resolutionAction: varchar("resolution_action", { length: 20 }), // 'approved', 'rejected', 'requested_changes', 'escalated'
  resolutionReason: text("resolution_reason"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Moderation appeals (user appeals)
export const moderationAppeals = pgTable("moderation_appeals", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .references(() => moderationReports.id, { onDelete: "cascade" })
    .notNull(),
  appellantId: uuid("appellant_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'approved', 'rejected'
  response: text("response"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**tRPC Router (Moderation Queue):**

```typescript
export const moderationRouter = router({
  // User: Submit a report
  submitReport: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["game", "prompt", "profile", "review"]),
        targetId: z.string().uuid(),
        reason: z.enum(["inappropriate", "spam", "malicious", "copyright", "harassment", "other"]),
        description: z.string().min(20).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check for duplicate reports from same user on same target
      const existing = await db.query.moderationReports.findFirst({
        where: and(
          eq(moderationReports.reporterId, ctx.user.id),
          eq(moderationReports.targetType, input.targetType),
          eq(moderationReports.targetId, input.targetId),
          eq(moderationReports.status, "pending"),
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending report for this item.",
        });
      }

      const report = await db.insert(moderationReports).values({
        reporterId: ctx.user.id,
        ...input,
      }).returning();

      // Notify moderators (via Redis Stream)
      await redis.xadd("moderation:new", '*', {
        reportId: report[0].id,
        targetType: input.targetType,
      });

      return report[0];
    }),

  // Moderator: Get queue (all pending reports)
  getQueue: moderatorProcedure
    .input(
      z.object({
        targetType: z.enum(["game", "prompt", "profile", "review"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const where = input.targetType
        ? eq(moderationReports.targetType, input.targetType)
        : undefined;

      return db.query.moderationReports.findMany({
        where: and(eq(moderationReports.status, "pending"), where),
        orderBy: [asc(moderationReports.createdAt)],
        limit: input.limit,
        with: {
          reporter: { columns: { id: true, username: true } },
          assignedTo: { columns: { id: true, username: true } },
        },
      });
    }),

  // Moderator: Get report details (with target content)
  getReport: moderatorProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .query(async ({ input }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
        with: {
          reporter: { columns: { id: true, username: true } },
          assignedTo: { columns: { id: true, username: true } },
        },
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Fetch target content based on type
      let targetContent;
      if (report.targetType === "game") {
        targetContent = await db.query.games.findFirst({
          where: eq(games.id, report.targetId),
          with: {
            prompt: {
              columns: { content: true },
            },
          },
        });
      } else if (report.targetType === "prompt") {
        targetContent = await db.query.prompts.findFirst({
          where: eq(prompts.id, report.targetId),
          columns: { content: true },
        });
      } else if (report.targetType === "profile") {
        targetContent = await db.query.users.findFirst({
          where: eq(users.id, report.targetId),
          columns: { username: true, email: true },
        });
      } else if (report.targetType === "review") {
        targetContent = await db.query.ratings.findFirst({
          where: eq(ratings.id, report.targetId),
          columns: { reviewText: true, overallScore: true },
        });
      }

      // Fetch flag history (previous reports on same target)
      const flagHistory = await db.query.moderationReports.findMany({
        where: and(
          eq(moderationReports.targetType, report.targetType),
          eq(moderationReports.targetId, report.targetId),
          ne(moderationReports.id, report.id),
        ),
        orderBy: [desc(moderationReports.createdAt)],
        with: {
          reporter: { columns: { id: true, username: true } },
        },
      });

      return {
        report,
        targetContent,
        flagHistory,
      };
    }),

  // Moderator: Resolve report
  resolveReport: moderatorProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        action: z.enum(["approved", "rejected", "requested_changes", "escalated"]),
        resolutionReason: z.string().min(20).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Update report status
      await db
        .update(moderationReports)
        .set({
          status: "resolved",
          resolutionAction: input.action,
          resolutionReason: input.resolutionReason,
          reviewedAt: new Date(),
          assignedTo: ctx.user.id,
        })
        .where(eq(moderationReports.id, input.reportId));

      // Take action based on resolution
      if (input.action === "approved") {
        // Hide content
        if (report.targetType === "game") {
          await db
            .update(games)
            .set({
              status: "hidden",
              hiddenAt: new Date(),
              hiddenBy: ctx.user.id,
              hiddenReason: `Moderation: ${input.resolutionReason}`,
            })
            .where(eq(games.id, report.targetId));

          // Invalidate leaderboard cache
          const game = await db.query.games.findFirst({
            where: eq(games.id, report.targetId),
            with: { prompt: { columns: { themeId: true } } },
          });
          await redis.del(`lb:${game?.prompt.themeId}`);
        } else if (report.targetType === "prompt") {
          await db
            .update(prompts)
            .set({ status: "disqualified" })
            .where(eq(prompts.id, report.targetId));
        } else if (report.targetType === "profile") {
          await db
            .update(users)
            .set({ isSuspended: true, suspensionReason: input.resolutionReason })
            .where(eq(users.id, report.targetId));
        } else if (report.targetType === "review") {
          await db.delete(ratings).where(eq(ratings.id, report.targetId));
        }
      } else if (input.action === "requested_changes") {
        // For now, just reject - change requests would need notification system
        // Could be expanded to send message to user
      } else if (input.action === "escalated") {
        // Notify admins for review (Redis Stream)
        await redis.xadd("admin:escalation", '*', {
          reportId: input.reportId,
          escalatedBy: ctx.user.id,
        });
      }

      // Log action
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "resolve_report",
        targetType: report.targetType,
        targetId: report.targetId,
        reason: input.resolutionReason,
        metadata: {
          resolutionAction: input.action,
          reportId: input.reportId,
        },
      });

      return { success: true };
    }),

  // User: Appeal a resolution
  appealResolution: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        message: z.string().min(50).max(2000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report || report.status !== "resolved") {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      // Check if user can appeal (must be the content owner)
      let canAppeal = false;
      if (report.targetType === "game") {
        const game = await db.query.games.findFirst({
          where: eq(games.id, report.targetId),
          with: { prompt: true },
        });
        canAppeal = game?.prompt.authorId === ctx.user.id;
      } else if (report.targetType === "prompt") {
        const prompt = await db.query.prompts.findFirst({
          where: eq(prompts.id, report.targetId),
        });
        canAppeal = prompt?.authorId === ctx.user.id;
      } else if (report.targetType === "profile") {
        canAppeal = report.targetId === ctx.user.id;
      } else if (report.targetType === "review") {
        const review = await db.query.ratings.findFirst({
          where: eq(ratings.id, report.targetId),
        });
        canAppeal = review?.userId === ctx.user.id;
      }

      if (!canAppeal) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const appeal = await db.insert(moderationAppeals).values({
        reportId: input.reportId,
        appellantId: ctx.user.id,
        message: input.message,
      }).returning();

      // Notify moderators (Redis Stream)
      await redis.xadd("moderation:appeal", '*', {
        appealId: appeal[0].id,
        reportId: input.reportId,
      });

      return appeal[0];
    }),

  // Moderator: Get pending appeals
  getAppeals: moderatorProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return db.query.moderationAppeals.findMany({
        where: eq(moderationAppeals.status, "pending"),
        orderBy: [asc(moderationAppeals.createdAt)],
        limit: input.limit,
        with: {
          report: {
            with: {
              reporter: { columns: { id: true, username: true } },
            },
          },
          appellant: { columns: { id: true, username: true } },
        },
      });
    }),

  // Moderator: Resolve appeal
  resolveAppeal: moderatorProcedure
    .input(
      z.object({
        appealId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        response: z.string().min(20).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const appeal = await db.query.moderationAppeals.findFirst({
        where: eq(moderationAppeals.id, input.appealId),
        with: { report: true },
      });

      if (!appeal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Update appeal
      await db
        .update(moderationAppeals)
        .set({
          status: input.status,
          response: input.response,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(moderationAppeals.id, input.appealId));

      // If approved, revert original resolution
      if (input.status === "approved" && appeal.report.resolutionAction === "approved") {
        // Restore hidden content
        if (appeal.report.targetType === "game") {
          await db
            .update(games)
            .set({ status: "completed", hiddenAt: null, hiddenBy: null, hiddenReason: null })
            .where(eq(games.id, appeal.report.targetId));
        } else if (appeal.report.targetType === "prompt") {
          await db
            .update(prompts)
            .set({ status: "draft" })
            .where(eq(prompts.id, appeal.report.targetId));
        } else if (appeal.report.targetType === "profile") {
          await db
            .update(users)
            .set({ isSuspended: false, suspensionReason: null })
            .where(eq(users.id, appeal.report.targetId));
        }
      }

      // Log action
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "resolve_appeal",
        targetType: "appeal",
        targetId: input.appealId,
        reason: input.response,
        metadata: {
          appealStatus: input.status,
          originalReportId: appeal.reportId,
        },
      });

      return { success: true };
    }),
});
```

**Direct Moderation Actions (Admin Only):**

```typescript
// Direct actions without report (for severe cases)
export const adminRouter = router({
  hideGame: adminProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        reason: z.string().min(10).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(games)
        .set({
          status: "hidden",
          hiddenAt: new Date(),
          hiddenBy: ctx.user.id,
          hiddenReason: input.reason,
        })
        .where(eq(games.id, input.gameId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "hide_game",
        targetType: "game",
        targetId: input.gameId,
        reason: input.reason,
      });

      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        with: { prompt: { columns: { themeId: true } } },
      });
      await redis.del(`lb:${game.prompt.themeId}`);

      return { success: true };
    }),

  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        reason: z.string().min(10).max(500),
        duration: z.enum(["7d", "30d", "permanent"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(users)
        .set({
          isSuspended: true,
          suspensionReason: input.reason,
        })
        .where(eq(users.id, input.userId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "suspend_user",
        targetType: "user",
        targetId: input.userId,
        reason: input.reason,
        metadata: { duration: input.duration },
      });

      return { success: true };
    }),

  getModerationQueue: adminProcedure.query(async () => {
    // Games flagged by community
    const flaggedGames = await db.query.games.findMany({
      where: and(
        eq(games.status, "completed"),
        // Add flagging logic here
      ),
      limit: 50,
      orderBy: desc(games.createdAt),
      with: {
        prompt: { with: { author: true } },
        ratings: { where: lte(ratings.overallScore, 2) }, // Low-rated
      },
    });

    return flaggedGames;
  }),
});
```

**Admin UI Components** (shadcn/ui based)

- **Plan Management Dashboard**: Table of all subscription plans with pricing, credits, markup configuration
- **Model Management Dashboard**: Table of all models with activate/deactivate toggles, credit cost editor
- **Provider Configuration**: Custom endpoint URLs for OpenAI/Anthropic compatible APIs (multiple providers possible)
- **Moderation Dashboard**: Table with flagged games, low ratings, user reports
- **Game Viewer**: Iframe preview with "Hide Game" button + reason textarea
- **User Management**: List of users with "Suspend" action, duration selector
- **Audit Log**: Filterable table of all admin actions with undo capability
- **Theme Management**: CRUD interface for monthly challenges
- **Credit Management**: Grant/revoke credits for users, view transaction history

---

## Pricing & Credits System

### Plans

| Plan        | Price  | Credits/Month | Extra Credit Cost | Features                         |
| ----------- | ------ | ------------- | ----------------- | -------------------------------- |
| **Free**    | Free   | 20            | NA                | Basic access, all models         |
| **Starter** | $8/mo  | 250           | $0.042/credit     | Basic access, all models         |
| **Pro**     | $18/mo | 650           | $0.036/credit     | Priority queue, analytics        |
| **Team**    | $35/mo | 1500          | $0.030/credit     | Shared workspace, team analytics |
| **BYOK**    | Free   | Unlimited\*   | N/A               | Use your own API keys            |

\*BYOK users pay their provider directly. No platform credits needed.

**Extra Credit Pricing Calculation**:

- Base credit cost = Plan Price ÷ Credits/Month
- Extra credit cost = Base cost × (1 + markup_percent/100)
- Default markup: **+30%**

Example (Starter plan):

- Base: $8 ÷ 250 = $0.032/credit
- Extra: $0.032 × 1.30 = **$0.042/credit**

_All pricing values are configurable in admin panel._

### Credit Costs (Per Model - Admin Configurable)

| Tier       | Example Models                                                | Credits/Generation |
| ---------- | ------------------------------------------------------------- | ------------------ |
| Cheater    | GPT-5.3, Opus-4.6                                             | ~15-20             |
| Easy       | Sonnet-4.5                                                    | ~10-12             |
| Normal     | GLM-4.7, Kimi-k2.5, Gemini-3-Pro-Preview                      | ~6-8               |
| Hard       | Deepseek-3.2, GPT-5.1-mini, Haiku-4.5, Gemini-3-Flash-Preview | ~3-5               |
| Impossible | Tiny models (<7B)                                             | ~1-2               |

_Exact costs set by admin to reflect actual provider pricing._

### Credit Purchase (Extra Credits)

Users can purchase additional credits at their plan's extra credit rate:

- Starter: $0.042/credit (min purchase: 25 credits / ~$1.05)
- Pro: $0.036/credit (min purchase: 50 credits / ~$1.80)
- Team: $0.030/credit (min purchase: 100 credits / ~$3.00)

_Pricing calculated dynamically based on plan's base cost and markup percentage (admin configurable)._

---

## API Key Management (BYOK Model)

### Storage & Encryption

```typescript
// Server-side encryption using environment KMS key
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET; // 32-byte key
const ALGORITHM = "aes-256-gcm";

export function encryptApiKey(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv,
  );

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decryptApiKey(
  encrypted: string,
  iv: string,
  tag: string,
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// tRPC procedure for storing keys
export const apiKeysRouter = router({
  addKey: protectedProcedure
    .input(
      z.object({
        provider: z.enum([
          "openai",
          "anthropic",
          "google",
          "openrouter",
          "deepseek",
          "glm",
          "moonshot",
          "custom",
        ]),
        apiKey: z.string().min(10),
        customEndpoint: z.string().url().optional(), // For OpenAI/Anthropic compatible APIs
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { encrypted, iv, tag } = encryptApiKey(input.apiKey);

      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        provider: input.provider,
        encryptedKey: `${encrypted}:${iv}:${tag}`,
        customEndpoint: input.customEndpoint,
        isActive: true,
      });

      return { success: true };
    }),
});
```

### AI SDK Integration (Multi-Provider)

```typescript
// Provider factory with custom URL support
// Multiple providers can use OpenAI or Anthropic compatible APIs via custom baseURL
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

function getProviderModel(
  modelKey: string,
  apiKey: string,
  customEndpoint?: string,
) {
  const modelConfig = await db.query.modelConfig.findFirst({
    where: eq(modelConfig.modelKey, modelKey),
  });

  if (!modelConfig || !modelConfig.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Model not available",
    });
  }

  switch (modelConfig.provider) {
    case "openai":
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint, // Supports custom OpenAI-compatible endpoints
      });

    case "anthropic":
      return anthropic(modelKey, {
        apiKey,
        baseURL: customEndpoint, // Supports custom Anthropic-compatible endpoints
      });

    case "google":
      return google(modelKey, { apiKey });

    case "openrouter":
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(modelKey);

    case "deepseek":
      // DeepSeek uses OpenAI-compatible API
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint || "https://api.deepseek.com/v1",
      });

    case "glm":
      // GLM/Zhipu uses OpenAI-compatible API
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint || "https://open.bigmodel.cn/api/paas/v4/",
      });

    case "moonshot":
      // Moonshot uses OpenAI-compatible API
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint || "https://api.moonshot.cn/v1",
      });

    case "custom":
      // Fully custom endpoint (user provides everything)
      // Can use OpenAI or Anthropic compatible APIs via baseURL
      if (!customEndpoint) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Custom provider requires endpoint URL",
        });
      }
      // Default to OpenAI-compatible for custom endpoints
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint,
      });

    default:
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown provider: ${modelConfig.provider}`,
      });
  }
}
```

---

## Scoring Weight Adjustability

### Database Schema for Dynamic Weights

```typescript
export const scoringWeights = pgTable("scoring_weights", {
  id: uuid("id").primaryKey().defaultRandom(),
  themeId: uuid("theme_id")
    .references(() => themes.id)
    .unique(),
  qualityWeight: decimal("quality_weight", { precision: 3, scale: 2 }).default(
    "0.40",
  ),
  difficultyWeight: decimal("difficulty_weight", {
    precision: 3,
    scale: 2,
  }).default("0.25"),
  efficiencyWeight: decimal("efficiency_weight", {
    precision: 3,
    scale: 2,
  }).default("0.20"),
  engagementWeight: decimal("engagement_weight", {
    precision: 3,
    scale: 2,
  }).default("0.10"),
  popularityWeight: decimal("popularity_weight", {
    precision: 3,
    scale: 2,
  }).default("0.05"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
});
```

### Admin Interface for Weight Tuning

```typescript
export const adminRouter = router({
  updateScoringWeights: adminProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
        weights: z
          .object({
            quality: z.number().min(0).max(1),
            difficulty: z.number().min(0).max(1),
            efficiency: z.number().min(0).max(1),
            engagement: z.number().min(0).max(1),
            popularity: z.number().min(0).max(1),
          })
          .refine(
            (w) =>
              Math.abs(
                w.quality +
                  w.difficulty +
                  w.efficiency +
                  w.engagement +
                  w.popularity -
                  1.0,
              ) < 0.01,
            { message: "Weights must sum to 1.0" },
          ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .insert(scoringWeights)
        .values({
          themeId: input.themeId,
          qualityWeight: input.weights.quality.toFixed(2),
          difficultyWeight: input.weights.difficulty.toFixed(2),
          efficiencyWeight: input.weights.efficiency.toFixed(2),
          engagementWeight: input.weights.engagement.toFixed(2),
          popularityWeight: input.weights.popularity.toFixed(2),
          updatedBy: ctx.user.id,
        })
        .onConflictDoUpdate({
          target: scoringWeights.themeId,
          set: {
            qualityWeight: input.weights.quality.toFixed(2),
            difficultyWeight: input.weights.difficulty.toFixed(2),
            efficiencyWeight: input.weights.efficiency.toFixed(2),
            engagementWeight: input.weights.engagement.toFixed(2),
            popularityWeight: input.weights.popularity.toFixed(2),
            updatedAt: new Date(),
            updatedBy: ctx.user.id,
          },
        });

      // Trigger score recalculation for theme
      await recalculateThemeScores(input.themeId);

      return { success: true };
    }),
});
```

---

## What Makes This Different

This isn't another "build games with AI" tool. It's a **competitive sport for prompt engineers** with:

- **Zero hand-holding**: One shot means one shot. No iteration mid-generation.
- **Real-time streaming**: Watch your code generate live with Shiki syntax highlighting.
- **Per-game leaderboards**: Every game has its own scoreboard with verified playtime/scores.
- **Secure SDK**: Token-authenticated, server-validated score reporting.
- **Difficulty as strategy**: Smaller models = higher multipliers. Risk/reward.
- **Radical transparency**: Public prompts become community learning resources.
- **Anti-gaming**: Brevity scoring prevents prompt dumping from other AIs.
- **Persistent legacy**: Every month's games live forever with frozen rankings.
- **Flexible access**: Credit-based plans OR bring your own API keys (100% free).
- **Configurable pricing**: Admin can adjust plan pricing, credits, and markups dynamically.
- **Admin control**: Comprehensive moderation + per-model pricing management.
- **Multi-provider support**: OpenAI, Anthropic, Google, OpenRouter, and many compatible APIs.

---

## Success Metrics (North Stars)

- **Engagement**: Average session length per game >5 min (launch) → >8 min (Month 6)
- **Quality**: % of entries rated ≥4 stars >40% (launch) → >55% (Month 6)
- **Virality**: Prompt runs : Original submissions >0.5:1 (launch) → >2:1 (Month 6)
- **Retention**: Month 1→2 participant return rate >35% (launch) → >50% (Month 6)
- **Innovation**: Model diversity (Shannon entropy) >2.5 (launch) → >3.0 (Month 6)
- **BYOK Adoption**: % of generations using BYOK >30% (Month 3)

---

## Future Enhancements (Post-MVP)

**Advanced Features:**

- **Team Competitions** (Q3 2026): Squad-based prompt engineering
- **Live Prompt Jams** (Q4 2026): 24-hour time-boxed events
- **Prompt Marketplace** (Q2 2027): Buy/sell proven templates
- **Model Leaderboards** (Q2 2027): Which AI is best at game generation?
- **API Access** (Q3 2026): Public REST/GraphQL for researchers

---

**This is the arena. The prompt is your weapon. The model is your handicap. The leaderboard is immortal. Welcome to Arcade Vibe.**
