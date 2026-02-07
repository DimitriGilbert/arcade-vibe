# PRD Chunk 2: AI Integration & Game System

**Source**: `prd-refined.md` lines 179-824, 2198-2427

---

## Prompt Submission & Streaming Generation (Lines 181-214)

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

---

## Arcade Vibe Game SDK (Lines 219-479)

### SDK Script (Lines 224-329)

```typescript
// arcade-vibe-sdk.js - Injected into every game iframe
(function () {
  "use strict";

  const SESSION_TOKEN = "__ARCADE_VIBE_SESSION_TOKEN__";
  const API_ENDPOINT = "__ARCADE_VIBE_API_ENDPOINT__";
  const GAME_ID = "__ARCADE_VIBE_GAME_ID__";

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
    }).catch(() => {});

    lastHeartbeat = Date.now();
  }, 5000);

  // Public API
  window.ArcadeVibe = {
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
        console.warn("[ArcadeVibe] Failed to submit score.");
      });
    },

    getPlaytime() {
      return Math.floor((Date.now() - sessionStart) / 1000);
    },

    isReady() {
      return SESSION_TOKEN !== "__ARCADE_VIBE_SESSION_TOKEN__";
    },
  };

  window.addEventListener("beforeunload", () => {
    isSessionActive = false;
    clearInterval(heartbeatInterval);

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
})();
```

---

## Game SDK Server Validation (Lines 378-478)

```typescript
export const gameSdkRouter = router({
  heartbeat: publicProcedure
    .input(z.object({
      gameId: z.string().uuid(),
      playtime: z.number().int().min(0),
      timestamp: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const token = ctx.headers.get('authorization')?.replace('Bearer ', '');
      const session = await verifyGameSessionToken(token);

      if (!session || session.gameId !== input.gameId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Server-side validation: playtime cannot exceed wall-clock time
      const wallClockElapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      const maxAllowedPlaytime = wallClockElapsed + 10; // 10s tolerance

      if (input.playtime > maxAllowedPlaytime) {
        await logSuspiciousActivity(session.userId, input.gameId, 'playtime_mismatch');
      }

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

      const wallClockElapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      const validatedPlaytime = Math.min(input.playtime, wallClockElapsed + 10);

      await db.insert(gameScores).values({
        gameId: input.gameId,
        sessionId: session.id,
        userId: session.userId,
        score: input.score,
        playtimeSeconds: validatedPlaytime,
        submittedAt: new Date()
      });

      await redis.del(`game_leaderboard:${input.gameId}`);

      await redis.xadd(`game_scores:${input.gameId}`, '*', {
        score: input.score.toString(),
        userId: session.userId
      });

      return { ok: true };
    }),
});

// Game session token creation
async function createGameSessionToken(userId: string, gameId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const startedAt = Date.now();

  await redis.hset(`game_session:${sessionId}`, {
    userId,
    gameId,
    startedAt,
    lastPlaytime: 0,
    lastHeartbeat: startedAt
  });
  await redis.expire(`game_session:${sessionId}`, 3600);

  const token = jwt.sign(
    { sessionId, userId, gameId, startedAt },
    process.env.GAME_SDK_SECRET,
    { expiresIn: '1h' }
  );

  return token;
}
```

---

## Game Template with SDK Injection (Lines 485-516)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
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

## Iframe Sandbox (Lines 519-525)

```html
<iframe 
  src="..." 
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer"
></iframe>
```

---

## Per-Game Leaderboard Router (Lines 566-651)

