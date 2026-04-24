"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ArcadeBadge } from "@/components/arcade";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RouterOutput } from "@/lib/trpc-types";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Clock, Coins, Cpu, Search, Star, Swords, X } from "lucide-react";

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

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="h-3 w-3" />;
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}

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

function FilterDropdown({
  label,
  items,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (search ? items.filter((i) => i.toLowerCase().includes(search.toLowerCase())) : items),
    [items, search],
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:border-[var(--foreground)]/30 transition-colors"
      >
        {label}
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-mono tabular-nums">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg py-1">
            <div className="px-2 py-1.5 border-b border-[var(--border)]">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No matches</p>
              )}
              {filtered.map((item) => {
                const active = selected.includes(item);
                return (
                  <button
                    key={item}
                    onClick={(e) => { e.stopPropagation(); onToggle(item); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--muted)]/30 flex items-center gap-2 transition-colors"
                  >
                    <span className={`h-3 w-3 rounded-sm border flex-shrink-0 flex items-center justify-center ${active ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border)]"}`}>
                      {active && <span className="text-[var(--primary-foreground)] text-[8px] leading-none">&#10003;</span>}
                    </span>
                    <span className={active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <div className="border-t border-[var(--border)] px-2 py-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(); }}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const columns: ColumnDef<BenchmarkGame>[] = [
  {
    accessorKey: "modelName",
    header: "Model",
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || (filterValue as string[]).length === 0) return true;
      return (filterValue as string[]).includes(row.getValue("modelName") as string ?? "");
    },
    cell: ({ row }) => (
      <a
        href={`/game/${row.original.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
      >
        {row.original.modelName ?? "unknown"}
      </a>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <a
        href={`/game/${row.original.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate max-w-[200px] block"
      >
        {row.original.name ?? "Untitled"}
      </a>
    ),
  },
  {
    accessorKey: "tierSlug",
    header: "Tier",
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || (filterValue as string[]).length === 0) return true;
      return (filterValue as string[]).includes(row.getValue("tierSlug") as string ?? "");
    },
    cell: ({ row }) => {
      const slug = row.original.tierSlug;
      if (!slug) return null;
      return <ArcadeBadge text={slug} variant="default" />;
    },
    sortingFn: (a, b) => (a.original.tierSlug ?? "").localeCompare(b.original.tierSlug ?? ""),
  },
  {
    accessorKey: "outputTokens",
    header: "Out",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--muted-foreground)]">
        {formatTokens(row.original.outputTokens)}
      </span>
    ),
  },
  {
    accessorKey: "timeToFirstTokenMs",
    header: "TTFT",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--muted-foreground)]">
        {formatTtft(row.original.timeToFirstTokenMs)}
      </span>
    ),
  },
  {
    accessorKey: "requestCostUsd",
    header: "Cost",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--muted-foreground)]">
        {formatCost(row.original.requestCostUsd)}
      </span>
    ),
    sortingFn: (a, b) => (toNum(a.original.requestCostUsd) ?? 0) - (toNum(b.original.requestCostUsd) ?? 0),
  },
  {
    accessorKey: "totalPlays",
    header: "Plays",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--muted-foreground)]">
        {row.original.totalPlays}
      </span>
    ),
  },
  {
    accessorKey: "avgRating",
    header: "Rating",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--muted-foreground)]">
        {formatRating(row.original.avgRating)}
      </span>
    ),
    sortingFn: (a, b) => (a.original.avgRating ?? 0) - (b.original.avgRating ?? 0),
  },
  {
    accessorKey: "finalScore",
    header: "Score",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums font-semibold text-[var(--foreground)]">
        {formatScore(row.original.finalScore)}
      </span>
    ),
    sortingFn: (a, b) => (toNum(a.original.finalScore) ?? 0) - (toNum(b.original.finalScore) ?? 0),
  },
];

export default function BenchmarkView({ data }: { data: BenchmarkOutput }) {
  const { prompt, games } = data;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const uniqueModels = useMemo(
    () => [...new Set(games.map((g) => g.modelName ?? "unknown"))].sort(),
    [games],
  );
  const uniqueTiers = useMemo(
    () => [...new Set(games.map((g) => g.tierSlug).filter(Boolean))].sort() as string[],
    [games],
  );

  const models = uniqueModels.length;

  const selectedModels = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === "modelName");
    return (filter?.value as string[] | undefined) ?? [];
  }, [columnFilters]);

  const selectedTiers = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === "tierSlug");
    return (filter?.value as string[] | undefined) ?? [];
  }, [columnFilters]);

  function toggleFilter(columnId: string, value: string) {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === columnId);
      const current = (existing?.value as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const rest = prev.filter((f) => f.id !== columnId);
      return next.length > 0 ? [...rest, { id: columnId, value: next }] : rest;
    });
  }

  function clearFilter(columnId: string) {
    setColumnFilters((prev) => prev.filter((f) => f.id !== columnId));
  }

  const table = useReactTable({
    data: games,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--border)]">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <FilterDropdown
                label="Model"
                items={uniqueModels}
                selected={selectedModels}
                onToggle={(v) => toggleFilter("modelName", v)}
                onClear={() => clearFilter("modelName")}
              />

              {uniqueTiers.length > 1 && (
                <FilterDropdown
                  label="Tier"
                  items={uniqueTiers}
                  selected={selectedTiers}
                  onToggle={(v) => toggleFilter("tierSlug", v)}
                  onClear={() => clearFilter("tierSlug")}
                />
              )}

              <span className="text-xs text-[var(--muted-foreground)] font-mono tabular-nums ml-auto">
                {table.getFilteredRowModel().rows.length} row{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <table className="w-full text-sm">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-[var(--border)]">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className={`py-3 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted-foreground)] font-medium ${
                              ["modelName", "name", "tierSlug"].includes(header.id) ? "text-left" : "text-right"
                            } ${header.column.getCanSort() ? "cursor-pointer select-none hover:text-[var(--foreground)]" : ""}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="inline-flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`py-2.5 px-3 ${
                              ["modelName", "name", "tierSlug"].includes(cell.column.id) ? "" : "text-right"
                            }`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
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
