"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Gamepad2, Clock, TrendingUp, Star } from "lucide-react";
import { ThemeHeader } from "./components/theme-header";
import { GameCard } from "./components/game-card";

type SortOption = "recent" | "popular" | "score";
type ThemeStatus = "current" | "archived";

interface Theme {
  id: string;
  title: string;
  description: string;
  status: "upcoming" | "active" | "frozen" | "archived";
  visibility: "private" | "public_on_freeze" | "public";
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Game {
  id: string;
  promptId: string;
  themeId: string | null;
  status: "generating" | "completed" | "failed" | "hidden";
  modelProvider: string;
  modelName: string;
  modelTier: "cheater" | "easy" | "normal" | "hard" | "impossible";
  imageUrl: string | null;
  generatedAt: string | null;
  isHidden: boolean;
  isSubmitted: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function ArcadePage() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("current");
  const [themeStatus, setThemeStatus] = useState<ThemeStatus>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  // Fetch all themes
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: async (): Promise<Theme[]> => {
      return await trpcClient.themes.list.query();
    },
  });

  // Fetch games for the selected theme
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games", selectedThemeId, themeStatus],
    queryFn: async (): Promise<Game[]> => {
      if (!selectedThemeId || selectedThemeId === "current") {
        // Try to get current theme's games
        try {
          const currentTheme = await trpcClient.themes.getCurrent.query();
          return await trpcClient.games.listByTheme.query({
            themeId: currentTheme.id,
            includeSubmitted: true,
            limit: 100,
          });
        } catch {
          // If no current theme, return empty
          return [];
        }
      } else {
        // Get games for selected theme
        return await trpcClient.games.listByTheme.query({
          themeId: selectedThemeId,
          includeSubmitted: true,
          limit: 100,
        });
      }
    },
    enabled: !!themes,
  });

  // Filter games based on search query
  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (!searchQuery.trim()) return games;

    const query = searchQuery.toLowerCase();
    return games.filter((game) => {
      const creatorName = game.prompt.user.name?.toLowerCase() || "";
      const creatorEmail = game.prompt.user.email.toLowerCase();
      return (
        creatorName.includes(query) ||
        creatorEmail.includes(query)
      );
    });
  }, [games, searchQuery]);

  // Sort games based on sort option
  const sortedGames = useMemo(() => {
    const gamesToSort = [...filteredGames];

    switch (sortOption) {
      case "recent":
        return gamesToSort.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

      case "popular":
        // Sort by number of submissions or other popularity metrics
        // For now, use createdAt as a proxy for popularity (newer = more visible)
        return gamesToSort.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

      case "score": {
        // Sort by model tier (higher tier first) as a proxy for quality
        const tierOrder: Record<string, number> = {
          cheater: 5,
          impossible: 4,
          hard: 3,
          normal: 2,
          easy: 1,
        };
        return gamesToSort.sort((a, b) => {
          return tierOrder[b.modelTier] - tierOrder[a.modelTier];
        });
      }

      default:
        return gamesToSort;
    }
  }, [filteredGames, sortOption]);

  // Get current theme
  const currentTheme = useMemo(() => {
    if (!themes) return null;
    return themes.find((t) => t.status === "active");
  }, [themes]);

  // Get archived themes
  const archivedThemes = useMemo(() => {
    if (!themes) return [];
    return themes.filter((t) => t.status === "archived");
  }, [themes]);

  // Get selected theme object
  const selectedTheme = useMemo(() => {
    if (!themes) return null;
    if (selectedThemeId === "current") return currentTheme;
    return themes.find((t) => t.id === selectedThemeId);
  }, [themes, selectedThemeId, currentTheme]);

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    if (themeId === "current") {
      setThemeStatus("current");
    } else {
      setThemeStatus("archived");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Arcade
              </h1>
              <p className="text-muted-foreground">
                Discover and play AI-generated games
              </p>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <ThemeHeader
          currentTheme={currentTheme || null} //you stupid mother fucker !
          archivedThemes={archivedThemes}
          selectedThemeId={selectedThemeId}
          themeStatus={themeStatus}
          onThemeSelect={handleThemeSelect}
          onThemeStatusChange={setThemeStatus}
          isLoading={themesLoading}
        />

        {/* Filters and Search */}
        <Card className="mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <Button
                  variant={sortOption === "recent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOption("recent")}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Recent
                </Button>
                <Button
                  variant={sortOption === "popular" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOption("popular")}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Popular
                </Button>
                <Button
                  variant={sortOption === "score" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOption("score")}
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  Score
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Grid */}
        {gamesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Loading games...</p>
            </div>
          </div>
        ) : sortedGames.length === 0 ? (
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-20 text-center">
              <Gamepad2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Games Found</h3>
              <p className="text-muted-foreground">
                {selectedTheme
                  ? `No games available for ${selectedTheme.title}`
                  : "Select a theme to view available games"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => {
                  window.location.href = `/play?gameId=${game.id}`;
                }}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {sortedGames.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {sortedGames.length} {sortedGames.length === 1 ? "game" : "games"}
          </div>
        )}
      </div>
    </div>
  );
}
