"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { GamePlayer } from "@/components/game-player";
import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
  ArcadeDialogClose,
} from "@/components/arcade";
import { X, RefreshCw, Home, AlertCircle, ChevronLeft, ChevronRight, Clock, Eye, Share2, Flag, Trophy, Medal } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { RatingForm } from "@/components/game/rating-form";
import { ViewPromptDialog } from "@/components/game/view-prompt-dialog";
import { ReportDialog } from "@/components/game/report-dialog";
import LoadingState from "@/components/reusable/loading-state";
import { EmptyState } from "@/components/reusable";
import { ArcadeBadge } from "@/components/arcade";
import StarRatingDisplay from "@/components/reusable/star-rating-display";
import type { Rating } from "@/lib/trpc-types";

interface GamePlayPageProps {
  gameId: string;
}

export default function GamePlayPage({ gameId }: GamePlayPageProps) {
  const [playtime, setPlaytime] = useState(0);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const {
    data: game,
    isLoading: gameLoading,
    isError: gameError,
    refetch: refetchGame,
  } = useQuery({
    queryKey: ["game", gameId, retryCount],
    queryFn: async () => {
      return await trpcClient.games.getById.query({ id: gameId });
    },
    enabled: !!gameId,
    retry: 2,
  });

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const handleRefetch = useCallback(() => {
    void refetchGame();
  }, [refetchGame]);

  const { data: myRating } = useQuery({
    queryKey: ["my-rating", gameId, game?.promptId],
    queryFn: async () => {
      if (!game?.promptId) return null;
      return await trpcClient.ratings.getMyRating.query({
        gameId,
        promptId: game.promptId,
      });
    },
    enabled: !!game?.promptId,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["game-leaderboard", gameId],
    queryFn: async () => {
      return await trpcClient.gameLeaderboard.getLeaderboard.query({
        gameId,
        limit: 10,
      });
    },
    refetchInterval: 5000,
    enabled: !!gameId,
  });

  useEffect(() => {
    if (!isGameLoaded) return;

    const interval = setInterval(() => {
      setPlaytime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameLoaded]);

  const handleGameLoad = useCallback(() => {
    setIsGameLoaded(true);
  }, []);

  const handleGameError = useCallback((error: Error) => {
    toast.error(error.message || "Failed to load game");
  }, []);

  const reportMutation = useMutation({
    mutationFn: async ({
      reason,
      description,
    }: {
      reason: string;
      description: string;
    }) => {
      return await trpcClient.moderation.submitReport.mutate({
        targetType: "game",
        targetId: gameId,
        reason: reason as
          | "inappropriate"
          | "spam"
          | "malicious"
          | "copyright"
          | "harassment"
          | "other",
        description,
      });
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setShowReportDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit report");
    },
  });

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: game?.prompt?.content || "Play this game",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.error("Failed to share game");
    }
  }, [game]);

  const handleReportSubmit = useCallback(
    async (reason: string, description: string) => {
      await reportMutation.mutateAsync({ reason, description });
    },
    [reportMutation],
  );

  if (gameLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <LoadingState size="lg" message="Loading game..." centered />
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-6 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Failed to Load Game
            </h2>
            <p className="text-zinc-400 max-w-md">
              Something went wrong while loading the game. Please try again.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRefetch}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
            <Link href="/">
              <button type="button" className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                <Home className="size-4" />
                Go Back Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-6 text-center p-8">
          <EmptyState
            title="Game not found"
            message="The game you're looking for doesn't exist."
          />
          <Link href="/">
            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
              <Home className="size-4" />
              Go Back Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const canRate = playtime >= 60 && !myRating && isGameLoaded;
  const playtimeDisplay = `${Math.floor(playtime / 60)}:${(playtime % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 flex bg-[#0a0a0f] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
              <Home className="size-4" />
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-sm text-zinc-300 truncate max-w-[200px] sm:max-w-[400px]">
              {game.prompt?.content?.slice(0, 60)}
              {game.prompt?.content && game.prompt.content.length > 60 ? "..." : ""}
            </span>
            {game.theme?.title && (
              <ArcadeBadge text={game.theme.title} variant="default" className="hidden sm:flex text-xs" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="size-3.5" />
              <span className="font-mono">{playtimeDisplay}</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => setShowPromptDialog(true)}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="View Prompt"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Share"
              >
                <Share2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowReportDialog(true)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Report"
              >
                <Flag className="size-4" />
              </button>
              {canRate && (
                <button
                  type="button"
                  onClick={() => setShowRatingDialog(true)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors"
                >
                  <Trophy className="size-3.5" />
                  Rate
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 p-1">
          <GamePlayer
            gameUrl={`/api/games/${gameId}/play`}
            gameId={gameId}
            height="h-full"
            width="w-full"
            onLoad={handleGameLoad}
            onError={handleGameError}
            className="rounded-lg border border-zinc-800/50"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-50 w-6 h-16 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors rounded-l-md border-l border-y border-zinc-700"
        style={{ right: sidebarOpen ? '320px' : '0' }}
      >
        {sidebarOpen ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div
        className={`w-80 border-l border-zinc-800/50 bg-zinc-900/95 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-zinc-800/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="size-3.5 text-violet-400" />
              Rating Status
            </h3>
          </div>
          <div className="p-3">
            {myRating ? (
              <div className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg">
                <div className="text-lg font-bold text-violet-400">
                  {myRating.overall}/5
                </div>
                <StarRatingDisplay rating={myRating.overall} size="sm" />
              </div>
            ) : !isGameLoaded ? (
              <p className="text-xs text-zinc-500">Loading...</p>
            ) : playtime < 60 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="size-3.5" />
                  <span>Play {60 - playtime}s more to rate</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 transition-all"
                    style={{ width: `${(playtime / 60) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRatingDialog(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
              >
                <Trophy className="size-4" />
                Rate Game
              </button>
            )}
          </div>

          <div className="p-3 border-t border-b border-zinc-800/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Medal className="size-3.5 text-amber-400" />
              Leaderboard
            </h3>
          </div>
          <div className="p-2">
            {!leaderboard || leaderboard.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">
                No scores yet
              </p>
            ) : (
              <div className="space-y-1">
                {leaderboard.slice(0, 8).map((entry, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                        isTop3 ? "bg-amber-500/10" : "bg-zinc-800/30"
                      }`}
                    >
                      <div className="w-5 text-center flex-shrink-0">
                        {isTop3 ? (
                          <Medal
                            className={`size-4 ${
                              rank === 1
                                ? "text-amber-400"
                                : rank === 2
                                  ? "text-zinc-300"
                                  : "text-amber-700"
                            }`}
                          />
                        ) : (
                          <span className="text-xs text-zinc-500">{rank}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 truncate">
                          {entry.user?.name || "Anonymous"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-zinc-200">{entry.score}</p>
                        {entry.completionTime && (
                          <p className="text-[10px] text-zinc-500">
                            {Math.floor(entry.completionTime / 60)}:
                            {(entry.completionTime % 60).toString().padStart(2, "0")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ViewPromptDialog
        isOpen={showPromptDialog}
        onClose={() => setShowPromptDialog(false)}
        promptContent={game.prompt?.content || ""}
      />

      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onSubmit={handleReportSubmit}
        isSubmitting={reportMutation.isPending}
      />

      <ArcadeDialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <ArcadeDialogContent>
          <ArcadeDialogHeader>
            <ArcadeDialogTitle>Rate This Game</ArcadeDialogTitle>
            <ArcadeDialogDescription>
              Your feedback helps improve future games
            </ArcadeDialogDescription>
          </ArcadeDialogHeader>
          <ArcadeDialogClose aria-label="Close rating dialog">
            <X className="h-4 w-4" />
          </ArcadeDialogClose>
          <RatingForm
            gameId={gameId}
            promptId={game.promptId}
            playtime={playtime}
            onSuccess={() => setShowRatingDialog(false)}
          />
        </ArcadeDialogContent>
      </ArcadeDialog>
    </div>
  );
}