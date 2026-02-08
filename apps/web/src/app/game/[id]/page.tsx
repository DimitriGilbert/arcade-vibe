"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { GamePlayer } from "@/components/game-player";
import { Card, CardContent } from "@/components/ui/card";
import { DialogPrimitive } from "@/components/ui/dialog";
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
        <EmptyState title="Game not found" message="The game you're looking for doesn't exist." />
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
            <Card className="h-[calc(100vh-200px)]">
              <CardContent className="p-0 h-full">
                <GamePlayer
                  gameUrl={`/api/games/${gameId}/play`}
                  gameId={gameId}
                  height="h-full"
                  width="w-full"
                  onLoad={handleGameLoad}
                  onError={handleGameError}
                />
              </CardContent>
            </Card>
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

      {showRatingDialog && (
        <DialogPrimitive.Root
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop className="fixed inset-0 bg-black/50" />
            <DialogPrimitive.Popup className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-none p-4 text-xs/relaxed ring-1 duration-100 sm:max-w-lg fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none">
              <button
                type="button"
                onClick={() => setShowRatingDialog(false)}
                className="absolute top-2 right-2 p-1 hover:bg-muted rounded-none"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Rate This Game</h2>
                <p className="text-muted-foreground text-xs">
                  Your feedback helps improve future games
                </p>
              </div>
              <RatingForm
                gameId={gameId}
                promptId={game.promptId}
                playtime={playtime}
                onSuccess={() => setShowRatingDialog(false)}
              />
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </div>
  );
}
