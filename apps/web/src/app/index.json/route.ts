import type { Route } from "next";

import { db } from "@arcade-vibe/db";
import { user } from "@arcade-vibe/db/schema/auth";
import { collectionGames, collections } from "@arcade-vibe/db/schema/collections";
import { games } from "@arcade-vibe/db/schema/games";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { themes } from "@arcade-vibe/db/schema/themes";
import { and, count, desc, eq, isNull } from "drizzle-orm";

import { getModelDetailRoute } from "@/lib/model-routes";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

const INDEX_LIMIT = 50;
const INDEX_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
} as const;

interface PublicIndexItem {
  id: string;
  type: "game" | "prompt" | "model" | "benchmark" | "collection" | "page";
  title: string;
  url: string;
  summary: string;
  language: "en";
  tags: string[];
  updatedAt?: string;
}

function truncateSummary(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    headers: INDEX_HEADERS,
  });
}

export async function GET(): Promise<Response> {
  const [gameRows, promptRows, modelRows, collectionRows] = await Promise.all([
    db
      .select({
        id: games.id,
        name: games.name,
        modelName: games.modelName,
        themeTitle: themes.title,
        creatorName: user.name,
        updatedAt: games.updatedAt,
      })
      .from(games)
      .innerJoin(prompts, eq(games.promptId, prompts.id))
      .innerJoin(user, eq(prompts.authorId, user.id))
      .leftJoin(themes, eq(games.themeId, themes.id))
      .where(
        and(
          eq(games.status, "completed"),
          eq(games.isSubmitted, true),
          eq(games.isHidden, false),
          isNull(games.deletedAt),
        ),
      )
      .orderBy(desc(games.updatedAt))
      .limit(INDEX_LIMIT),
    db
      .select({
        id: prompts.id,
        title: prompts.title,
        content: prompts.content,
        isBenchmark: prompts.isBenchmark,
        themeTitle: themes.title,
        creatorName: user.name,
        updatedAt: prompts.updatedAt,
      })
      .from(prompts)
      .innerJoin(user, eq(prompts.authorId, user.id))
      .leftJoin(themes, eq(prompts.themeId, themes.id))
      .where(and(eq(prompts.visibility, "public"), isNull(prompts.hiddenAt)))
      .orderBy(desc(prompts.updatedAt))
      .limit(INDEX_LIMIT),
    db.query.modelConfig.findMany({
      where: eq(modelConfig.isActive, true),
      columns: {
        id: true,
        modelName: true,
        updatedAt: true,
      },
      orderBy: [desc(modelConfig.updatedAt)],
      limit: INDEX_LIMIT,
    }),
    db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        creatorName: user.name,
        updatedAt: collections.updatedAt,
        gameCount: count(collectionGames.id),
      })
      .from(collections)
      .innerJoin(user, eq(collections.userId, user.id))
      .leftJoin(collectionGames, eq(collections.id, collectionGames.collectionId))
      .where(eq(collections.isPublic, true))
      .groupBy(collections.id, user.name)
      .orderBy(desc(collections.updatedAt))
      .limit(INDEX_LIMIT),
  ]);

  const staticPages: PublicIndexItem[] = [
    {
      id: "page:home",
      type: "page",
      title: "Arcade Vibe",
      url: toAbsoluteUrl("/" as Route),
      summary: "AI-powered game arcade for creating playable games from prompts, comparing models, and competing on leaderboards.",
      language: "en",
      tags: ["ai-games", "prompt-engineering", "leaderboards"],
    },
    {
      id: "page:games",
      type: "page",
      title: "Game Library",
      url: toAbsoluteUrl("/games" as Route),
      summary: "Browse published AI-generated games on Arcade Vibe.",
      language: "en",
      tags: ["games", "arcade"],
    },
    {
      id: "page:models",
      type: "page",
      title: "AI Model Leaderboard",
      url: toAbsoluteUrl("/models" as Route),
      summary: "Compare AI models by public games, ratings, and Arcade Vibe performance.",
      language: "en",
      tags: ["ai-models", "leaderboard"],
    },
    {
      id: "page:prompts",
      type: "page",
      title: "Prompt Library",
      url: toAbsoluteUrl("/prompts" as Route),
      summary: "Browse public prompts used to create AI-generated games.",
      language: "en",
      tags: ["prompts", "prompt-engineering"],
    },
    {
      id: "page:benchmarks",
      type: "page",
      title: "Benchmarks",
      url: toAbsoluteUrl("/benchmarks" as Route),
      summary: "Benchmark prompts comparing AI model performance across game generations.",
      language: "en",
      tags: ["benchmarks", "ai-models"],
    },
  ];

  const gameItems: PublicIndexItem[] = gameRows.map((game) => {
    const title = game.name ?? game.themeTitle ?? "Untitled Game";
    return {
      id: `game:${game.id}`,
      type: "game",
      title,
      url: toAbsoluteUrl(`/games/${game.id}` as Route),
      summary: truncateSummary(
        `${title} is a public Arcade Vibe game generated with ${game.modelName}${game.creatorName ? ` by ${game.creatorName}` : ""}${game.themeTitle ? ` for the ${game.themeTitle} theme` : ""}.`,
      ),
      language: "en",
      tags: ["game", "ai-generated-game", game.modelName],
      updatedAt: game.updatedAt.toISOString(),
    };
  });

  const promptItems: PublicIndexItem[] = promptRows.map((prompt) => ({
    id: `${prompt.isBenchmark ? "benchmark" : "prompt"}:${prompt.id}`,
    type: prompt.isBenchmark ? "benchmark" : "prompt",
    title: prompt.title ?? truncateSummary(prompt.content, 80),
    url: toAbsoluteUrl(
      (prompt.isBenchmark ? `/benchmarks/${prompt.id}` : `/prompts/${prompt.id}`) as Route,
    ),
    summary: truncateSummary(prompt.content),
    language: "en",
    tags: [
      prompt.isBenchmark ? "benchmark" : "prompt",
      "prompt-engineering",
      ...(prompt.themeTitle ? [prompt.themeTitle] : []),
    ],
    updatedAt: prompt.updatedAt.toISOString(),
  }));

  const modelItems: PublicIndexItem[] = modelRows.map((model) => ({
    id: `model:${model.id}`,
    type: "model",
    title: model.modelName,
    url: toAbsoluteUrl(getModelDetailRoute(model.modelName, model.id)),
    summary: `${model.modelName} is an active AI model tracked by Arcade Vibe for game generation and model comparison.`,
    language: "en",
    tags: ["ai-model", "model-comparison"],
    updatedAt: model.updatedAt.toISOString(),
  }));

  const collectionItems: PublicIndexItem[] = collectionRows.map((collection) => ({
    id: `collection:${collection.id}`,
    type: "collection",
    title: collection.name,
    url: toAbsoluteUrl(`/collections/${collection.id}` as Route),
    summary: truncateSummary(
      collection.description ??
        `Public Arcade Vibe collection with ${collection.gameCount} games${collection.creatorName ? ` by ${collection.creatorName}` : ""}.`,
    ),
    language: "en",
    tags: ["collection", "games"],
    updatedAt: collection.updatedAt.toISOString(),
  }));

  return jsonResponse({
    site: {
      name: "Arcade Vibe",
      url: getSiteUrl(),
      language: ["en"],
      description: "AI-powered game arcade for prompt-driven game creation and AI model comparison.",
    },
    updatedAt: new Date().toISOString(),
    cache: {
      maxAgeSeconds: 86400,
      note: "This index is generated at request time and cached by shared caches for one day.",
    },
    items: [
      ...staticPages,
      ...gameItems,
      ...promptItems,
      ...modelItems,
      ...collectionItems,
    ],
  });
}
