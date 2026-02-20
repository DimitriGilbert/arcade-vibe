"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ArcadeCard,
  ArcadeButton,
  ArcadeBadge,
} from "@/components/arcade";
import {
  X,
  RefreshCw,
  Home,
  AlertCircle,
  PanelRightOpen,
  PanelRightClose,
  Clock,
  Eye,
  Share2,
  Flag,
  Trophy,
  Medal,
  Zap,
  Download,
  XCircle,
} from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { RatingForm } from "@/components/game/rating-form";
import { ViewPromptDialog } from "@/components/game/view-prompt-dialog";
import { ReportDialog } from "@/components/game/report-dialog";
import LoadingState from "@/components/reusable/loading-state";
import { EmptyState } from "@/components/reusable";
import StarRatingDisplay from "@/components/reusable/star-rating-display";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface GamePlayPageProps {
  gameId: string;
}

export default function GamePlayPage({ gameId }: GamePlayPageProps) {
  const [playtime, setPlaytime] = useState(0);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { data: session } = authClient.useSession();

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

  const visibilityRef = useRef<boolean>(true);

  useEffect(() => {
    const handleVisibility = () => {
      visibilityRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const { data: leaderboard } = useQuery({
    queryKey: ["game-leaderboard", gameId],
    queryFn: async () => {
      return await trpcClient.gameLeaderboard.getLeaderboard.query({
        gameId,
        limit: 10,
      });
    },
    refetchInterval: () => (visibilityRef.current ? 10000 : false),
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

  const downloadMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.games.exportPortable.query({ gameId });
    },
    onSuccess: (data) => {
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Game downloaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to download game");
    },
  });

  const handleDownload = useCallback(() => {
    downloadMutation.mutate();
  }, [downloadMutation]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const canSharePrompt = Boolean(game?.prompt?.content.trim());
    try {
      if (navigator.share) {
        await navigator.share({
          title:
            game?.name ||
            (canSharePrompt ? game?.prompt?.content : "Play this game"),
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
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <LoadingState size="lg" message="Loading game..." centered />
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center gap-6 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-[var(--destructive)]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              Failed to Load Game
            </h2>
            <p className="text-[var(--muted-foreground)] max-w-md">
              Something went wrong while loading the game. Please try again.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <ArcadeButton variant="primary" onClick={handleRefetch}>
              <RefreshCw className="size-4" />
              Retry
            </ArcadeButton>
            <Link href="/">
              <ArcadeButton variant="outline">
                <Home className="size-4" />
                Go Back Home
              </ArcadeButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center gap-6 text-center p-8">
          <EmptyState
            title="Game not found"
            message="The game you're looking for doesn't exist."
          />
          <Link href="/">
            <ArcadeButton variant="outline">
              <Home className="size-4" />
              Go Back Home
            </ArcadeButton>
          </Link>
        </div>
      </div>
    );
  }

  const canViewPrompt = Boolean(game.prompt?.content.trim());
  const promptSnippet = canViewPrompt ? game.prompt.content : null;
  const canRate = playtime >= 60 && !myRating && isGameLoaded;
  const playtimeDisplay = `${Math.floor(playtime / 60)}:${(playtime % 60).toString().padStart(2, "0")}`;

  return (
    <div className="h-full flex flex-col bg-[var(--background)] overflow-hidden">
      <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
          >
            <Home className="size-4" />
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-sm text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[300px] md:max-w-[400px]">
            {game.name || promptSnippet?.slice(0, 60) || "Untitled Game"}
            {!game.name &&
            promptSnippet &&
            promptSnippet.length > 60
              ? "..."
              : ""}
          </span>
          {game.theme?.title && (
            <ArcadeBadge
              text={game.theme.title}
              variant="default"
              className="hidden md:flex text-xs"
            />
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 px-2 py-1 rounded-[var(--radius)]">
            <Clock className="size-3.5" />
            <span className="font-mono">{playtimeDisplay}</span>
          </div>
          {canViewPrompt && (
            <button
              type="button"
              onClick={() => setShowPromptDialog(true)}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-[var(--radius)] transition-colors"
              title="View Prompt"
            >
              <Eye className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-[var(--radius)] transition-colors"
            title="Share"
          >
            <Share2 className="size-4" />
          </button>
          {session?.user && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="hidden sm:flex p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-[var(--radius)] transition-colors disabled:opacity-50"
              title="Download portable version"
            >
              <Download className={`size-4 ${downloadMutation.isPending ? "animate-pulse" : ""}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowReportDialog(true)}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--muted)] rounded-[var(--radius)] transition-colors"
            title="Report"
          >
            <Flag className="size-4" />
          </button>
          {canRate && (
            <ArcadeButton
              variant="glow"
              size="sm"
              onClick={() => setShowRatingDialog(true)}
              className="hidden sm:flex"
            >
              <Trophy className="size-3.5" />
              Rate
            </ArcadeButton>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 rounded-[var(--radius)] transition-colors",
              sidebarOpen
                ? "text-[var(--primary)] bg-[var(--primary)]/10"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            )}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out",
          "lg:mr-0",
          sidebarOpen && "lg:mr-80"
        )}>
          <div className="h-full p-2 flex items-center justify-center">
            <GamePlayer
              gameUrl={`/api/games/${gameId}/play`}
              gameId={gameId}
              height="h-full"
              width="w-full"
              onLoad={handleGameLoad}
              onError={handleGameError}
              className="rounded-[var(--radius)] border border-[var(--border)] max-w-full"
            />
          </div>
        </div>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-30 lg:hidden cursor-default"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <div
          className={cn(
            "fixed lg:absolute inset-y-0 right-0 z-40 lg:z-10",
            "w-80 max-w-[85vw] lg:max-w-none",
            "border-l border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm",
            "flex flex-col transition-transform duration-300 ease-in-out",
            "top-14 lg:top-0",
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] lg:hidden">
            <h2 className="font-semibold">Game Info</h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-[var(--radius)] transition-colors"
            >
              <XCircle className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pt-4">
            <div className="px-4 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="size-4 text-[var(--primary)]" />
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Rating Status
                </h3>
              </div>
              {myRating ? (
                <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/30 rounded-[var(--radius)]">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {myRating.overall}/5
                  </div>
                  <StarRatingDisplay rating={myRating.overall} size="sm" />
                </div>
              ) : !isGameLoaded ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Loading...
                </p>
              ) : playtime < 60 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Clock className="size-4" />
                    <span>Play {60 - playtime}s more to rate</span>
                  </div>
                  <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: `${(playtime / 60) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <ArcadeButton
                  variant="primary"
                  className="w-full"
                  onClick={() => setShowRatingDialog(true)}
                >
                  <Trophy className="size-4" />
                  Rate Game
                </ArcadeButton>
              )}
            </div>

            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Medal className="size-4 text-[var(--accent)]" />
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Leaderboard
                </h3>
              </div>
              {!leaderboard || leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
                  No scores yet
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 8).map((entry, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] transition-colors ${
                          isTop3
                            ? "bg-[var(--accent)]/10"
                            : "bg-[var(--muted)]/20"
                        }`}
                      >
                        <div className="w-6 text-center flex-shrink-0">
                          {isTop3 ? (
                            <Medal
                              className={`size-4 ${
                                rank === 1
                                  ? "text-[var(--accent)]"
                                  : rank === 2
                                    ? "text-[var(--muted-foreground)]"
                                    : "text-[var(--primary)]"
                              }`}
                            />
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)] font-mono">
                              {rank}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--foreground)] truncate">
                            {entry.user?.name || "Anonymous"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {entry.score}
                          </p>
                          {entry.completionTime && (
                            <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
                              {Math.floor(entry.completionTime / 60)}:
                              {(entry.completionTime % 60)
                                .toString()
                                .padStart(2, "0")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {game.prompt?.user && (
              <div className="px-4 py-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="size-4 text-[var(--primary)]" />
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Creator
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                    {game.prompt.user.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {game.prompt.user.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Game Creator
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ViewPromptDialog
        isOpen={canViewPrompt && showPromptDialog}
        onClose={() => setShowPromptDialog(false)}
        promptContent={promptSnippet || ""}
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
