import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type {
  User,
  UserExtended,
  Game,
  GameWithRanking,
  Prompt,
  Rating,
  UserProfile,
} from "@/lib/trpc-types";

interface Stats {
  gamesCreated: number;
  totalRatings: number;
  reputation: number;
  credits: number;
  promptsCount: number;
}

export function useProfileData(username: string, isOwnProfile: boolean) {
  const userEmail = useMemo(() => {
    try {
      return decodeURIComponent(username);
    } catch {
      return username;
    }
  }, [username]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", username],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!username) return null;

      try {
        return await trpcClient.user.getByName.query({ name: username });
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    enabled: !!username,
  });

  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
    enabled: isOwnProfile,
  });

  const { data: userExtended } = useQuery({
    queryKey: ["user-extended", user?.id],
    queryFn: async () => {
      if (!isOwnProfile) return null;

      try {
        const result = await trpcClient.credits.getUserExtended.query();
        return result;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id && isOwnProfile,
  });

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const allPrompts = await trpcClient.prompts.listPublic.query();
      const userPrompts = allPrompts.filter(
        (prompt) => prompt.authorId === user.id,
      );
      return userPrompts;
    },
    enabled: !!user?.id,
  });

  const { data: allGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["games-all"],
    queryFn: async (): Promise<Game[]> => {
      try {
        const currentTheme = await trpcClient.themes.getCurrent.query();
        return await trpcClient.games.listByTheme.query({
          themeId: currentTheme.id,
          includeSubmitted: true,
          limit: 200,
        });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const userGames = useMemo(() => {
    if (!allGames || !user?.id) return [];
    return allGames.filter((game) => game.prompt.user?.id === user.id);
  }, [allGames, user?.id]);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        const currentTheme = await trpcClient.themes.getCurrent.query();
        return await trpcClient.leaderboard.getTop.query({
          themeId: currentTheme.id,
          limit: 200,
        });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const userGamesWithRankings = useMemo((): GameWithRanking[] => {
    if (!userGames || !leaderboard)
      return userGames.map((game) => ({ ...game, ranking: null }));

    const rankingMap = new Map<string, number>();
    const leaderboardArray = Array.isArray(leaderboard) ? leaderboard : [];
    leaderboardArray.forEach(
      (entry: { game?: { id: string } | null }, index: number) => {
        if (entry.game) {
          rankingMap.set(entry.game.id, index + 1);
        }
      },
    );

    return userGames.map((game) => ({
      ...game,
      ranking: rankingMap.get(game.id) ?? null,
    }));
  }, [userGames, leaderboard]);

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["ratings", user?.id],
    queryFn: async (): Promise<Rating[]> => {
      if (!user?.id) return [];
      return await trpcClient.ratings.getByUser.query({ userId: user.id });
    },
    enabled: !!user?.id,
  });

  const { data: promptRunsHistory, isLoading: promptRunsLoading } = useQuery({
    queryKey: ["prompt-runs-history", user?.id],
    queryFn: async (): Promise<Game[]> => {
      if (!user?.id) return [];
      if (!prompts || prompts.length === 0) return [];

      try {
        const currentTheme = await trpcClient.themes.getCurrent.query();
        const allGames = await trpcClient.games.listByTheme.query({
          themeId: currentTheme.id,
          includeSubmitted: true,
          limit: 200,
        });

        return allGames.filter((game) => {
          return game.prompt.user?.id === user.id;
        });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!prompts && prompts.length > 0,
  });

  const stats = useMemo((): Stats | null => {
    if (!user) return null;

    return {
      gamesCreated: userGames.length,
      totalRatings: ratings?.length || 0,
      reputation: userExtended?.reputation
        ? Number(userExtended.reputation)
        : 0,
      credits: credits?.balance || 0,
      promptsCount: prompts?.length || 0,
    };
  }, [user, userGames, ratings, credits, prompts, userExtended]);

  return {
    user,
    userExtended,
    prompts,
    userGames,
    userGamesWithRankings,
    ratings,
    promptRunsHistory,
    stats,
    isOwnProfile,
    userEmail,
    userLoading,
    promptsLoading,
    gamesLoading,
    ratingsLoading,
    promptRunsLoading,
  };
}
