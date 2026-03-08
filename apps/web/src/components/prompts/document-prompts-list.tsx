"use client";

import type { Route } from "next";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  ArrowUpDown,
  Filter,
  Layers,
  Gamepad2,
  GitFork,
} from "lucide-react";

import { ArcadeBadge, ArcadeButton, ArcadeCard } from "@/components/arcade";

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

interface DocumentPromptsListProps {
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

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(d);
}

function getPageHref(page: number): Route {
  if (page <= 1) {
    return "/prompts/document" as Route;
  }
  return `/prompts/document?page=${page}` as Route;
}

interface PromptCardProps {
  prompt: PromptItem;
  index: number;
}

function PromptCard({ prompt, index }: PromptCardProps) {
  const displayTitle =
    prompt.title || prompt.content.slice(0, 80).replace(/\n/g, " ").trim();
  const contentPreview = prompt.content
    .slice(0, 280)
    .replace(/\n/g, " ")
    .trim();
  const isFeatured = index === 0;
  const relativeTime = formatRelativeTime(prompt.createdAt);
  const animationDelay = `${0.1 + index * 0.08}s`;

  return (
    <Link
      href={`/prompts/document/${prompt.id}` as Route}
      className="group block"
      style={{ animationDelay }}
    >
      <article
        className={`
          relative overflow-hidden rounded-2xl border border-[var(--border)]
          bg-[var(--card)] transition-all duration-500 ease-out
          hover:border-[var(--primary)]/40 hover:shadow-xl hover:shadow-[var(--primary)]/5
          animate-fade-in-up animate-fill-mode-backwards
          ${isFeatured
            ? "bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--primary)]/5"
            : ""
          }
        `}
      >
        <div
          className={`
            absolute top-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/50 to-transparent
            transition-all duration-500 ease-out
            group-hover:w-full
          `}
        />

        <div className="relative p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span
                className={`
                  flex h-8 w-8 items-center justify-center rounded-lg
                  font-mono text-sm font-bold
                  ${isFeatured
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }
                `}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <ArcadeBadge
                text={`v${prompt.version}`}
                variant="default"
                className="font-mono text-[10px] uppercase tracking-wider"
              />

              <ArcadeBadge
                text={prompt.visibility}
                variant={prompt.visibility === "public" ? "neon" : "default"}
                className="text-[10px] uppercase tracking-wider"
              />

              {prompt.theme && (
                <span className="text-xs text-[var(--muted-foreground)] inline-flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {prompt.theme.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="font-medium">{prompt.tokenCount} tokens</span>
              </span>
              <span className="flex items-center gap-1">
                <Gamepad2 className="h-3.5 w-3.5" />
                {prompt.gameCount}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5" />
                {prompt.forkCount}
              </span>
            </div>
          </div>

          <h3
            className={`
              mb-3 font-bold leading-tight tracking-tight
              transition-colors duration-300
              group-hover:text-[var(--primary)]
              ${isFeatured ? "text-xl md:text-2xl" : "text-lg md:text-xl"}
            `}
          >
            {displayTitle}
            {prompt.title === null && "..."}
          </h3>

          <div className="relative mb-6">
            <p
              className={`
                text-[var(--muted-foreground)] leading-relaxed
                ${isFeatured ? "line-clamp-4 text-sm md:text-base" : "line-clamp-3 text-sm"}
              `}
            >
              {contentPreview}
              {prompt.content.length > 280 && (
                <span className="text-[var(--primary)]">...</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-3">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70
                  text-sm font-semibold text-[var(--primary-foreground)]
                  ring-2 ring-[var(--background)] ring-offset-2 ring-offset-[var(--card)]
                `}
              >
                {prompt.author?.name?.slice(0, 2).toUpperCase() ?? prompt.id.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {prompt.author?.name ?? "Creator"}
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <Calendar className="h-3 w-3" />
                  {relativeTime}
                </span>
              </div>
            </div>

            <div
              className={`
                flex items-center gap-2 text-sm font-medium
                text-[var(--muted-foreground)]
                transition-all duration-300
                group-hover:text-[var(--primary)]
                group-hover:gap-3
              `}
            >
              <span>View prompt</span>
              <ArrowRight
                className={`
                  h-4 w-4 transition-transform duration-300
                  group-hover:translate-x-1
                `}
              />
            </div>
          </div>
        </div>

        {isFeatured && (
          <div className="absolute -right-8 -top-8 h-24 w-24 rotate-45 bg-gradient-to-br from-[var(--primary)]/10 to-transparent blur-2xl" />
        )}
      </article>
    </Link>
  );
}

export function DocumentPromptsList({
  prompts,
  themes,
  currentPage,
  totalPages,
  totalItems,
  hasNextPage,
  hasPreviousPage,
}: DocumentPromptsListProps) {
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

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-12 animate-fade-in md:mb-16">
          <Link
            href={"/prompts" as Route}
            className="group mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <FileText className="h-4 w-4" />
            <span>Back to Hub</span>
          </Link>

          <div className="relative">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
                Prompt
              </span>
              <span className="text-[var(--primary)]"> Library</span>
            </h1>

            <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-transparent" />
          </div>

          <p className="mt-4 max-w-2xl text-lg text-[var(--muted-foreground)] md:text-xl">
            Discover curated prompts crafted by the community. Browse, learn, and
            get inspired.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
              <span className="font-medium text-[var(--foreground)]">
                {totalItems}
              </span>
              <span>total prompts</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Updated in real-time</span>
            </div>
            <div className="flex items-center gap-2">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </div>
          </div>
        </header>

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
          <div className="grid gap-6 md:gap-8">
            {filteredAndSortedPrompts.map((prompt, index) => (
              <PromptCard key={prompt.id} prompt={prompt} index={index} />
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

        <footer className="mt-16 text-center animate-fade-in animate-delay-700">
          <p className="text-sm text-[var(--muted-foreground)]">
            Click on any prompt to view the full content and details
          </p>
        </footer>
      </div>
    </main>
  );
}
