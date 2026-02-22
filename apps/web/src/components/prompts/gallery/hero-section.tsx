"use client";

import type { PromptGetPublicByIdOutput } from "@/lib/trpc-types";
import type { Route } from "next";

import Link from "next/link";
import { Gamepad2, GitFork, Share2, Play, Star } from "lucide-react";

import { ArcadeBadge, ArcadeButton } from "@/components/arcade";

export interface HeroSectionProps {
  contentPreview: string;
  author: { id: string; name: string | null; image: string | null } | null;
  theme: { id: string; title: string } | null;
  stats: {
    gameCount: number;
    forkCount: number;
    avgRating: number;
    ratingCount: number;
  };
  onPlayBest?: () => void;
  onFork: () => void;
  onShare: () => void;
  isForking: boolean;
  isLoggedIn: boolean;
}

export function HeroSection({
  contentPreview,
  author,
  theme,
  stats,
  onPlayBest,
  onFork,
  onShare,
  isForking,
  isLoggedIn,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)]/10 via-[var(--card)] to-[var(--card)] border-b border-[var(--border)]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-2 mb-4">
          <ArcadeBadge text="Prompt Gallery" variant="neon" />
          {theme && (
            <Link href={`/leaderboard?theme=${theme.id}`} className="hover:underline">
              <ArcadeBadge text={`Theme: ${theme.title}`} variant="default" />
            </Link>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black mb-4 leading-tight tracking-tight">
          &ldquo;{contentPreview}&rdquo;
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[var(--muted-foreground)]">
          {author && (
            <Link href={`/profile/${author.id}` as Route} className="inline-flex items-center gap-2 hover:text-[var(--foreground)]">
              {author.image && (
                <img src={author.image} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span>by @{author.name ?? "Anonymous"}</span>
            </Link>
          )}
          <span className="inline-flex items-center gap-1">
            <Gamepad2 className="h-4 w-4" />
            {stats.gameCount} games
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            {stats.forkCount} forks
          </span>
          {stats.avgRating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              {stats.avgRating.toFixed(1)} avg rating
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {onPlayBest && (
            <ArcadeButton variant="primary" onClick={onPlayBest}>
              <Play className="h-4 w-4" />
              Play Best Game
            </ArcadeButton>
          )}
          {isLoggedIn && (
            <ArcadeButton variant="outline" onClick={onFork} disabled={isForking}>
              <GitFork className="h-4 w-4" />
              {isForking ? "Forking..." : "Fork This"}
            </ArcadeButton>
          )}
          <ArcadeButton variant="outline" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </ArcadeButton>
        </div>
      </div>
    </div>
  );
}
