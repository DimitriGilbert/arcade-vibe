"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Cpu,
  Gamepad2,
  LayoutGrid,
  List,
  Search,
  Star,
} from "lucide-react";

import { ArcadeBadge, ArcadeInput } from "@/components/arcade";
import { EmptyState, LoadingState } from "@/components/reusable";
import { getModelDetailRoute } from "@/lib/model-routes";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";

type SortField = "games" | "rating" | "ratings" | "name";
type ViewMode = "grid" | "table";

const SORT_OPTIONS: Array<{ label: string; value: SortField }> = [
  { label: "Games", value: "games" },
  { label: "Rating", value: "rating" },
  { label: "Ratings", value: "ratings" },
  { label: "Name", value: "name" },
];

export default function ModelsV3Page() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("games");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

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

  const maxGames = filtered.length > 0 ? filtered[0].gameCount : 1;

  if (isLoading) {
    return <LoadingState centered message="Loading matrix..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-8 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-3xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Model Matrix
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
              {totals.models} models / {totals.games.toLocaleString()} games / {totals.ratedModels} rated
            </p>
          </div>
          <div className="flex items-center gap-1 border border-[var(--border)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <ArcadeInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter..."
              className="pl-10 font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSortBy(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded border transition-all",
                  sortBy === option.value
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20">
            <EmptyState title="No models found" message="Adjust your filter." />
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                    Model
                  </th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider hidden md:table-cell">
                    Distribution
                  </th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider text-right">
                    Games
                  </th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider text-right">
                    Rating
                  </th>
                  <th className="pb-3 pr-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider text-right hidden sm:table-cell">
                    Votes
                  </th>
                  <th className="pb-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((model, index) => {
                  const barPct = Math.max(2, (model.gameCount / maxGames) * 100);
                  const ratingPct = Math.max(0, Math.min(100, (model.avgRating / 5) * 100));

                  return (
                    <tr
                      key={model.id}
                      className="group border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/20 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-[var(--muted-foreground)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={getModelDetailRoute(model.modelName, model.id)}
                          className="group/link inline-flex flex-col gap-1"
                        >
                          <span className="font-semibold group-hover/link:text-[var(--primary)] transition-colors">
                            {model.modelName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <ArcadeBadge text={model.tierName} variant="default" />
                            {model.providers.slice(0, 2).map((p) => (
                              <span
                                key={p}
                                className="text-[10px] text-[var(--muted-foreground)] uppercase"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 rounded-full bg-[var(--muted)]/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--primary)]/70 transition-all"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <div className="w-16 h-2 rounded-full bg-[var(--muted)]/30 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                model.avgRating >= 4
                                  ? "bg-emerald-500/70"
                                  : model.avgRating >= 3
                                    ? "bg-amber-500/70"
                                    : "bg-red-500/50",
                              )}
                              style={{ width: `${ratingPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Link
                          href={getModelDetailRoute(model.modelName, model.id)}
                          className="font-mono font-bold"
                        >
                          {model.gameCount.toLocaleString()}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Link
                          href={getModelDetailRoute(model.modelName, model.id)}
                          className={cn(
                            "font-mono font-bold",
                            model.avgRating >= 4
                              ? "text-emerald-400"
                              : model.avgRating >= 3
                                ? "text-amber-400"
                                : "",
                          )}
                        >
                          {model.avgRating > 0 ? model.avgRating.toFixed(2) : "—"}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-right hidden sm:table-cell">
                        <Link
                          href={getModelDetailRoute(model.modelName, model.id)}
                          className="font-mono text-[var(--muted-foreground)]"
                        >
                          {model.ratingCount.toLocaleString()}
                        </Link>
                      </td>
                      <td className="py-3 w-8">
                        <Link href={getModelDetailRoute(model.modelName, model.id)}>
                          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((model, index) => {
              const ratingPct = Math.max(0, Math.min(100, (model.avgRating / 5) * 100));

              return (
                <Link
                  key={model.id}
                  href={getModelDetailRoute(model.modelName, model.id)}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-lg border border-[var(--border)] p-4 hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]/10 transition-all">
                    <div className="absolute top-2 right-2 text-[10px] font-mono text-[var(--muted-foreground)]/50">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--muted)]/40 border border-[var(--border)] shrink-0">
                        <Gamepad2 className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                          {model.modelName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ArcadeBadge text={model.tierName} variant="default" />
                          {model.providers.slice(0, 1).map((p) => (
                            <span
                              key={p}
                              className="text-[10px] text-[var(--muted-foreground)] uppercase"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-[var(--muted)]/50 overflow-hidden">
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

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-[var(--muted-foreground)]" />
                        <span className="font-mono font-bold">{model.gameCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-[var(--muted-foreground)]" />
                        <span className="font-mono font-bold">
                          {model.avgRating > 0 ? model.avgRating.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-[var(--muted-foreground)]" />
                        <span className="font-mono font-bold">{model.ratingCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