```typescript
export const gameLeaderboardRouter = router({
  getLeaderboard: publicProcedure
    .input(z.object({
      gameId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const cached = await redis.get(`game_leaderboard:${input.gameId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const leaderboard = await db.query.gameScores.findMany({
        where: eq(gameScores.gameId, input.gameId),
        orderBy: [desc(gameScores.score), asc(gameScores.submittedAt)],
        limit: input.limit,
        with: {
          user: { columns: { id: true, username: true } },
        },
      });

      await redis.setex(`game_leaderboard:${input.gameId}`, 60, JSON.stringify(leaderboard));
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

  subscribe: publicProcedure
    .input(z.object({ gameId: z.string().uuid() }))
    .subscription(async function* ({ input }) {
      let lastId = '$';

      while (true) {
        const results = await redis.xread(
          'BLOCK', 5000,
          'STREAMS', `game_scores:${input.gameId}`, lastId
        );

        if (results) {
          const [streamName, entries] = results[0];
          for (const [entryId, fields] of entries) {
            lastId = entryId;
          }

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

---

## Streaming Generation Router (Lines 666-770)

```typescript
export const generateRouter = router({
  streamGeneration: protectedProcedure
    .input(z.object({
      promptId: z.string().uuid(),
      modelKey: z.string(),
      apiKeyId: z.string().uuid().optional(),
    }))
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

      const apiKey = input.apiKeyId
        ? await getDecryptedUserKey(input.apiKeyId)
        : await getPlatformKey(input.modelKey);

      const game = await db
        .insert(games)
        .values({
          promptId: input.promptId,
          modelKey: input.modelKey,
          modelTier: getModelTier(input.modelKey),
          status: "generating",
        })
        .returning();

      const fullPrompt = `${prompt.theme.systemPrompt}\n\nUSER PROMPT:\n${prompt.content}`;

      const model = getProviderModel(input.modelKey, apiKey);
      const highlighter = await highlighterPromise;

      const result = streamText({
        model,
        prompt: fullPrompt,
        // NO maxTokens - let the model complete naturally
      });

      let fullCode = "";

      for await (const chunk of result.textStream) {
        fullCode += chunk;

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

---

## Theme Leaderboard with Real-Time (Lines 787-823)

```typescript
subscribe: publicProcedure
  .input(z.object({ themeId: z.string().uuid() }))
  .subscription(async function* ({ input, ctx }) {
    let lastId = '$';

    while (true) {
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

      const cached = await redis.get(`lb:${input.themeId}`);

      if (!cached) {
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

---

## Pricing & Credits System (Lines 2198-2245)

### Plans Table

| Plan        | Price  | Credits/Month | Extra Credit Cost |
|-------------|--------|---------------|-------------------|
| **Free**    | Free   | 20            | NA                |
| **Starter** | $8/mo  | 250           | $0.042/credit     |
| **Pro**     | $18/mo | 650           | $0.036/credit     |
| **Team**    | $35/mo | 1500          | $0.030/credit     |
| **BYOK**    | Free   | Unlimited*    | N/A               |

### Credit Costs Per Model (Lines 2225-2233)

| Tier       | Example Models                           | Credits/Generation |
|------------|------------------------------------------|-------------------|
| Cheater    | GPT-5.3, Opus-4.6                        | ~15-20            |
| Easy       | Sonnet-4.5                               | ~10-12            |
| Normal     | GLM-4.7, Kimi-k2.5, Gemini-3-Pro-Preview | ~6-8              |
| Hard       | Deepseek-3.2, GPT-5.1-mini, Haiku-4.5    | ~3-5              |
| Impossible | Tiny models (<7B)                        | ~1-2              |

---

## API Key Encryption (Lines 2254-2301)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET;
const ALGORITHM = "aes-256-gcm";

export function encryptApiKey(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decryptApiKey(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

---

## AI Provider Factory (Lines 2348-2426)

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

function getProviderModel(modelKey: string, apiKey: string, customEndpoint?: string) {
  const modelConfig = await db.query.modelConfig.findFirst({
    where: eq(modelConfig.modelKey, modelKey),
  });

  if (!modelConfig || !modelConfig.isActive) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Model not available" });
  }

  switch (modelConfig.provider) {
    case "openai":
      return openai(modelKey, { apiKey, baseURL: customEndpoint });

    case "anthropic":
      return anthropic(modelKey, { apiKey, baseURL: customEndpoint });

    case "google":
      return google(modelKey, { apiKey });

    case "openrouter":
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(modelKey);

    case "deepseek":
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint || "https://api.deepseek.com/v1",
      });

    case "glm":
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint || "https://open.bigmodel.cn/api/paas/v4/",
      });

    case "moonshot":
      return openai(modelKey, {
        apiKey,
        baseURL: customEndpoint || "https://api.moonshot.cn/v1",
      });

    case "custom":
      if (!customEndpoint) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Custom provider requires endpoint URL" });
      }
      return openai(modelKey, { apiKey, baseURL: customEndpoint });

    default:
      throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown provider: ${modelConfig.provider}` });
  }
}
```
