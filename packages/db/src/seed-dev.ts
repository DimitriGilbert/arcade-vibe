import { createHash, randomBytes, scryptSync } from "node:crypto";
import { resolve } from "node:path";

import { config } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";

import {
  allowedLibraryPatterns,
  creditBatches,
  creditTransactions,
  gameScores,
  games,
  modelConfig,
  modelProviders,
  platformStats,
  promptRuns,
  prompts,
  ratings,
  scores,
  scoringWeights,
  subscriptionPlans,
  themeAllowedPatterns,
  themes,
  tierCosts,
  account,
  user,
  userExtended,
} from "./schema";

config({ path: resolve(import.meta.dirname, "../../../apps/web/.env") });

const defaultLocalUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
if (!process.env.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL.startsWith("$")) {
  process.env.BETTER_AUTH_URL = defaultLocalUrl;
}
if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.startsWith("$")) {
  process.env.CORS_ORIGIN = defaultLocalUrl;
}

const SEEDED_USER_IDS = [
  "dev_user_admin",
  "dev_user_mod",
  "dev_user_alex",
  "dev_user_sam",
] as const;

const TIER_COSTS = [
  {
    slug: "cheater",
    name: "Cheater (Easiest)",
    creditCost: 21,
    description:
      "Uses the most capable models with full context - easiest to win",
    scoreMultiplier: 0.7,
    displayOrder: 1,
    colorClass: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    slug: "very_easy",
    name: "Very Easy",
    creditCost: 16,
    description: "Uses highly capable models - very easy to win",
    scoreMultiplier: 0.8,
    displayOrder: 2,
    colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    slug: "easy",
    name: "Easy",
    creditCost: 12,
    description: "Uses capable models with good context - easy to win",
    scoreMultiplier: 0.9,
    displayOrder: 3,
    colorClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    slug: "normal",
    name: "Normal",
    creditCost: 7,
    description: "Balanced difficulty with standard models",
    scoreMultiplier: 1.0,
    displayOrder: 4,
    colorClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  {
    slug: "hard",
    name: "Hard",
    creditCost: 5,
    description: "Uses constrained models - challenging to win",
    scoreMultiplier: 1.3,
    displayOrder: 5,
    colorClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    slug: "very_hard",
    name: "Very Hard",
    creditCost: 2,
    description: "Uses limited models - very challenging to win",
    scoreMultiplier: 1.75,
    displayOrder: 6,
    colorClass: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    slug: "impossible",
    name: "Impossible (Hardest)",
    creditCost: 1,
    description: "Uses minimal models - extremely difficult to win",
    scoreMultiplier: 2.2,
    displayOrder: 7,
    colorClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
] as const;

const MODEL_SEEDS = [
  {
    modelName: "openai/gpt-4.1-mini",
    tierSlug: "normal",
    provider: "openrouter" as const,
    costPer1kTokens: "0.0015",
    maxTokens: 16384,
    supportsImages: false,
  },
  {
    modelName: "anthropic/claude-3.5-sonnet",
    tierSlug: "hard",
    provider: "openrouter" as const,
    costPer1kTokens: "0.003",
    maxTokens: 8192,
    supportsImages: true,
  },
  {
    modelName: "google/gemini-2.0-flash-exp",
    tierSlug: "easy",
    provider: "openrouter" as const,
    costPer1kTokens: "0.001",
    maxTokens: 8192,
    supportsImages: true,
  },
] as const;

const THEME_SEEDS = [
  {
    title: "Free Play",
    description:
      "Create games without a specific theme. Let your creativity run wild!",
    status: "active" as const,
    visibility: "public" as const,
    startDate: new Date("2020-01-01T00:00:00Z"),
    endDate: new Date("2100-12-31T23:59:59Z"),
    requirements: [],
    systemPrompt:
      "Build a complete browser game from user prompts with mobile and keyboard controls.",
    isPermanent: true,
  },
  {
    title: "Cyber Sprint",
    description: "Fast-paced neon arcade challenge with velocity and precision.",
    status: "active" as const,
    visibility: "public" as const,
    startDate: new Date("2026-01-01T00:00:00Z"),
    endDate: new Date("2026-12-31T23:59:59Z"),
    requirements: ["Keyboard + touch controls", "Score system", "Responsive UI"],
    systemPrompt:
      "Generate a polished arcade game with score multipliers and fast gameplay loops.",
    isPermanent: false,
  },
  {
    title: "Puzzle Lab",
    description: "Logic-heavy puzzle experiences with clarity and progression.",
    status: "frozen" as const,
    visibility: "public_on_freeze" as const,
    startDate: new Date("2025-10-01T00:00:00Z"),
    endDate: new Date("2025-11-30T23:59:59Z"),
    requirements: ["At least 3 levels", "Clear win condition", "Accessible controls"],
    systemPrompt:
      "Generate a puzzle game with progressive difficulty and compact reusable code.",
    isPermanent: false,
  },
] as const;

const ADMIN_PASSWORD = "AdminDevPass123!";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const normalizedPassword = password.normalize("NFKC");
  const derivedKey = scryptSync(normalizedPassword, salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function seedDev(): Promise<void> {
  const { db } = await import("./index");

  console.log("Seeding dev data...");

  await db.transaction(async (tx) => {
    await tx.delete(user).where(inArray(user.id, [...SEEDED_USER_IDS]));

    const seededUsers = [
      {
        id: "dev_user_admin",
        name: "Dev Admin",
        email: "admin+dev@arcade-vibe.local",
        emailVerified: true,
        image: null,
        role: "admin" as const,
        credits: 5000,
      },
      {
        id: "dev_user_mod",
        name: "Dev Moderator",
        email: "moderator+dev@arcade-vibe.local",
        emailVerified: true,
        image: null,
        role: "moderator" as const,
        credits: 2500,
      },
      {
        id: "dev_user_alex",
        name: "Alex Arcade",
        email: "alex+dev@arcade-vibe.local",
        emailVerified: true,
        image: null,
        role: "participant" as const,
        credits: 1200,
      },
      {
        id: "dev_user_sam",
        name: "Sam Synth",
        email: "sam+dev@arcade-vibe.local",
        emailVerified: true,
        image: null,
        role: "participant" as const,
        credits: 900,
      },
    ] as const;

    for (const seededUser of seededUsers) {
      await tx.insert(user).values({
        id: seededUser.id,
        name: seededUser.name,
        email: seededUser.email,
        emailVerified: seededUser.emailVerified,
        image: seededUser.image,
      });
      await tx.insert(userExtended).values({
        id: seededUser.id,
        role: seededUser.role,
        reputation: seededUser.role === "participant" ? 120 : 300,
        credits: seededUser.credits,
        isSuspended: false,
      });

      await tx.insert(creditBatches).values({
        userId: seededUser.id,
        amount: seededUser.credits,
        remainingAmount: seededUser.credits,
        sourceType: "admin_grant",
        sourceId: `seed-${seededUser.id}`,
        expiresAt: new Date("2099-12-31T23:59:59Z"),
      });

      await tx.insert(creditTransactions).values({
        userId: seededUser.id,
        amount: seededUser.credits,
        type: "credit",
        description: "Initial dev seed credits",
      });

      if (seededUser.id === "dev_user_admin") {
        await tx.insert(account).values({
          id: "seed-account-dev-admin",
          accountId: seededUser.email,
          providerId: "credential",
          userId: seededUser.id,
          password: await hashPassword(ADMIN_PASSWORD),
        });
      }
    }

    for (const tier of TIER_COSTS) {
      await tx
        .insert(tierCosts)
        .values({
          slug: tier.slug,
          name: tier.name,
          creditCost: tier.creditCost,
          description: tier.description,
          scoreMultiplier: tier.scoreMultiplier,
          displayOrder: tier.displayOrder,
          colorClass: tier.colorClass,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: tierCosts.slug,
          set: {
            name: tier.name,
            creditCost: tier.creditCost,
            description: tier.description,
            scoreMultiplier: tier.scoreMultiplier,
            displayOrder: tier.displayOrder,
            colorClass: tier.colorClass,
            isActive: true,
          },
        });
    }

    const tierRows = await tx
      .select({
        id: tierCosts.id,
        slug: tierCosts.slug,
      })
      .from(tierCosts)
      .where(inArray(tierCosts.slug, TIER_COSTS.map((tier) => tier.slug)));

    const tierIdBySlug = new Map<string, string>(
      tierRows.map((row) => [row.slug, row.id]),
    );

    for (const theme of THEME_SEEDS) {
      await tx
        .insert(themes)
        .values({
          title: theme.title,
          description: theme.description,
          status: theme.status,
          visibility: theme.visibility,
          startDate: theme.startDate,
          endDate: theme.endDate,
          requirements: theme.requirements,
          systemPrompt: theme.systemPrompt,
          isPermanent: theme.isPermanent,
        })
        .onConflictDoUpdate({
          target: themes.title,
          set: {
            description: theme.description,
            status: theme.status,
            visibility: theme.visibility,
            startDate: theme.startDate,
            endDate: theme.endDate,
            requirements: theme.requirements,
            systemPrompt: theme.systemPrompt,
            isPermanent: theme.isPermanent,
          },
        });
    }

    const themeRows = await tx
      .select({
        id: themes.id,
        title: themes.title,
      })
      .from(themes)
      .where(inArray(themes.title, THEME_SEEDS.map((theme) => theme.title)));

    const themeIdByTitle = new Map<string, string>(
      themeRows.map((row) => [row.title, row.id]),
    );

    for (const model of MODEL_SEEDS) {
      const tierCostId = tierIdBySlug.get(model.tierSlug);
      if (!tierCostId) {
        throw new Error(`Missing tier cost for slug ${model.tierSlug}`);
      }

      const [upsertedModel] = await tx
        .insert(modelConfig)
        .values({
          modelName: model.modelName,
          tierCostId,
          costPer1kTokens: model.costPer1kTokens,
          maxTokens: model.maxTokens,
          supportsImages: model.supportsImages,
          isActive: true,
          modelCreatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: modelConfig.modelName,
          set: {
            tierCostId,
            costPer1kTokens: model.costPer1kTokens,
            maxTokens: model.maxTokens,
            supportsImages: model.supportsImages,
            isActive: true,
          },
        })
        .returning({ id: modelConfig.id });

      if (!upsertedModel) {
        throw new Error(`Failed to upsert model ${model.modelName}`);
      }

      await tx
        .insert(modelProviders)
        .values({
          modelConfigId: upsertedModel.id,
          provider: model.provider,
        })
        .onConflictDoNothing();
    }

    const freeThemeId = themeIdByTitle.get("Free Play");
    const cyberThemeId = themeIdByTitle.get("Cyber Sprint");
    const puzzleThemeId = themeIdByTitle.get("Puzzle Lab");
    const normalTierId = tierIdBySlug.get("normal");
    const hardTierId = tierIdBySlug.get("hard");

    if (!freeThemeId || !cyberThemeId || !puzzleThemeId) {
      throw new Error("Missing seeded themes after upsert");
    }
    if (!normalTierId || !hardTierId) {
      throw new Error("Missing required tier costs after upsert");
    }

    const promptSeeds = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        authorId: "dev_user_alex",
        themeId: cyberThemeId,
        content:
          "Build a high-speed neon runner where the player dodges obstacles and chains combo pickups.",
        tokenCount: 42,
        tokenizer: "cl100k_base",
        visibility: "public" as const,
        status: "submitted" as const,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        authorId: "dev_user_sam",
        themeId: freeThemeId,
        content:
          "Create a cozy pixel aquarium clicker with smooth upgrades, ambient effects, and touch support.",
        tokenCount: 38,
        tokenizer: "cl100k_base",
        visibility: "public" as const,
        status: "submitted" as const,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        authorId: "dev_user_alex",
        themeId: puzzleThemeId,
        content:
          "Generate a grid-based puzzle game with movable mirrors and laser beams.",
        tokenCount: 31,
        tokenizer: "cl100k_base",
        visibility: "private" as const,
        status: "draft" as const,
      },
    ] as const;

    for (const prompt of promptSeeds) {
      await tx
        .insert(prompts)
        .values({
          id: prompt.id,
          authorId: prompt.authorId,
          themeId: prompt.themeId,
          content: prompt.content,
          contentHash: sha256(prompt.content),
          tokenCount: prompt.tokenCount,
          tokenizer: prompt.tokenizer,
          version: 1,
          visibility: prompt.visibility,
          status: prompt.status,
        })
        .onConflictDoUpdate({
          target: prompts.id,
          set: {
            authorId: prompt.authorId,
            themeId: prompt.themeId,
            content: prompt.content,
            contentHash: sha256(prompt.content),
            tokenCount: prompt.tokenCount,
            tokenizer: prompt.tokenizer,
            visibility: prompt.visibility,
            status: prompt.status,
          },
        });
    }

    const gameSeeds = [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Neon Sprint",
        promptId: "11111111-1111-4111-8111-111111111111",
        themeId: cyberThemeId,
        tierCostId: hardTierId,
        modelProvider: "openrouter",
        modelName: "anthropic/claude-3.5-sonnet",
        tokenUsage: 1540,
        inputTokens: 930,
        outputTokens: 610,
        requestCostUsd: "0.0087",
        gameData:
          "<!doctype html><html><body><h1>Neon Sprint</h1><p>Seeded dev game.</p></body></html>",
      },
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Aquarium Tycoon",
        promptId: "22222222-2222-4222-8222-222222222222",
        themeId: freeThemeId,
        tierCostId: normalTierId,
        modelProvider: "openrouter",
        modelName: "openai/gpt-4.1-mini",
        tokenUsage: 1090,
        inputTokens: 640,
        outputTokens: 450,
        requestCostUsd: "0.0042",
        gameData:
          "<!doctype html><html><body><h1>Aquarium Tycoon</h1><p>Seeded dev game.</p></body></html>",
      },
    ] as const;

    for (const game of gameSeeds) {
      await tx
        .insert(games)
        .values({
          id: game.id,
          name: game.name,
          promptId: game.promptId,
          themeId: game.themeId,
          status: "completed",
          modelProvider: game.modelProvider,
          modelName: game.modelName,
          tierCostId: game.tierCostId,
          tokenUsage: game.tokenUsage,
          inputTokens: game.inputTokens,
          outputTokens: game.outputTokens,
          requestCostUsd: game.requestCostUsd,
          gameData: game.gameData,
          generatedAt: new Date(),
          isSubmitted: true,
          submittedAt: new Date(),
          sanitizationApplied: true,
          blockedScriptUrls: [],
          mediaUrls: {
            cover: "https://picsum.photos/seed/arcade-vibe/1024/768",
          },
        })
        .onConflictDoUpdate({
          target: games.id,
          set: {
            name: game.name,
            promptId: game.promptId,
            themeId: game.themeId,
            status: "completed",
            modelProvider: game.modelProvider,
            modelName: game.modelName,
            tierCostId: game.tierCostId,
            tokenUsage: game.tokenUsage,
            inputTokens: game.inputTokens,
            outputTokens: game.outputTokens,
            requestCostUsd: game.requestCostUsd,
            gameData: game.gameData,
            generatedAt: new Date(),
            isSubmitted: true,
            submittedAt: new Date(),
            sanitizationApplied: true,
            blockedScriptUrls: [],
            mediaUrls: {
              cover: "https://picsum.photos/seed/arcade-vibe/1024/768",
            },
          },
        });
    }

    const promptRunSeeds = [
      {
        id: "44444444-4444-4444-8444-444444444444",
        promptId: "11111111-1111-4111-8111-111111111111",
        gameId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        inputTokens: 930,
        outputTokens: 610,
        cost: "0.0087",
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        promptId: "22222222-2222-4222-8222-222222222222",
        gameId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        inputTokens: 640,
        outputTokens: 450,
        cost: "0.0042",
      },
    ] as const;

    for (const promptRun of promptRunSeeds) {
      await tx
        .insert(promptRuns)
        .values(promptRun)
        .onConflictDoUpdate({
          target: promptRuns.id,
          set: {
            inputTokens: promptRun.inputTokens,
            outputTokens: promptRun.outputTokens,
            cost: promptRun.cost,
          },
        });
    }

    const ratingSeeds = [
      {
        id: "66666666-6666-4666-8666-666666666666",
        promptId: "11111111-1111-4111-8111-111111111111",
        gameId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        themeId: cyberThemeId,
        userId: "dev_user_sam",
        promptQuality: 5,
        gameQuality: 4,
        themeRelevance: 5,
        overall: 5,
        feedback: "Great pacing and clear controls.",
      },
      {
        id: "77777777-7777-4777-8777-777777777777",
        promptId: "22222222-2222-4222-8222-222222222222",
        gameId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        themeId: freeThemeId,
        userId: "dev_user_alex",
        promptQuality: 4,
        gameQuality: 4,
        themeRelevance: 4,
        overall: 4,
        feedback: "Relaxing game feel and good visual polish.",
      },
    ] as const;

    for (const rating of ratingSeeds) {
      await tx
        .insert(ratings)
        .values(rating)
        .onConflictDoUpdate({
          target: ratings.id,
          set: {
            promptQuality: rating.promptQuality,
            gameQuality: rating.gameQuality,
            themeRelevance: rating.themeRelevance,
            overall: rating.overall,
            feedback: rating.feedback,
            themeId: rating.themeId,
          },
        });
    }

    const gameScoreSeeds = [
      {
        id: "88888888-8888-4888-8888-888888888888",
        gameId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        userId: "dev_user_alex",
        sessionId: "seed-session-neon-sprint",
        score: 28450,
        isHighScore: true,
        completionTime: 198,
      },
      {
        id: "99999999-9999-4999-8999-999999999999",
        gameId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        userId: "dev_user_sam",
        sessionId: "seed-session-aquarium-tycoon",
        score: 17200,
        isHighScore: true,
        completionTime: 255,
      },
    ] as const;

    for (const gameScore of gameScoreSeeds) {
      await tx
        .insert(gameScores)
        .values(gameScore)
        .onConflictDoUpdate({
          target: gameScores.id,
          set: {
            score: gameScore.score,
            isHighScore: gameScore.isHighScore,
            completionTime: gameScore.completionTime,
          },
        });
    }

    const scoreSeeds = [
      {
        id: "12121212-1212-4212-8212-121212121212",
        userId: "dev_user_alex",
        promptId: "11111111-1111-4111-8111-111111111111",
        gameId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        themeId: cyberThemeId,
        score: 28450,
        completionTime: 198,
        qualityScore: "0.8600",
        engagementScore: "0.7900",
        playersScore: "0.8400",
        playsScore: "0.7600",
        replayScore: "0.6800",
        efficiencyScore: "0.8200",
        tierFactor: "1.0200",
        inputTokens: 850,
        finalScore: "4120.5000",
      },
      {
        id: "13131313-1313-4313-8313-131313131313",
        userId: "dev_user_sam",
        promptId: "22222222-2222-4222-8222-222222222222",
        gameId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        themeId: freeThemeId,
        score: 17200,
        completionTime: 255,
        qualityScore: "0.7200",
        engagementScore: "0.6600",
        playersScore: "0.5400",
        playsScore: "0.5800",
        replayScore: "0.4300",
        efficiencyScore: "0.7400",
        tierFactor: "1.0000",
        inputTokens: 1200,
        finalScore: "2865.0000",
      },
    ] as const;

    for (const scoreRow of scoreSeeds) {
      await tx
        .insert(scores)
        .values(scoreRow)
        .onConflictDoUpdate({
          target: scores.id,
          set: {
            userId: scoreRow.userId,
            promptId: scoreRow.promptId,
            gameId: scoreRow.gameId,
            themeId: scoreRow.themeId,
            score: scoreRow.score,
            completionTime: scoreRow.completionTime,
            qualityScore: scoreRow.qualityScore,
            engagementScore: scoreRow.engagementScore,
            playersScore: scoreRow.playersScore,
            playsScore: scoreRow.playsScore,
            replayScore: scoreRow.replayScore,
            efficiencyScore: scoreRow.efficiencyScore,
            tierFactor: scoreRow.tierFactor,
            inputTokens: scoreRow.inputTokens,
            finalScore: scoreRow.finalScore,
          },
        });
    }

    await tx
      .insert(subscriptionPlans)
      .values({
        name: "starter_monthly",
        displayName: "Starter",
        price: 999,
        credits: 300,
        features: [
          "300 monthly credits",
          "Access to standard models",
          "Community support",
        ],
        stripePriceId: null,
        isActive: true,
        isOneTime: false,
        isPopular: true,
        creditValidityDays: 30,
      })
      .onConflictDoUpdate({
        target: subscriptionPlans.name,
        set: {
          displayName: "Starter",
          price: 999,
          credits: 300,
          features: [
            "300 monthly credits",
            "Access to standard models",
            "Community support",
          ],
          isActive: true,
          isPopular: true,
          creditValidityDays: 30,
        },
      });

    await tx
      .insert(subscriptionPlans)
      .values({
        name: "pro_monthly",
        displayName: "Pro",
        price: 2499,
        credits: 1200,
        features: [
          "1200 monthly credits",
          "Priority model access",
          "Advanced analytics",
        ],
        stripePriceId: null,
        isActive: true,
        isOneTime: false,
        isPopular: false,
        creditValidityDays: 30,
      })
      .onConflictDoUpdate({
        target: subscriptionPlans.name,
        set: {
          displayName: "Pro",
          price: 2499,
          credits: 1200,
          features: [
            "1200 monthly credits",
            "Priority model access",
            "Advanced analytics",
          ],
          isActive: true,
          creditValidityDays: 30,
        },
      });

    const existingPattern = await tx.query.allowedLibraryPatterns.findFirst({
      where: and(
        eq(allowedLibraryPatterns.urlPattern, "^https://cdn\\.jsdelivr\\.net/.+"),
        eq(allowedLibraryPatterns.createdById, "dev_user_admin"),
      ),
    });

    const patternId = existingPattern
      ? existingPattern.id
      : (
          await tx
            .insert(allowedLibraryPatterns)
            .values({
              name: "jsDelivr CDN",
              description: "Trusted CDN for production JavaScript dependencies",
              urlPattern: "^https://cdn\\.jsdelivr\\.net/.+",
              category: "utility",
              isGlobal: true,
              status: "active",
              createdById: "dev_user_admin",
            })
            .returning({ id: allowedLibraryPatterns.id })
        )[0]?.id;

    if (patternId) {
      const existingThemePattern = await tx.query.themeAllowedPatterns.findFirst({
        where: and(
          eq(themeAllowedPatterns.themeId, cyberThemeId),
          eq(themeAllowedPatterns.patternId, patternId),
        ),
      });

      if (!existingThemePattern) {
        await tx.insert(themeAllowedPatterns).values({
          themeId: cyberThemeId,
          patternId,
        });
      }
    }

    const existingStats = await tx.query.platformStats.findFirst();
    if (!existingStats) {
      await tx.insert(platformStats).values({
        totalUsers: 4,
        activeUsers: 4,
        totalPrompts: 3,
        totalGames: 2,
        totalRatings: 2,
        averageRating: "4.50",
      });
    } else {
      await tx
        .update(platformStats)
        .set({
          totalUsers: 4,
          activeUsers: 4,
          totalPrompts: 3,
          totalGames: 2,
          totalRatings: 2,
          averageRating: "4.50",
          lastCalculatedAt: new Date(),
        })
        .where(eq(platformStats.id, existingStats.id));
    }

    await tx
      .insert(scoringWeights)
      .values({
        themeId: cyberThemeId,
        qualityWeight: "0.40",
        difficultyWeight: "0.25",
        efficiencyWeight: "0.20",
        engagementWeight: "0.10",
        popularityWeight: "0.05",
        isActive: true,
        createdBy: "dev_user_admin",
        updatedBy: "dev_user_admin",
      })
      .onConflictDoUpdate({
        target: scoringWeights.themeId,
        set: {
          qualityWeight: "0.40",
          difficultyWeight: "0.25",
          efficiencyWeight: "0.20",
          engagementWeight: "0.10",
          popularityWeight: "0.05",
          isActive: true,
          updatedBy: "dev_user_admin",
        },
      });
  });

  console.log("Dev seed complete.");
  console.log("Seeded users:");
  console.log("  - admin+dev@arcade-vibe.local (admin)");
  console.log(`    password: ${ADMIN_PASSWORD}`);
  console.log("  - moderator+dev@arcade-vibe.local (moderator)");
  console.log("  - alex+dev@arcade-vibe.local (participant)");
  console.log("  - sam+dev@arcade-vibe.local (participant)");
}

seedDev().catch((error: unknown) => {
  console.error("Dev seed failed:", error);
  process.exitCode = 1;
});
