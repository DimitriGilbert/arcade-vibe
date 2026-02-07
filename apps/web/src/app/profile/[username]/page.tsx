"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User as UserIcon, Gamepad2, Star, GitBranch } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "./components/stats-card";
import { PromptList } from "./components/prompt-list";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserExtended {
  id: string;
  role: string;
  reputation: string;
  credits: string;
  isSuspended: boolean;
  suspensionReason: string | null;
}

interface Game {
  id: string;
  promptId: string;
  themeId: string | null;
  status: string;
  modelProvider: string;
  modelName: string;
  modelTier: string;
  imageUrl: string | null;
  generatedAt: string | null;
  isHidden: boolean;
  isSubmitted: boolean;
  createdAt: string;
  prompt: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  theme: {
    id: string;
    title: string;
  } | null;
}

interface Rating {
  id: string;
  promptId: string;
  gameId: string;
  themeId: string | null;
  userId: string;
  promptQuality: number | null;
  gameQuality: number | null;
  themeRelevance: number | null;
  overall: number;
  feedback: string | null;
  createdAt: string;
}

interface GameWithRanking extends Game {
  ranking: number | null;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  promptId: string;
  gameId: string;
  themeId: string | null;
  score: number;
  isHighScore: boolean;
  completionTime: number | null;
  playedAt: string;
  game: {
    id: string;
    promptId: string;
    themeId: string | null;
    status: string;
    modelProvider: string;
    modelName: string;
    modelTier: string;
    imageUrl: string | null;
    generatedAt: string | null;
    isHidden: boolean;
    isSubmitted: boolean;
    createdAt: string;
    updatedAt: string;
    prompt: {
      id: string;
      content: string;
      authorId: string;
      themeId: string | null;
      createdAt: string;
      updatedAt: string;
      visibility: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    };
    theme: {
      id: string;
      title: string;
      description: string | null;
      systemPrompt: string;
      createdAt: string;
      updatedAt: string;
    } | null;
  } | null;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [username, setUsername] = React.useState<string>("");
  const [isOwnProfile, setIsOwnProfile] = React.useState<boolean>(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setUsername(resolvedParams.username);
    });
  }, [params]);

  // Decode username (it might be URL-encoded email)
  const userEmail = useMemo(() => {
    try {
      return decodeURIComponent(username);
    } catch {
      return username;
    }
  }, [username]);

  // Fetch user by email
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", userEmail],
    queryFn: async (): Promise<User | null> => {
      if (!userEmail) return null;

      // Try to fetch via auth API
      try {
        const response = await fetch("/api/auth/user?email=" + encodeURIComponent(userEmail), {
          credentials: "include",
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json() as User | null;
        return data;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    enabled: !!userEmail,
  });

  // Fetch user's credits and reputation
  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: () => trpcClient.credits.getBalance.query(),
  });

  // Check if viewing own profile
  useEffect(() => {
    const checkOwnProfile = async () => {
      if (!user?.id) return;

      try {
        const sessionResponse = await fetch("/api/auth/getSession", {
          credentials: "include",
        });

        if (sessionResponse.ok) {
          const session = await sessionResponse.json() as { user?: { id: string } } | null;
          const currentUserId = session?.user?.id;
          setIsOwnProfile(currentUserId === user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkOwnProfile();
  }, [user?.id]);

  // Fetch user's prompts
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const allPrompts = await trpcClient.prompts.listPublic.query();
      const userPrompts = allPrompts.filter((prompt) => prompt.authorId === user.id);
      return userPrompts;
    },
    enabled: !!user?.id,
  });

  // Fetch user extended data (for reputation) - only for own profile
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

  // Fetch all games and filter to user's games
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

  // Filter games to user's games (where they are the prompt author)
  const userGames = useMemo(() => {
    if (!allGames || !user?.id) return [];
    return allGames.filter((game) => game.prompt.user?.id === user.id);
  }, [allGames, user?.id]);

  // Fetch leaderboard to compute game rankings
  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      try {
        const currentTheme = await trpcClient.themes.getCurrent.query();
        const result = await trpcClient.leaderboard.getTop.query({
          themeId: currentTheme.id,
          limit: 200,
        });
        return result as LeaderboardEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Compute rankings for user's games
  const userGamesWithRankings = useMemo((): GameWithRanking[] => {
    if (!userGames || !leaderboard) return userGames.map((game) => ({ ...game, ranking: null }));

    const rankingMap = new Map<string, number>();
    leaderboard.forEach((entry: LeaderboardEntry, index: number) => {
      if (entry.game) {
        rankingMap.set(entry.game.id, index + 1);
      }
    });

    return userGames.map((game) => ({
      ...game,
      ranking: rankingMap.get(game.id) ?? null,
    }));
  }, [userGames, leaderboard]);

  // Fetch user's ratings
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["ratings", user?.id],
    queryFn: async (): Promise<Rating[]> => {
      if (!user?.id) return [];
      return await trpcClient.ratings.getByUser.query({ userId: user.id });
    },
    enabled: !!user?.id,
  });

  // Fetch prompt runs history (games generated using user's prompts)
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

  // Calculate stats
  const stats = useMemo(() => {
    if (!user) return null;

    return {
      gamesCreated: userGames.length,
      totalRatings: ratings?.length || 0,
      reputation: userExtended?.reputation ?? 0,
      credits: credits?.balance || 0,
      promptsCount: prompts?.length || 0,
    };
  }, [user, userGames, ratings, credits, prompts, userExtended]);

  if (userLoading || (!user && !userLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-20 text-center">
              <UserIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">User Not Found</h3>
              <p className="text-muted-foreground">
                The profile {userEmail} could not be found.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || user.email}
                className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            )}

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {user.name || user.email}
              </h1>
              <p className="text-muted-foreground mb-3">{user.email}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Member since {new Date(user.createdAt).getFullYear()}</Badge>
                {isOwnProfile && credits && (
                  <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                    {credits.balance} credits
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        {stats && (
          <StatsCard
            gamesCreated={stats.gamesCreated}
            totalRatings={stats.totalRatings}
            reputation={stats.reputation}
            isLoading={gamesLoading || ratingsLoading}
          />
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* User's Prompts */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-500" />
                  Prompts
                </CardTitle>
                <Badge variant="outline">{prompts?.length || 0}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {promptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : !prompts || prompts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No prompts created yet
                </div>
              ) : (
                <PromptList prompts={prompts} />
              )}
            </CardContent>
          </Card>

          {/* User's Games */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-purple-500" />
                  Games
                </CardTitle>
                <Badge variant="outline">{userGames.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {gamesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : userGames.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No games created yet
                </div>
              ) : (
                <div className="space-y-4">
                  {userGamesWithRankings.slice(0, 5).map((game) => {
                    const ranking = userGamesWithRankings.find((g) => g.id === game.id)?.ranking;
                    return (
                      <button
                        key={game.id}
                        type="button"
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors cursor-pointer text-left"
                        onClick={() => {
                          const target = `/play?gameId=${game.id}`;
                          window.location.href = target;
                        }}
                      >
                        {game.imageUrl ? (
                          <img
                            src={game.imageUrl}
                            alt={game.prompt.content.slice(0, 30)}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                            <Gamepad2 className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {game.prompt.content.slice(0, 50)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {game.theme?.title || "No theme"} • {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ranking && (
                            <Badge variant="outline" className="text-xs">
                              Rank #{ranking}
                            </Badge>
                          )}
                          <Badge variant={game.status === "completed" ? "default" : "secondary"}>
                            {game.status}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ratings History */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Ratings History
              </CardTitle>
              <Badge variant="outline">{ratings?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {ratingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : !ratings || ratings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ratings yet
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.slice(0, 10).map((rating) => (
                  <div
                    key={rating.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rating.overall
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Game ID: {rating.gameId}</p>
                      {rating.feedback && (
                        <p className="text-sm text-muted-foreground mt-1">{rating.feedback}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prompt Runs History */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-500" />
                Prompt Runs History
              </CardTitle>
              <Badge variant="outline">{promptRunsHistory?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {promptRunsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : !promptRunsHistory || promptRunsHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No prompt runs yet
              </div>
            ) : (
              <div className="space-y-4">
                {promptRunsHistory.slice(0, 10).map((game) => (
                  <div
                    key={game.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50"
                  >
                    {game.imageUrl ? (
                      <img
                        src={game.imageUrl}
                        alt={game.prompt.content.slice(0, 30)}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                        <Gamepad2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {game.prompt.content.slice(0, 60)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {game.theme?.title || "No theme"} • {new Date(game.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={game.status === "completed" ? "default" : "secondary"}>
                      {game.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
