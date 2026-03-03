import { db } from "@arcade-vibe/db";
import { user } from "@arcade-vibe/db/schema/auth";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { games } from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { scores } from "@arcade-vibe/db/schema/scores";
import { eq, and, desc, isNull, sql, inArray } from "drizzle-orm";
import type { GameWithRanking, Prompt, Rating, UserProfile } from "./trpc-types";

export interface ProfileStats {
  gamesCreated: number;
  totalRatings: number;
  reputation: number;
  credits: number;
  promptsCount: number;
  promptRuns: number;
}

export interface ProfileData {
  user: UserProfile | null;
  prompts: Prompt[];
  gamesWithRankings: GameWithRanking[];
  ratings: Rating[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

function serializeDate(date: Date): string {
  return date.toISOString();
}

function serializeUser(raw: {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}): UserProfile {
  return {
    id: raw.id,
    name: raw.name ?? "",
    image: raw.image,
    createdAt: serializeDate(raw.createdAt),
  };
}

function serializePrompt(raw: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  visibility: "private" | "public_on_freeze" | "public";
  version: number;
  status: "draft" | "submitted" | "disqualified";
  authorId: string;
  themeId: string;
  content: string;
  contentHash: string;
  tokenCount: number;
  tokenizer: string;
  parentId: string | null;
  relationType: string;
  hiddenAt: Date | null;
  hiddenBy: string | null;
  hiddenReason: string | null;
}): Prompt {
  return {
    ...raw,
    relationType: raw.relationType as "version" | "fork",
    createdAt: serializeDate(raw.createdAt),
    updatedAt: serializeDate(raw.updatedAt),
    hiddenAt: raw.hiddenAt ? serializeDate(raw.hiddenAt) : null,
  } as Prompt;
}

function serializeRating(raw: {
  id: string;
  createdAt: Date;
  userId: string;
  gameId: string;
  promptId: string;
  themeId: string | null;
  overall: number;
  promptQuality: number | null;
  gameQuality: number | null;
  themeRelevance: number | null;
  feedback: string | null;
  user: { id: string; name: string | null };
  game: { id: string; name: string | null; status: string; imageUrl: string | null };
}): Rating {
  return {
    ...raw,
    createdAt: serializeDate(raw.createdAt),
  } as Rating;
}

function serializeGameWithRanking(raw: {
  id: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  modelName: string;
  modelProvider: string;
  tierCostId: string;
  themeId: string | null;
  promptId: string;
  tokenUsage: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  cachedInputTokens: number | null;
  requestCostUsd: string | null;
  generatedAt: Date | null;
  isSubmitted: boolean;
  submittedAt: Date | null;
  isHidden: boolean;
  hiddenReason: string | null;
  hiddenAt: Date | null;
  sanitizationApplied: boolean;
  deletedAt: Date | null;
  prompt: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    visibility: "private" | "public_on_freeze" | "public";
    version: number;
    status: "draft" | "submitted" | "disqualified";
    authorId: string;
    themeId: string;
    content: string;
    contentHash: string;
    tokenCount: number;
    tokenizer: string;
    parentId: string | null;
    relationType: string;
    hiddenAt: Date | null;
    hiddenBy: string | null;
    hiddenReason: string | null;
    user: { id: string; name: string | null; image: string | null };
  };
  theme: { id: string; title: string | null } | null;
  tierCost?: { slug: string } | null;
}, ranking: number | null): GameWithRanking {
  return {
    ...raw,
    createdAt: serializeDate(raw.createdAt),
    updatedAt: serializeDate(raw.updatedAt),
    submittedAt: raw.submittedAt ? serializeDate(raw.submittedAt) : null,
    hiddenAt: raw.hiddenAt ? serializeDate(raw.hiddenAt) : null,
    deletedAt: raw.deletedAt ? serializeDate(raw.deletedAt) : null,
    prompt: {
      ...raw.prompt,
      createdAt: serializeDate(raw.prompt.createdAt),
      updatedAt: serializeDate(raw.prompt.updatedAt),
      hiddenAt: raw.prompt.hiddenAt ? serializeDate(raw.prompt.hiddenAt) : null,
    },
    ranking,
    tierCost: raw.tierCost ?? null,
    modelName: raw.modelName,
  } as GameWithRanking;
}

export async function getProfileUser(username: string): Promise<UserProfile | null> {
  const decodedUsername = (() => {
    try {
      return decodeURIComponent(username);
    } catch {
      return username;
    }
  })();

  const result = await db.query.user.findFirst({
    where: eq(user.name, decodedUsername),
    columns: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
    },
  });

  return result ? serializeUser(result) : null;
}

export async function getUserPrompts(userId: string, includePrivate: boolean): Promise<Prompt[]> {
  const conditions = [eq(prompts.authorId, userId)];

  if (!includePrivate) {
    conditions.push(eq(prompts.visibility, "public"));
  }

  const results = await db.query.prompts.findMany({
    where: and(...conditions),
    orderBy: [desc(prompts.createdAt)],
    limit: 100,
  });

  return results.map(serializePrompt);
}

