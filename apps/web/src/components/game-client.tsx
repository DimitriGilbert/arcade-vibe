"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { GamePlayer } from "@/components/game-player";
import {
  ArcadeCard,
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
  ArcadeDialogClose,
  ArcadeButton,
} from "@/components/arcade";
import { X, RefreshCw, Home, AlertCircle } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { RatingForm } from "@/components/game/rating-form";
import { LeaderboardSidebar } from "@/components/game/leaderboard-sidebar";
import { GameHeader } from "@/components/game/game-header";
import { RatingStatusCard } from "@/components/game/rating-status-card";
import { ViewPromptDialog } from "@/components/game/view-prompt-dialog";
import { ReportDialog } from "@/components/game/report-dialog";
import LoadingState from "@/components/reusable/loading-state";
import { EmptyState } from "@/components/reusable";
import type { Rating } from "@/lib/trpc-types";

interface GamePlayPageProps {
  params: {
    id: string;
  };
}

export default function GamePlayPage({ params }: GamePlayPageProps) {
  const [playtime, setPlaytime] = useState(0);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const gameId = params.id;

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
    } catch (error) {
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingState size="lg" message="Loading game..." centered />
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
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
      <div className="flex items-center justify-center min-h-screen bg-background">
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

  const canRate = playtime >= 60 && !myRating && isGameLoaded;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <GameHeader
          promptContent={game.prompt?.content || ""}
          playtime={playtime}
          canRate={canRate}
          themeTitle={game.theme?.title}
          onViewPrompt={() => setShowPromptDialog(true)}
          onShare={handleShare}
          onReport={() => setShowReportDialog(true)}
          onRate={() => setShowRatingDialog(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ArcadeCard className="h-[calc(100vh-200px)]">
              <div className="h-full">
                <GamePlayer
                  gameUrl={`/api/games/${gameId}/play`}
                  gameId={gameId}
                  height="h-full"
                  width="w-full"
                  onLoad={handleGameLoad}
                  onError={handleGameError}
                />
              </div>
            </ArcadeCard>
          </div>

          <div className="space-y-4">
            <RatingStatusCard
              myRating={myRating as Rating | null}
              isGameLoaded={isGameLoaded}
              playtime={playtime}
              onRate={() => setShowRatingDialog(true)}
            />

            <LeaderboardSidebar gameId={gameId} />
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
