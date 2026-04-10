"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Crown,
  Flame,
  Gamepad2,
  Medal,
  Search,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

import { ArcadeBadge, ArcadeInput } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import { getModelDetailRoute } from "@/lib/model-routes";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";

type SortField = "games" | "rating" | "ratings" | "name";

const SORT_OPTIONS: Array<{ icon: React.ReactNode; label: string; value: SortField }> = [
  { icon: <Gamepad2 className="h-3.5 w-3.5" />, label: "Games", value: "games" },
  { icon: <Star className="h-3.5 w-3.5" />, label: "Rating", value: "rating" },
  { icon: <Flame className="h-3.5 w-3.5" />, label: "Ratings", value: "ratings" },
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Name", value: "name" },
];

export default function ModelsV1Page() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("games");

  const { data: models, isLoading } = useQuery({
    queryKey: ["models", "list-with-stats"],
    queryFn: async () => {
      return await trpcClient.models.listWithStats.query();
    },
  });

  const filtered = useMemo(() => {
    if (!models) return [];
    const normalized = query.trim().toLowerCase();
    const withGames = models.filter((m) => m.gameCount > 0);
    const result = normalized.length
      ? withGames.filter((m) => {
          const haystack = [m.modelName, m.tier, m.tierName, ...m.providers]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalized);
        })
      : withGames;

    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.modelName.localeCompare(b.modelName);
      if (sortBy === "games") return b.gameCount - a.gameCount;
      if (sortBy === "rating") return b.avgRating - a.avgRating;
      return b.ratingCount - a.ratingCount;
    });
  }, [models, query, sortBy]);

  const totals = useMemo(() => {
    if (!models) return { models: 0, games: 0, ratedModels: 0 };
    const withGames = models.filter((m) => m.gameCount > 0);
    return {
      models: withGames.length,
      games: withGames.reduce((sum, m) => sum + m.gameCount, 0),
      ratedModels: withGames.filter((m) => m.ratingCount > 0).length,
    };
  }, [models]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const maxGames = filtered.length > 0 ? filtered[0].gameCount : 1;

  if (isLoading) {
    return <LoadingState centered message="Loading arena..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--primary)]/3 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="container relative mx-auto px-4 pt-10 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
              <Trophy className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] font-medium">
              Arena Leaderboard
            </p>
          </div>

          <h1
            className="font-[var(--font-display)] text-5xl md:text-6xl font-black tracking-tight leading-[0.9]"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            MODEL
            <span className="block text-[var(--primary)]">RANKINGS</span>
          </h1>

          <p className="mt-4 text-[var(--muted-foreground)] max-w-lg leading-relaxed text-sm">
            Real-time competitive rankings. Models battle head-to-head — the
            scoreboard never lies.
          </p>

          <div className="mt-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-[var(--muted-foreground)]">
                <span className="font-bold text-[var(--foreground)]">{totals.models}</span>{" "}
                fighters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <span className="text-[var(--muted-foreground)]">
                <span className="font-bold text-[var(--foreground)]">
                  {totals.games.toLocaleString()}
                </span>{" "}
                matches
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <ArcadeInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fighters..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSortBy(option.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  sortBy === option.value
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50",
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20">
            <EmptyState title="No fighters found" message="Try a different search." />
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <section className="grid gap-4 md:grid-cols-3">
                {top3.map((model, index) => {
                  const medals = [
                    { icon: <Crown className="h-5 w-5" />, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
                    { icon: <Medal className="h-5 w-5" />, color: "text-slate-300", bg: "bg-slate-300/10 border-slate-300/20" },
                    { icon: <Medal className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/20" },
                  ];
                  const medal = medals[index];
                  const ratingPct = Math.max(0, Math.min(100, (model.avgRating / 5) * 100));

                  return (
                    <Link
                      key={model.id}
                      href={getModelDetailRoute(model.modelName, model.id)}
                      className="group"
                    >
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-xl border p-5 transition-all duration-300",
                          "hover:border-[var(--primary)]/50 hover:shadow-lg hover:shadow-[var(--primary)]/5",
                          index === 0
                            ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                            : "border-[var(--border)] bg-[var(--card)]",
                        )}
                      >
                        {index === 0 && (
                          <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--primary)]/10 rounded-bl-[60px]" />
                        )}

                        <div className="relative flex items-start justify-between mb-4">
                          <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md border", medal.bg)}>
                            <span className={medal.color}>{medal.icon}</span>
                            <span className={cn("font-black text-lg", medal.color)}>#{index + 1}</span>
                          </div>
                          <ArcadeBadge text={model.tierName} variant="default" />
                        </div>

                        <h3
                          className="text-lg font-bold group-hover:text-[var(--primary)] transition-colors truncate"
                          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
                        >
                          {model.modelName}
                        </h3>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {model.providers.map((p) => (
                            <span
                              key={p}
                              className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] px-1.5 py-0.5 rounded bg-[var(--muted)]/50"
                            >
                              {p}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-[var(--muted-foreground)]">Rating</span>
                            <span className="font-bold">
                              {model.avgRating > 0 ? model.avgRating.toFixed(2) : "—"}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                model.avgRating >= 4
                                  ? "bg-[var(--primary)]"
                                  : model.avgRating >= 3
                                    ? "bg-[var(--accent)]"
                                    : "bg-[var(--muted-foreground)]",
                              )}
                              style={{ width: `${ratingPct}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                                Games
                              </p>
                              <p className="font-bold text-sm">{model.gameCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                                Ratings
                              </p>
                              <p className="font-bold text-sm">{model.ratingCount.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </section>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Zap className="h-4 w-4 text-[var(--primary)]" />
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-medium">
                Full Rankings
              </p>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <section className="space-y-1.5">
              {rest.map((model, index) => {
                const rank = index + 4;
                const barPct = Math.max(2, (model.gameCount / maxGames) * 100);

                return (
                  <Link
                    key={model.id}
                    href={getModelDetailRoute(model.modelName, model.id)}
                    className="group block"
                  >
                    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--muted)]/20 transition-all">
                      <span
                        className="w-8 text-center font-mono text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                      >
                        {rank}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                            {model.modelName}
                          </span>
                          <ArcadeBadge text={model.tierName} variant="default" />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1 h-1 rounded-full bg-[var(--muted)]/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--primary)]/60 transition-all"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[var(--muted-foreground)] font-mono whitespace-nowrap">
                            {model.gameCount} games
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <p className="text-[10px] text-[var(--muted-foreground)]">Rating</p>
                          <p className="font-bold">
                            {model.avgRating > 0 ? model.avgRating.toFixed(2) : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[var(--muted-foreground)]">Votes</p>
                          <p className="font-bold">{model.ratingCount.toLocaleString()}</p>
                        </div>
                      </div>

                      <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