export async function getUserGames(userId: string): Promise<{
  id: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  modelName: string;
  modelProvider: string;
  tierCostId: string;
  themeId: string | null;
  promptId: string;
  tokenUsage: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  cachedInputTokens: number | null;
  requestCostUsd: string | null;
  generatedAt: Date | null;
  isSubmitted: boolean;
  submittedAt: Date | null;
  isHidden: boolean;
  hiddenReason: string | null;
  hiddenAt: Date | null;
  sanitizationApplied: boolean;
  deletedAt: Date | null;
  prompt: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    visibility: "private" | "public_on_freeze" | "public";
    version: number;
    status: "draft" | "submitted" | "disqualified";
    authorId: string;
    themeId: string;
    content: string;
    contentHash: string;
    tokenCount: number;
    tokenizer: string;
    parentId: string | null;
    relationType: string;
    hiddenAt: Date | null;
    hiddenBy: string | null;
    hiddenReason: string | null;
    user: { id: string; name: string | null; image: string | null };
  };
  theme: { id: string; title: string | null } | null;
  tierCost: { slug: string } | null;
}[]> {
  const userPromptsList = await db.query.prompts.findMany({
    where: eq(prompts.authorId, userId),
    columns: { id: true },
  });

  const promptIds = userPromptsList.map((p) => p.id);

  if (promptIds.length === 0) {
    return [];
  }

  return db.query.games.findMany({
    where: and(
      inArray(games.promptId, promptIds),
      eq(games.isHidden, false),
      isNull(games.deletedAt),
      eq(games.isSubmitted, true)
    ),
    columns: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      modelName: true,
      modelProvider: true,
      tierCostId: true,
      themeId: true,
      promptId: true,
      tokenUsage: true,
      inputTokens: true,
      outputTokens: true,
      reasoningTokens: true,
      cachedInputTokens: true,
      requestCostUsd: true,
      generatedAt: true,
      isSubmitted: true,
      submittedAt: true,
      isHidden: true,
      hiddenReason: true,
      hiddenAt: true,
      sanitizationApplied: true,
      deletedAt: true,
    },
    orderBy: [desc(games.createdAt)],
    limit: 100,
    with: {
      prompt: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      theme: {
        columns: {
          id: true,
          title: true,
        },
      },
      tierCost: {
        columns: {
          slug: true,
        },
      },
    },
  }) as Promise<{
    id: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    modelName: string;
    modelProvider: string;
    tierCostId: string;
    themeId: string | null;
    promptId: string;
    tokenUsage: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    reasoningTokens: number | null;
    cachedInputTokens: number | null;
    requestCostUsd: string | null;
    generatedAt: Date | null;
    isSubmitted: boolean;
    submittedAt: Date | null;
    isHidden: boolean;
    hiddenReason: string | null;
    hiddenAt: Date | null;
    sanitizationApplied: boolean;
    deletedAt: Date | null;
    prompt: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      visibility: "private" | "public_on_freeze" | "public";
      version: number;
      status: "draft" | "submitted" | "disqualified";
      authorId: string;
      themeId: string;
      content: string;
      contentHash: string;
      tokenCount: number;
      tokenizer: string;
      parentId: string | null;
      relationType: string;
      hiddenAt: Date | null;
      hiddenBy: string | null;
      hiddenReason: string | null;
      user: { id: string; name: string | null; image: string | null };
    };
    theme: { id: string; title: string | null } | null;
    tierCost: { slug: string } | null;
  }[]>;
}

export async function getUserRatings(userId: string): Promise<Rating[]> {
  const results = await db.query.ratings.findMany({
    where: eq(ratings.userId, userId),
    with: {
      game: {
        columns: {
          id: true,
          name: true,
          status: true,
          imageUrl: true,
        },
      },
      user: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [desc(ratings.createdAt)],
  });

  return results.map(serializeRating);
}

export async function getUserExtendedData(userId: string): Promise<{
  reputation: number;
  credits: number;
} | null> {
  const extended = await db.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: {
      reputation: true,
      credits: true,
    },
  });

  if (!extended) return null;

  return {
    reputation: Number(extended.reputation),
    credits: extended.credits,
  };
}

export async function getLeaderboardRankings(): Promise<Map<string, number>> {
  const leaderboardData = await db
    .select({
      gameId: games.id,
    })
    .from(games)
    .innerJoin(prompts, eq(games.promptId, prompts.id))
    .leftJoin(scores, eq(games.id, scores.gameId))
    .where(
      and(
        isNull(games.deletedAt),
        eq(games.isHidden, false),
        eq(games.status, "completed"),
        eq(games.isSubmitted, true)
      )
    )
    .orderBy(desc(sql`COALESCE(${scores.finalScore}::numeric, 0)`), desc(games.createdAt))
    .limit(200);

  const rankingMap = new Map<string, number>();
  leaderboardData.forEach((entry, index) => {
    rankingMap.set(entry.gameId, index + 1);
  });

  return rankingMap;
}

export async function getProfileData(
  username: string,
  currentUserId: string | null
): Promise<ProfileData> {
  const profileUser = await getProfileUser(username);

  if (!profileUser) {
    return {
      user: null,
      prompts: [],
      gamesWithRankings: [],
      ratings: [],
      stats: null,
      isOwnProfile: false,
    };
  }

  const isOwnProfile = currentUserId === profileUser.id;

  const [userPrompts, userGames, userRatings, userExtendedData, leaderboardRankings] =
    await Promise.all([
      getUserPrompts(profileUser.id, isOwnProfile),
      getUserGames(profileUser.id),
      getUserRatings(profileUser.id),
      isOwnProfile ? getUserExtendedData(profileUser.id) : null,
      getLeaderboardRankings(),
    ]);

  const gamesWithRankings: GameWithRanking[] = userGames.map((game) =>
    serializeGameWithRanking(game, leaderboardRankings.get(game.id) ?? null)
  );

  const stats: ProfileStats = {
    gamesCreated: userGames.length,
    totalRatings: userRatings.length,
    reputation: userExtendedData?.reputation ?? 0,
    credits: userExtendedData?.credits ?? 0,
    promptsCount: userPrompts.length,
    promptRuns: userGames.length,
  };

  return {
    user: profileUser,
    prompts: userPrompts,
    gamesWithRankings,
    ratings: userRatings,
    stats,
    isOwnProfile,
  };
}
