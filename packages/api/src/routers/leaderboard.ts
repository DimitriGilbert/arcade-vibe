import { router, publicProcedure } from "../index";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { themes } from "@arcade-vibe/db/schema/themes";
import { user } from "@arcade-vibe/db/schema/auth";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { scores, scoreHistory } from "@arcade-vibe/db/schema/scores";
import { eq, desc, lt, and, isNull, sql } from "drizzle-orm";
import z from "zod";

type LeaderboardEntry = {
  gameId: string;
  gameName: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  isSubmitted: boolean;
  finalScore: string;
  calculatedAt: Date | null;
  modelProvider: string;
  modelName: string;
  tier: {
    slug: string;
    name: string;
  } | null;
  creator: {
    id: string;
    name: string | null;
  };
  theme: {
    id: string;
    title: string | null;
  } | null;
};

type PaginatedLeaderboardResult = {
  entries: LeaderboardEntry[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const leaderboardRouter = router({
  getTop: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }): Promise<PaginatedLeaderboardResult> => {
      const fetchLimit = input.limit + 1;

      const conditions = [
        isNull(games.deletedAt),
        eq(games.isHidden, false),
        eq(games.status, "completed"),
        eq(games.isSubmitted, true),
      ];

      if (input.themeId) {
        conditions.push(eq(games.themeId, input.themeId));
      }

      if (input.cursor) {
        conditions.push(lt(games.id, input.cursor));
      }

      const result = await db
        .select({
          gameId: games.id,
          gameName: games.name,
          createdAt: games.createdAt,
          submittedAt: games.submittedAt,
          isSubmitted: games.isSubmitted,
          finalScore: sql<string>`COALESCE(${scores.finalScore}, '0')`,
          calculatedAt: scores.calculatedAt,
          modelProvider: games.modelProvider,
          modelName: games.modelName,
          tierSlug: tierCosts.slug,
          tierName: tierCosts.name,
          creatorId: user.id,
          creatorName: user.name,
          themeId: themes.id,
          themeTitle: themes.title,
        })
        .from(games)
        .innerJoin(prompts, eq(games.promptId, prompts.id))
        .innerJoin(user, eq(prompts.authorId, user.id))
        .innerJoin(tierCosts, eq(games.tierCostId, tierCosts.id))
        .leftJoin(themes, eq(games.themeId, themes.id))
        .leftJoin(scores, eq(games.id, scores.gameId))
        .where(and(...conditions))
        .orderBy(desc(sql`COALESCE(${scores.finalScore}::numeric, 0)`), desc(games.createdAt))
        .limit(fetchLimit);

      const hasMore = result.length > input.limit;
      const rows = hasMore ? result.slice(0, input.limit) : result;
      const nextCursor = hasMore && rows.length > 0 
        ? rows[rows.length - 1]?.gameId ?? null 
        : null;

      const entries: LeaderboardEntry[] = rows.map((row) => ({
        gameId: row.gameId,
        gameName: row.gameName,
        createdAt: row.createdAt,
        submittedAt: row.submittedAt,
        isSubmitted: row.isSubmitted,
        finalScore: row.finalScore ?? "0",
        calculatedAt: row.calculatedAt,
        modelProvider: row.modelProvider,
        modelName: row.modelName,
        tier: row.tierSlug ? {
          slug: row.tierSlug,
          name: row.tierName,
        } : null,
        creator: {
          id: row.creatorId,
          name: row.creatorName,
        },
        theme: row.themeId ? {
          id: row.themeId,
          title: row.themeTitle,
        } : null,
      }));

      return {
        entries,
        nextCursor,
        hasMore,
      };
    }),

  getScoreHistory: publicProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const history = await db.query.scoreHistory.findMany({
        where: eq(scoreHistory.gameId, input.gameId),
        orderBy: desc(scoreHistory.calculatedAt),
        limit: input.limit,
      });

      return history.map((h) => ({
        id: h.id,
        previousScore: h.previousScore,
        newScore: h.newScore,
        previousComponents: h.previousComponents ? JSON.parse(h.previousComponents) : null,
        newComponents: h.newComponents ? JSON.parse(h.newComponents) : null,
        reason: h.reason,
        calculatedAt: h.calculatedAt,
      }));
    }),
});
