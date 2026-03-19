"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Trophy, TrendingUp, Sparkles, ChevronLeft, ChevronRight, Loader2, Gamepad2 } from "lucide-react";
import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
  ArcadeDialogClose,
} from "@/components/arcade/arcade-dialog";
import { ArcadeButton } from "@/components/arcade/arcade-button";
import { trpcClient } from "@/utils/trpc";

interface DiscoveryGame {
  id: string;
  name: string | null;
  createdAt: string;
  modelProvider: string;
  modelName: string;
  tier: { slug: string; name: string } | null;
  creator: { id: string; name: string | null };
  theme: { id: string; title: string | null } | null;
  finalScore?: string;
  playCount?: number;
}

interface DiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeGameIds?: string[];
  page: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

function DiscoveryGameCard({ game, category }: { game: DiscoveryGame; category: "top" | "trending" | "new" }) {
  const handleClick = () => {
    window.open(`/game/${game.id}`, "_blank");
  };

  const categoryIcon = {
    top: <Trophy className="h-3 w-3 text-yellow-500" />,
    trending: <TrendingUp className="h-3 w-3 text-cyan-500" />,
    new: <Sparkles className="h-3 w-3 text-lime-500" />,
  };

  const categoryLabel = {
    top: "Top",
    trending: "Trending",
    new: "New",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex items-center gap-3 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/50 cursor-pointer transition-all duration-200 text-left w-full"
    >
      <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center shrink-0">
        <Gamepad2 className="h-6 w-6 text-[var(--primary)]/50 group-hover:text-[var(--primary)] transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {categoryIcon[category]}
          <span className="text-xs text-[var(--muted-foreground)]">{categoryLabel[category]}</span>
          {game.tier && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
              {game.tier.slug}
            </span>
          )}
        </div>
        <h4 className="font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name || game.theme?.title || "Untitled Game"}
        </h4>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="truncate max-w-[80px]">{game.creator.name || "Anonymous"}</span>
          <span>·</span>
          <span>{new Date(game.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors shrink-0" />
    </button>
  );
}

export function DiscoveryDialog({
  open,
  onOpenChange,
  excludeGameIds = [],
  page,
  onNextPage,
  onPreviousPage,
}: DiscoveryDialogProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["discovery-games", page, excludeGameIds],
    queryFn: () => trpcClient.games.getDiscoveryGames.query({ page, excludeGameIds }),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const handleNext = useCallback(() => {
    onNextPage();
  }, [onNextPage]);

  const handlePrev = useCallback(() => {
    onPreviousPage();
  }, [onPreviousPage]);

  const hasGames = data && (data.top.length > 0 || data.trending.length > 0 || data.new.length > 0);

  return (
    <ArcadeDialog open={open} onOpenChange={onOpenChange}>
      <ArcadeDialogContent size="lg" className=" min-w-7xl" showClose={true}>
        <ArcadeDialogHeader>
          <ArcadeDialogTitle className="text-xl">
            While you wait...
          </ArcadeDialogTitle>
          <ArcadeDialogDescription>
            Check out these games from the community! Opens in a new tab so your generation continues uninterrupted.
          </ArcadeDialogDescription>
        </ArcadeDialogHeader>

        <div className="min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-[300px] text-[var(--muted-foreground)]">
              Failed to load games. Please try again later.
            </div>
          ) : !hasGames ? (
            <div className="flex items-center justify-center h-[300px] text-[var(--muted-foreground)]">
              No games available at the moment. Check back later!
            </div>
          ) : (
            <div className="space-y-4">
              {data?.top[0] && (
                <DiscoveryGameCard game={data.top[0]} category="top" />
              )}
              {data?.trending[0] && (
                <DiscoveryGameCard game={data.trending[0]} category="trending" />
              )}
              {data?.new[0] && (
                <DiscoveryGameCard game={data.new[0]} category="new" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
          <div className="text-sm text-[var(--muted-foreground)]">
            Page {page + 1}
          </div>
          <div className="flex items-center gap-2">
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </ArcadeButton>
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasGames || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </ArcadeButton>
          </div>
        </div>

        <ArcadeDialogClose>
          <ArcadeButton variant="primary" className="w-full mt-2">
            Continue Generating
          </ArcadeButton>
        </ArcadeDialogClose>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
