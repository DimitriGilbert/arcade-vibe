"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { GamePlayer } from "@/components/game-player";
import {
  ArcadeCard,
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
  ArcadeDialogClose,
} from "@/components/arcade";
import { X } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { RatingForm } from "./components/rating-form";
import { LeaderboardSidebar } from "./components/leaderboard-sidebar";
import { GameHeader } from "./components/game-header";
import { RatingStatusCard } from "./components/rating-status-card";
import { ViewPromptDialog } from "./components/view-prompt-dialog";
import { ReportDialog } from "./components/report-dialog";
import LoadingState from "@/components/reusable/loading-state";
import { EmptyState } from "@/components/reusable";
import type { Rating } from "@/types";

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

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      return await trpcClient.games.getById.query({ id: gameId });
    },
    enabled: !!gameId,
  });

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

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <EmptyState
          title="Game not found"
          message="The game you're looking for doesn't exist."
        />
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
          <ArcadeDialogClose>
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
