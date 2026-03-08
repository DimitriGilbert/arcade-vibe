"use client";

import type { Route } from "next";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Gamepad2, GitFork, Layers, ArrowUpDown, Filter } from "lucide-react";

import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";

type SortOption = "newest" | "oldest";

interface PromptItem {
  id: string;
  title: string | null;
  content: string;
  tokenCount: number;
  version: number;
  visibility: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  theme: { id: string; title: string } | null;
  author: { id: string; name: string | null; image: string | null } | null;
  gameCount: number;
  forkCount: number;
}

interface ThemeItem {
  id: string;
  title: string;
}

interface PromptsListClientProps {
  prompts: PromptItem[];
  themes: ThemeItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const GAMES_BRACKETS = [
  { label: "All", min: 0, max: Infinity },
  { label: "0 games", min: 0, max: 0 },
  { label: "1-5 games", min: 1, max: 5 },
  { label: "6-20 games", min: 6, max: 20 },
  { label: "21+ games", min: 21, max: Infinity },
] as const;

const FORKS_BRACKETS = [
  { label: "All", min: 0, max: Infinity },
  { label: "0 forks", min: 0, max: 0 },
  { label: "1-5 forks", min: 1, max: 5 },
  { label: "6-20 forks", min: 6, max: 20 },
  { label: "21+ forks", min: 21, max: Infinity },
] as const;

export function PromptsListClient({
  prompts,
  themes,
  currentPage,
  totalPages,
  totalItems,
  hasNextPage,
  hasPreviousPage,
}: PromptsListClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [gamesBracket, setGamesBracket] = useState<(typeof GAMES_BRACKETS)[number]>(
    GAMES_BRACKETS[0],
  );
  const [forksBracket, setForksBracket] = useState<(typeof FORKS_BRACKETS)[number]>(
    FORKS_BRACKETS[0],
  );
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedPrompts = useMemo(() => {
    let result = [...prompts];

    if (selectedTheme !== "all") {
      result = result.filter((p) => p.theme?.id === selectedTheme);
    }

    result = result.filter((p) => {
      const games = p.gameCount;
      const forks = p.forkCount;
      return games >= gamesBracket.min && games <= gamesBracket.max && 
             forks >= forksBracket.min && forks <= forksBracket.max;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [prompts, sortBy, selectedTheme, gamesBracket, forksBracket]);

  const getPageHref = (page: number): Route => {
    if (page <= 1) {
      return "/prompts" as Route;
    }
    return `/prompts?page=${page}` as Route;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters & Sort
        </ArcadeButton>

        <div className="flex items-center gap-2 text-sm">
          <ArrowUpDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[var(--background)] border border-[var(--border)] rounded-md px-2 py-1 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <span className="text-sm text-[var(--muted-foreground)] ml-auto">
          {filteredAndSortedPrompts.length} of {totalItems} prompts
        </span>
      </div>

      {showFilters && (
        <ArcadeCard className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="theme-filter" className="text-xs font-medium text-[var(--muted-foreground)] mb-2 block">
                Theme
              </label>
              <select
                id="theme-filter"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Themes</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="games-filter" className="text-xs font-medium text-[var(--muted-foreground)] mb-2 block">
                Games Count
              </label>
              <select
                id="games-filter"
                value={gamesBracket.label}
                onChange={(e) => {
                  const bracket = GAMES_BRACKETS.find((b) => b.label === e.target.value);
                  if (bracket) setGamesBracket(bracket);
                }}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm"
              >
                {GAMES_BRACKETS.map((bracket) => (
                  <option key={bracket.label} value={bracket.label}>
                    {bracket.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="forks-filter" className="text-xs font-medium text-[var(--muted-foreground)] mb-2 block">
                Forks Count
              </label>
              <select
                id="forks-filter"
                value={forksBracket.label}
                onChange={(e) => {
                  const bracket = FORKS_BRACKETS.find((b) => b.label === e.target.value);
                  if (bracket) setForksBracket(bracket);
                }}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm"
              >
                {FORKS_BRACKETS.map((bracket) => (
                  <option key={bracket.label} value={bracket.label}>
                    {bracket.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ArcadeCard>
      )}

      {filteredAndSortedPrompts.length === 0 ? (
        <ArcadeCard className="p-12 text-center">
          <p className="text-[var(--muted-foreground)]">No prompts match your filters.</p>
        </ArcadeCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPrompts.map((prompt) => (
            <Link key={prompt.id} href={`/prompts/gallery/${prompt.id}` as Route}>
              <ArcadeCard className="h-full p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:scale-[1.02] cursor-pointer">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <ArcadeBadge text={`v${prompt.version}`} variant="default" />
                    {prompt.theme && (
                      <span className="text-xs text-[var(--muted-foreground)] inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {prompt.theme.title}
                      </span>
                    )}
                  </div>

                  <pre className="text-sm text-[var(--muted-foreground)] line-clamp-3 whitespace-pre-wrap flex-1 mb-4">
                    {prompt.title || `${prompt.content.slice(0, 100)}${prompt.content.length > 100 ? "..." : ""}`}
                  </pre>

                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-3 border-t border-[var(--border)]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(prompt.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3" />
                        {prompt.gameCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitFork className="h-3 w-3" />
                        {prompt.forkCount}
                      </span>
                    </div>
                  </div>
                </div>
              </ArcadeCard>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-[var(--border)]">
          {hasPreviousPage ? (
            <Link href={getPageHref(currentPage - 1)}>
              <ArcadeButton variant="outline">Previous</ArcadeButton>
            </Link>
          ) : (
            <ArcadeButton variant="outline" disabled>
              Previous
            </ArcadeButton>
          )}

          <p className="text-sm text-[var(--muted-foreground)]">
            Page {currentPage} of {totalPages}
          </p>

          {hasNextPage ? (
            <Link href={getPageHref(currentPage + 1)}>
              <ArcadeButton variant="outline">Next</ArcadeButton>
            </Link>
          ) : (
            <ArcadeButton variant="outline" disabled>
              Next
            </ArcadeButton>
          )}
        </nav>
      )}
    </>
  );
}
