"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Cpu,
  Gamepad2,
  Search,
  Star,
} from "lucide-react";

import { ArcadeBadge, ArcadeInput } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import { getModelDetailRoute } from "@/lib/model-routes";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";

type SortField = "games" | "rating" | "ratings" | "name";

const SORT_OPTIONS: Array<{ label: string; value: SortField }> = [
  { label: "Games", value: "games" },
  { label: "Rating", value: "rating" },
  { label: "Ratings", value: "ratings" },
  { label: "Name", value: "name" },
];

const TIER_ACCENTS: Record<string, string> = {
  champion: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  premier: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  standard: "bg-sky-500/10 border-sky-500/20 text-sky-400",
  economy: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

function getTierAccent(tierName: string): string {
  const key = Object.keys(TIER_ACCENTS).find((k) =>
    tierName.toLowerCase().includes(k),
  );
  return key ? (TIER_ACCENTS[key] ?? "") : "";
}

export default function ModelsV2Page() {
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

  if (isLoading) {
    return <LoadingState centered message="Loading catalogue..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-[var(--border)]">
        <div className="container mx-auto px-4 pt-12 pb-10 max-w-4xl">
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-3">
                  The Model Catalogue
                </p>
                <h1
                  className="text-4xl md:text-5xl font-black tracking-tight leading-none"
                  style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
                >
                  Models
                </h1>
              </div>
              <p className="hidden sm:block text-xs text-[var(--muted-foreground)] text-right leading-relaxed">
                <span className="font-bold text-[var(--foreground)]">{totals.models}</span>{" "}
                active models across{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {totals.games.toLocaleString()}
                </span>{" "}
                published games
              </p>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <ArcadeInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalogue..."
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[var(--muted-foreground)] mr-2">Sort:</span>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortBy(option.value)}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      sortBy === option.value
                        ? "bg-[var(--foreground)] text-[var(--background)] font-semibold"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {filtered.length === 0 ? (
          <div className="py-20">
            <EmptyState title="No models found" message="Try a different search term." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((model, index) => {
              const tierAccent = getTierAccent(model.tierName);
              const ratingPct = Math.max(0, Math.min(100, (model.avgRating / 5) * 100));

              return (
                <Link
                  key={model.id}
                  href={getModelDetailRoute(model.modelName, model.id)}
                  className="group block py-6 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-5">
                    <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--muted)]/30 shrink-0">
                      <span
                        className="text-sm font-bold text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors"
                      >
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold tracking-tight group-hover:text-[var(--primary)] transition-colors">
                            {model.modelName}
                          </h2>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 rounded text-[11px] font-medium border",
                                tierAccent || "bg-[var(--muted)]/30 border-[var(--border)] text-[var(--muted-foreground)]",
                              )}
                            >
                              {model.tierName}
                            </span>
                            {model.providers.map((p) => (
                              <span
                                key={p}
                                className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wide"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <ArrowRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-all translate-x-0 group-hover:translate-x-1 shrink-0 mt-1" />
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                          <span className="font-semibold">{model.gameCount.toLocaleString()}</span>
                          <span className="text-[var(--muted-foreground)] text-xs">games</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                          <span className="font-semibold">
                            {model.avgRating > 0 ? model.avgRating.toFixed(2) : "—"}
                          </span>
                          <span className="text-[var(--muted-foreground)] text-xs">avg</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                          <span className="font-semibold">{model.ratingCount.toLocaleString()}</span>
                          <span className="text-[var(--muted-foreground)] text-xs">ratings</span>
                        </div>
                      </div>

                      <div className="h-1 rounded-full bg-[var(--muted)]/50 overflow-hidden max-w-xs">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            model.avgRating >= 4
                              ? "bg-[var(--primary)]"
                              : model.avgRating >= 3
                                ? "bg-[var(--accent)]"
                                : "bg-[var(--muted-foreground)]/60",
                          )}
                          style={{ width: `${ratingPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
