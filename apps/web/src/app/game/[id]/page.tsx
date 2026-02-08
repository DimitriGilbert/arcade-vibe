"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { GamePlayer } from "@/components/game-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
  DialogPrimitive,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Share2, Eye, Flag, Clock, Trophy, X } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { RatingForm } from "./components/rating-form";
import { LeaderboardSidebar } from "./components/leaderboard-sidebar";

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

  // Fetch game data
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      return await trpcClient.games.getById.query({ id: gameId });
    },
    enabled: !!gameId,
  });

  // Fetch user's rating for this game
  const { data: myRating, isLoading: ratingLoading } = useQuery({
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

  // Track playtime when game is loaded
  useEffect(() => {
    if (!isGameLoaded) return;

    const interval = setInterval(() => {
      setPlaytime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameLoaded]);

  // Handle game loaded
  const handleGameLoad = useCallback(() => {
    setIsGameLoaded(true);
  }, []);

  // Handle game error
  const handleGameError = useCallback((error: Error) => {
    toast.error(error.message || "Failed to load game");
  }, []);

  // Report mutation
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

  // Share game
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

  // Submit report
  const handleSubmitReport = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const reason = formData.get("reason") as string;
      const description = formData.get("description") as string;

      if (!reason || reason === "other") {
        toast.error("Please select a reason for reporting");
        return;
      }

      if (!description.trim() || description.trim().length < 20) {
        toast.error("Description must be at least 20 characters");
        return;
      }

      reportMutation.mutate({ reason, description });
    },
    [reportMutation],
  );

  if (gameLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Game not found
          </h2>
          <p className="text-muted-foreground">
            The game you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const canRate = playtime >= 60 && !myRating && isGameLoaded;
  const playtimeDisplay = `${Math.floor(playtime / 60)}:${(playtime % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold truncate max-w-md text-foreground">
              {game.prompt?.content?.slice(0, 50)}...
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {playtimeDisplay}
              </span>
              {game.theme && (
                <Badge variant="secondary">{game.theme.title}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Prompt */}
            <button
              type="button"
              onClick={() => setShowPromptDialog(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-border bg-background hover:bg-muted rounded-none text-xs font-medium transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Prompt
            </button>

            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            {/* Report */}
            <button
              type="button"
              onClick={() => setShowReportDialog(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-destructive/50 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-none text-xs font-medium transition-colors"
            >
              <Flag className="h-4 w-4" />
              Report
            </button>

            {/* Rate Button */}
            {canRate && (
              <Button
                size="sm"
                onClick={() => setShowRatingDialog(true)}
                className="gap-2"
              >
                <Trophy className="h-4 w-4" />
                Rate Game
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Player */}
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Rating Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rating Status</CardTitle>
              </CardHeader>
              <CardContent>
                {myRating ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-card-foreground">
                        You rated this game
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-accent">
                      {myRating.overall}/5
                    </div>
                  </div>
                ) : !isGameLoaded ? (
                  <p className="text-sm text-muted-foreground">
                    Loading game...
                  </p>
                ) : playtime < 60 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        Play for {60 - playtime} more seconds to rate
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${(playtime / 60) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-secondary">
                        You can now rate this game!
                      </span>
                    </div>
                    <Button
                      onClick={() => setShowRatingDialog(true)}
                      size="sm"
                      className="w-full"
                    >
                      Rate Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <LeaderboardSidebar gameId={gameId} />
          </div>
        </div>
      </div>

      {/* View Prompt Dialog */}
      {showPromptDialog && (
        <DialogPrimitive.Root
          open={showPromptDialog}
          onOpenChange={setShowPromptDialog}
        >
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Popup className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-none p-4 text-xs/relaxed ring-1 duration-100 sm:max-w-2xl fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setShowPromptDialog(false)}
                className="absolute top-2 right-2 p-1 hover:bg-muted rounded-none"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Prompt</h2>
                <p className="text-muted-foreground text-xs">
                  The prompt used to generate this game
                </p>
              </div>
              <div className="p-4 bg-muted rounded-md max-h-[60vh] overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">
                  {game.prompt?.content}
                </p>
              </div>
            </DialogPrimitive.Popup>
          </DialogPortal>
        </DialogPrimitive.Root>
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <DialogPrimitive.Root
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        >
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Popup className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-none p-4 text-xs/relaxed ring-1 duration-100 sm:max-w-lg fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none">
              <button
                type="button"
                onClick={() => setShowReportDialog(false)}
                className="absolute top-2 right-2 p-1 hover:bg-muted rounded-none"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Report Game</h2>
                <p className="text-muted-foreground text-xs">
                  Please provide a reason for reporting this game
                </p>
              </div>
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <select
                    id="reason"
                    name="reason"
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="spam">Spam</option>
                    <option value="malicious">Malicious code/behavior</option>
                    <option value="copyright">Copyright violation</option>
                    <option value="harassment">Harassment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe why you're reporting this game... (minimum 20 characters)"
                    className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReportDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={reportMutation.isPending}
                  >
                    {reportMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </div>
              </form>
            </DialogPrimitive.Popup>
          </DialogPortal>
        </DialogPrimitive.Root>
      )}

      {/* Rating Dialog */}
      {showRatingDialog && (
        <DialogPrimitive.Root
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
        >
          <DialogPortal>
            <DialogOverlay />
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
          </DialogPortal>
        </DialogPrimitive.Root>
      )}
    </div>
  );
}
