import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type {
  User,
  UserExtended,
  GameListItem,
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
  promptRuns: number;
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
    queryKey: ["prompts-by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        return await trpcClient.prompts.listByUser.query({
          userId: user.id,
          includePrivate: isOwnProfile,
        });
      } catch (error) {
        console.error("Error fetching prompts:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { data: allGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["games-by-user", user?.id],
    queryFn: async (): Promise<GameListItem[]> => {
      if (!user?.id) return [];
      
      try {
        const result = await trpcClient.games.listByUser.query({
          userId: user.id,
          limit: 100,
          isSubmitted: true,
        });
        return result?.games ?? [];
      } catch (error) {
        console.error("Error fetching games:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const userGames = useMemo(() => {
    return allGames ?? [];
  }, [allGames]);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        return await trpcClient.leaderboard.getTop.query({
          limit: 100,
        });
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
  });

  const userGamesWithRankings = useMemo((): GameWithRanking[] => {
    if (!userGames) return [];
    
    const rankingMap = new Map<string, number>();
    if (leaderboard && leaderboard.entries) {
      leaderboard.entries.forEach((entry, index: number) => {
        if (entry.gameId) {
          rankingMap.set(entry.gameId, index + 1);
        }
      });
    }

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
    queryFn: async (): Promise<GameListItem[]> => {
      if (!user?.id) return [];

      try {
        const result = await trpcClient.games.listByUser.query({
          userId: user.id,
          limit: 100,
        });
        return result?.games ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
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
      promptRuns: promptRunsHistory?.length || 0,
    };
  }, [user, userGames, ratings, credits, prompts, userExtended, promptRunsHistory]);

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
