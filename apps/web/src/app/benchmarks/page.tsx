import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Cpu, Gamepad2, Swords } from "lucide-react";

import { db } from "@arcade-vibe/db";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { games } from "@arcade-vibe/db/schema/games";
import { eq, desc, and, isNull, sql, inArray } from "drizzle-orm";

import { ArcadeCard } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Benchmarks | Arcade Vibe",
  description:
    "Browse benchmark prompts comparing AI model performance across game generations.",
};

const getCachedBenchmarksList = unstable_cache(
  async () => {
    const rows = await db.query.prompts.findMany({
      where: and(eq(prompts.isBenchmark, true), isNull(prompts.hiddenAt)),
      columns: {
        id: true,
        title: true,
        content: true,
        themeId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(prompts.updatedAt)],
      limit: 51,
      with: {
        theme: { columns: { id: true, title: true } },
        user: { columns: { id: true, name: true, image: true } },
      },
    });

    const hasMore = rows.length > 50;
    const items = hasMore ? rows.slice(0, -1) : rows;
    const promptIds = items.map((p) => p.id);

    const [gameCounts, modelCounts] = await Promise.all([
      promptIds.length > 0
        ? db
            .select({
              promptId: games.promptId,
              count: sql<number>`count(*)`,
            })
            .from(games)
            .where(
              and(
                inArray(games.promptId, promptIds),
                isNull(games.deletedAt),
              ),
            )
            .groupBy(games.promptId)
        : [],
      promptIds.length > 0
        ? db
            .select({
              promptId: games.promptId,
              modelCount: sql<number>`count(distinct ${games.modelName})`,
            })
            .from(games)
            .where(
              and(
                inArray(games.promptId, promptIds),
                isNull(games.deletedAt),
              ),
            )
            .groupBy(games.promptId)
        : [],
    ]);

    const gameCountMap = new Map(
      gameCounts.map((r) => [r.promptId, Number(r.count)]),
    );
    const modelCountMap = new Map(
      modelCounts.map((r) => [r.promptId, Number(r.modelCount)]),
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        theme: item.theme,
        author: item.user,
        gameCount: gameCountMap.get(item.id) ?? 0,
        modelCount: modelCountMap.get(item.id) ?? 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      nextCursor: hasMore
        ? (items[items.length - 1]?.id ?? null)
        : null,
    };
  },
  ["benchmarks-list"],
  { revalidate: 300, tags: ["benchmarks"] },
);

export default async function BenchmarksPage() {
  const data = await getCachedBenchmarksList();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="space-y-4 border-b border-[var(--border)] pb-6 mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Benchmarks
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Model Benchmarks
              </h1>
              <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
                Standardized prompts comparing AI model performance across game quality, speed, and cost.
              </p>
            </div>
            {data.items.length > 0 && (
              <ul className="flex flex-wrap gap-2 text-xs">
                <li className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
                  {data.items.length} benchmark{data.items.length !== 1 ? "s" : ""}
                </li>
              </ul>
            )}
          </div>
        </header>

        {data.items.length === 0 ? (
          <ArcadeCard className="p-12">
            <EmptyState
              icon={<Swords className="h-12 w-12" />}
              title="No benchmarks yet"
              message="Benchmarks will appear here as prompts are marked for comparison testing."
            />
          </ArcadeCard>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Benchmark</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider hidden sm:table-cell">Games</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider hidden sm:table-cell">Models</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--muted-foreground)] text-xs uppercase tracking-wider hidden md:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const href = `/benchmarks/${item.id}` as Route;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link href={href} className="font-semibold hover:text-[var(--primary)] transition-colors">
                          {item.title ?? "Untitled Benchmark"}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          {item.author && <span>{item.author.name ?? "Anonymous"}</span>}
                          {item.theme && item.author && <span>/</span>}
                          {item.theme && <span>{item.theme.title}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-mono tabular-nums hover:text-[var(--primary)] transition-colors">
                          <Gamepad2 className="h-3 w-3" />
                          {item.gameCount}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-mono tabular-nums hover:text-[var(--primary)] transition-colors">
                          <Cpu className="h-3 w-3" />
                          {item.modelCount}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-[var(--muted-foreground)] font-mono tabular-nums hidden md:table-cell">
                        <Link href={href} className="hover:text-[var(--primary)] transition-colors">
                          {new Date(item.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
