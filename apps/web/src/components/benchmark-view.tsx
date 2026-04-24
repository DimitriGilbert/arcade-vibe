"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ArcadeBadge } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RouterOutput } from "@/lib/trpc-types";
import { Clock, Coins, Cpu, Star, Swords } from "lucide-react";

type BenchmarkOutput = RouterOutput["prompts"]["getBenchmark"];
type BenchmarkGame = BenchmarkOutput["games"][number];

function toNum(v: string | number | null): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? null : n;
}

function formatTtft(ms: number | null): string {
  if (ms == null) return "\u2014";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatCost(usd: string | number | null): string {
  const n = toNum(usd);
  if (n == null) return "\u2014";
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

function formatTokens(tokens: number | null): string {
  if (tokens == null) return "\u2014";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

function formatRating(rating: number | null): string {
  if (rating == null) return "\u2014";
  return rating.toFixed(1);
}

function formatScore(score: string | number | null): string {
  const n = toNum(score);
  if (n == null) return "\u2014";
  return n.toFixed(1);
}

function groupByModel(games: BenchmarkGame[]): Map<string, BenchmarkGame[]> {
  const map = new Map<string, BenchmarkGame[]>();
  for (const game of games) {
    const key = game.modelName ?? "unknown";
    const existing = map.get(key);
    if (existing) {
      existing.push(game);
    } else {
      map.set(key, [game]);
    }
  }
  return map;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

function ModelChart({
  title,
  icon,
  games,
  metricKey,
  formatter,
}: {
  title: string;
  icon: React.ReactNode;
  games: BenchmarkGame[];
  metricKey: keyof BenchmarkGame;
  formatter?: (v: number) => string;
}) {
  const { data, config } = useMemo(() => {
    const grouped = groupByModel(games);
    const modelNames = Array.from(grouped.keys()).sort();
    const cfg: ChartConfig = {};

    modelNames.forEach((model, i) => {
      const key = `model_${i}`;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      cfg[key] = { label: model, color };
    });

    const chartData = modelNames
      .map((model) => {
        const modelGames = grouped.get(model) ?? [];
        const values = modelGames
          .map((g) => toNum(g[metricKey] as string | number | null))
          .filter((v): v is number => v != null);
        return {
          model,
          value: values.length > 0 ? Math.round(average(values) * 100) / 100 : 0,
          fill: CHART_COLORS[modelNames.indexOf(model) % CHART_COLORS.length],
        };
      })
      .sort((a, b) => a.value - b.value);

    return { data: chartData, config: cfg };
  }, [games, metricKey]);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)]">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {icon}
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          {title}
        </span>
      </div>
      <ChartContainer config={config} className="h-[200px] w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatter} />
          <YAxis
            type="category"
            dataKey="model"
            tick={{ fontSize: 11 }}
            width={100}
            tickFormatter={(v: string) => v.length > 14 ? `${v.slice(0, 14)}\u2026` : v}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const num = Number(value);
                  return formatter ? formatter(num) : num.toLocaleString();
                }}
              />
            }
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

const COL_HEADER_CLASS =
  "py-3 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted-foreground)] font-medium";

export default function BenchmarkView({ data }: { data: BenchmarkOutput }) {
  const { prompt, games } = data;

  const models = useMemo(() => {
    const set = new Set<string>();
    for (const g of games) {
      if (g.modelName) set.add(g.modelName);
    }
    return set.size;
  }, [games]);

  const sortedGames = useMemo(
    () =>
      [...games].sort((a, b) => {
        const modelCompare = (a.modelName ?? "").localeCompare(b.modelName ?? "");
        if (modelCompare !== 0) return modelCompare;
        return (toNum(b.finalScore) ?? 0) - (toNum(a.finalScore) ?? 0);
      }),
    [games],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-3 border-b border-[var(--border)] pb-6 mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Benchmark
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            {prompt.title ?? "Benchmark"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              {models} model{models !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              {games.length} game{games.length !== 1 ? "s" : ""}
            </span>
            {prompt.themeTitle && (
              <span>{prompt.themeTitle}</span>
            )}
            {prompt.authorName && (
              <span>by {prompt.authorName}</span>
            )}
          </div>
        </header>

        {games.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
            <ModelChart
              title="Time to First Token"
              icon={<Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
              games={games}
              metricKey="timeToFirstTokenMs"
              formatter={(v: number) => formatTtft(v)}
            />
            <ModelChart
              title="Generation Cost"
              icon={<Coins className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
              games={games}
              metricKey="requestCostUsd"
              formatter={(v: number) => formatCost(v)}
            />
            <ModelChart
              title="Output Tokens"
              icon={<Cpu className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
              games={games}
              metricKey="outputTokens"
              formatter={(v: number) => formatTokens(v)}
            />
            <ModelChart
              title="Average Rating"
              icon={<Star className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
              games={games}
              metricKey="avgRating"
              formatter={(v: number) => formatRating(v)}
            />
          </div>
        )}

        {games.length > 0 && (
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)]">
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className={`${COL_HEADER_CLASS} text-left`}>Model</th>
                      <th className={`${COL_HEADER_CLASS} text-left`}>Name</th>
                      <th className={`${COL_HEADER_CLASS} text-left`}>Tier</th>
                      <th className={`${COL_HEADER_CLASS} text-right`}>Out</th>
                      <th className={`${COL_HEADER_CLASS} text-right`}>TTFT</th>
                      <th className={`${COL_HEADER_CLASS} text-right`}>Cost</th>
                      <th className={`${COL_HEADER_CLASS} text-right`}>Plays</th>
                      <th className={`${COL_HEADER_CLASS} text-right`}>Rating</th>
                      <th className={`${COL_HEADER_CLASS} text-right`}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGames.map((game) => (
                      <tr
                        key={game.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <a
                            href={`/game/${game.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                          >
                            {game.modelName ?? "unknown"}
                          </a>
                        </td>
                        <td className="py-2.5 px-3">
                          <a
                            href={`/game/${game.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate max-w-[200px] block"
                          >
                            {game.name ?? "Untitled"}
                          </a>
                        </td>
                        <td className="py-2.5 px-3">
                          {game.tierSlug && (
                            <ArcadeBadge text={game.tierSlug} variant="default" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--muted-foreground)]">
                          {formatTokens(game.outputTokens)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--muted-foreground)]">
                          {formatTtft(game.timeToFirstTokenMs)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--muted-foreground)]">
                          {formatCost(game.requestCostUsd)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--muted-foreground)]">
                          {game.totalPlays}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--muted-foreground)]">
                          {formatRating(game.avgRating)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[var(--foreground)]">
                          {formatScore(game.finalScore)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </section>
        )}

        {games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Swords className="h-10 w-10 text-[var(--muted-foreground)]/30" />
            <p className="text-sm text-[var(--muted-foreground)]">
              No games found for this benchmark
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
