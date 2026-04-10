"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Cpu, Gamepad2, LayoutGrid, Newspaper, Search, Star, Trophy } from "lucide-react";

import {
  ArcadeBadge,
  ArcadeButton,
  ArcadeCard,
  ArcadeInput,
} from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import { getModelDetailRoute } from "@/lib/model-routes";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";

type SortField = "games" | "rating" | "ratings" | "name";

const SORT_OPTIONS: Array<{ label: string; value: SortField }> = [
  { label: "Games", value: "games" },
  { label: "Avg rating", value: "rating" },
  { label: "Ratings", value: "ratings" },
  { label: "Name", value: "name" },
];

export default function ModelsPage() {
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

    const withGames = models.filter((model) => model.gameCount > 0);

    const result = normalized.length
      ? withGames.filter((model) => {
          const haystack = [
            model.modelName,
            model.tier,
            model.tierName,
            ...model.providers,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalized);
        })
      : withGames;

    return [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.modelName.localeCompare(b.modelName);
      }

      if (sortBy === "games") {
        return b.gameCount - a.gameCount;
      }

      if (sortBy === "rating") {
        return b.avgRating - a.avgRating;
      }

      return b.ratingCount - a.ratingCount;
    });
  }, [models, query, sortBy]);

  const totals = useMemo(() => {
    if (!models) {
      return {
        models: 0,
        games: 0,
        ratedModels: 0,
      };
    }

    const withGames = models.filter((model) => model.gameCount > 0);

    return {
      models: withGames.length,
      games: withGames.reduce((sum, model) => sum + model.gameCount, 0),
      ratedModels: withGames.filter((model) => model.ratingCount > 0).length,
    };
  }, [models]);

  if (isLoading) {
    return <LoadingState centered message="Loading models..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="container mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mr-2">View as:</span>
          <Link href="/models/v1" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors">
            <Trophy className="h-3.5 w-3.5" />
            Arena
          </Link>
          <Link href="/models/v2" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors">
            <Newspaper className="h-3.5 w-3.5" />
            Magazine
          </Link>
          <Link href="/models/v3" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors">
            <LayoutGrid className="h-3.5 w-3.5" />
            Matrix
          </Link>
        </div>
        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <ArcadeCard className="overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Model Directory
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--foreground)]">
                Pick the engine,
                <span className="block text-[var(--primary)]">inspect the output.</span>
              </h1>
            </div>
            <div className="p-6">
              <p className="text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                This board ranks active models by production signal: published games,
                live ratings, and average score quality.
              </p>
            </div>
          </ArcadeCard>

          <ArcadeCard>
            <div className="p-6 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  Models
                </p>
                <p className="mt-1 text-2xl font-bold">{totals.models}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  Games
                </p>
                <p className="mt-1 text-2xl font-bold">{totals.games.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  Rated
                </p>
                <p className="mt-1 text-2xl font-bold">{totals.ratedModels}</p>
              </div>
            </div>
          </ArcadeCard>
        </section>

        <ArcadeCard className="p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <ArcadeInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by model, tier, provider"
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <ArcadeButton
                  key={option.value}
                  size="sm"
                  variant={sortBy === option.value ? "primary" : "outline"}
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </ArcadeButton>
              ))}
            </div>
          </div>
        </ArcadeCard>

        {filtered.length === 0 ? (
          <ArcadeCard className="p-12">
            <EmptyState title="No models found" message="Try a different filter." />
          </ArcadeCard>
        ) : (
          <section className="grid gap-3">
            {filtered.map((model, index) => {
              const ratingPct = Math.max(0, Math.min(100, (model.avgRating / 5) * 100));

              return (
                <Link
                  key={model.id}
                  href={getModelDetailRoute(model.modelName, model.id)}
                  className="group"
                >
                  <ArcadeCard className="p-4 transition-all duration-200 group-hover:border-[var(--primary)]/60 group-hover:bg-[var(--muted)]/20">
                    <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                      <div className="w-14 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-center">
                        <p className="text-[10px] text-[var(--muted-foreground)]">RANK</p>
                        <p className="text-lg font-bold">{index + 1}</p>
                      </div>

                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-bold group-hover:text-[var(--primary)]">
                            {model.modelName}
                          </h2>
                          <ArcadeBadge text={model.tierName} variant="default" />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {model.providers.map((provider) => (
                            <ArcadeBadge
                              key={provider}
                              text={provider}
                              className="bg-[var(--muted)]/60 text-xs"
                            />
                          ))}
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
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
                      </div>

                      <div className="grid grid-cols-3 gap-3 lg:min-w-[280px]">
                        <StatTile icon={<Gamepad2 className="h-4 w-4" />} label="Games" value={model.gameCount.toLocaleString()} />
                        <StatTile
                          icon={<Star className="h-4 w-4" />}
                          label="Avg"
                          value={model.avgRating > 0 ? model.avgRating.toFixed(2) : "-"}
                        />
                        <StatTile icon={<Cpu className="h-4 w-4" />} label="Ratings" value={model.ratingCount.toLocaleString()} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end text-xs text-[var(--muted-foreground)]">
                      <span className="inline-flex items-center gap-1 group-hover:text-[var(--foreground)]">
                        Open model profile
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </ArcadeCard>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-2 py-2 text-center">
      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
