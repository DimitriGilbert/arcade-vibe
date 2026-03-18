import type { Metadata, Route } from "next";
import Link from "next/link";
import { Trophy, Calendar, Gamepad2, TrendingUp } from "lucide-react";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import { getServerCaller } from "@/utils/trpc-server";
import type { LeaderboardEntry, ThemeList } from "@/lib/trpc-types";
import {
  CoverStoryCard,
  CompactLeaderboardRow,
  ThemeHero,
  MagazineThemeSelector,
} from "@/components/leaderboard/magazine";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 250;

function serializeDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function serializeTheme(theme: {
  id: string;
  title: string;
  description: string;
  status: "upcoming" | "active" | "frozen" | "archived";
  visibility: "private" | "public_on_freeze" | "public";
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mediaConfig: ThemeList["mediaConfig"];
}): ThemeList {
  return {
    ...theme,
    startDate: serializeDate(theme.startDate),
    endDate: serializeDate(theme.endDate),
    createdAt: theme.createdAt.toISOString(),
    updatedAt: theme.updatedAt.toISOString(),
  };
}

function serializeLeaderboardEntry(entry: {
  createdAt: Date;
  submittedAt: Date | null;
  calculatedAt: Date | null;
  theme: {
    id: string;
    title: string | null;
  } | null;
} & Omit<LeaderboardEntry, "createdAt" | "submittedAt" | "calculatedAt" | "theme">): LeaderboardEntry {
  return {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    submittedAt: serializeDate(entry.submittedAt),
    calculatedAt: serializeDate(entry.calculatedAt),
    theme: entry.theme,
  };
}

interface LeaderboardMagazinePageProps {
  searchParams?: Promise<{
    themeId?: string;
    limit?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const caller = await getServerCaller();

  try {
    const currentTheme = await caller.themes.getCurrent();

    if (!currentTheme) {
      return {
        title: "Leaderboard - Arcade Vibe",
        description: "See who's making waves this month",
      };
    }

    return {
      title: `Leaderboard - ${currentTheme.title} | Arcade Vibe`,
      description: `Check out the top games in ${currentTheme.title}. Who's crushing it this month?`,
      openGraph: {
        title: `${currentTheme.title} Leaderboard - Arcade Vibe`,
        description: currentTheme.description || `Top games in ${currentTheme.title}`,
      },
    };
  } catch {
    return {
      title: "Leaderboard - Arcade Vibe",
      description: "See who's making waves this month",
    };
  }
}

export default async function LeaderboardMagazinePage({
  searchParams,
}: LeaderboardMagazinePageProps) {
  const caller = await getServerCaller();
  const resolvedSearchParams = await searchParams;
  const rawAllThemes = await caller.themes.list().catch(() => []);
  const rawActiveTheme = await caller.themes.getCurrent().catch(() => null);
  const rawSelectedTheme = resolvedSearchParams?.themeId
    ? rawAllThemes.find((theme) => theme.id === resolvedSearchParams.themeId) ?? null
    : null;
  const rawCurrentTheme = rawSelectedTheme ?? rawActiveTheme;
  const allThemes = rawAllThemes.map(serializeTheme);
  const currentTheme = rawCurrentTheme ? serializeTheme(rawCurrentTheme) : null;

  const parsedLimit = Number(resolvedSearchParams?.limit ?? DEFAULT_PAGE_SIZE);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.floor(parsedLimit), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const rawLeaderboardResult = rawCurrentTheme
    ? await caller.leaderboard.getTop({
          themeId: rawCurrentTheme.id,
          limit,
        })
        .catch(() => null)
    : null;
  const leaderboardResult = rawLeaderboardResult
    ? {
        ...rawLeaderboardResult,
        entries: rawLeaderboardResult.entries.map(serializeLeaderboardEntry),
      }
    : null;

  const entries = leaderboardResult?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const nextParams = new URLSearchParams();
  if (currentTheme?.id) {
    nextParams.set("themeId", currentTheme.id);
  }
  nextParams.set("limit", String(Math.min(limit + DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)));
  const loadMoreHref = `/leaderboard/magazine?${nextParams.toString()}` as Route;

  if (!currentTheme) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto">
          <ArcadeCard className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
            <h1 className="text-2xl font-bold mb-4">No Active Theme</h1>
            <p className="text-[var(--muted-foreground)] mb-8">Check back for the next theme.</p>
            <Link href="/creator">
              <ArcadeButton variant="primary">
                <Gamepad2 className="h-4 w-4" />
                Browse Games
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 md:px-6">
      <div className="container mx-auto space-y-12">
        <ThemeHero
          title={currentTheme.title}
          description={currentTheme.description}
          endDate={currentTheme.endDate}
          entryCount={entries.length}
          themeSelector={
            allThemes.length > 1 ? (
              <MagazineThemeSelector
                currentTheme={currentTheme}
                themes={allThemes}
              />
            ) : null
          }
        />

        {entries.length === 0 ? (
          <ArcadeCard className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">No Games Yet</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              Be the first to submit a game for this theme.
            </p>
            <Link href="/creator">
              <ArcadeButton variant="glow">
                <Gamepad2 className="h-4 w-4" />
                Create a Game
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        ) : (
          <>
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="h-6 w-6 text-[var(--accent)]" />
                <h2 className="text-2xl font-bold">Top 3</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {top3.map((entry, idx) => (
                  <CoverStoryCard key={entry.gameId} entry={entry} rank={idx + 1} />
                ))}
              </div>
            </section>

            {rest.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <h2 className="text-xl font-bold">Rankings</h2>
                </div>

                <ArcadeCard>
                  <div className="max-h-[600px] overflow-auto">
                    <div className="divide-y divide-[var(--border)]">
                      {rest.map((entry, idx) => (
                        <CompactLeaderboardRow key={entry.gameId} entry={entry} rank={idx + 4} />
                      ))}
                    </div>
                  </div>
                </ArcadeCard>

                {leaderboardResult?.hasMore && limit < MAX_PAGE_SIZE && (
                  <div className="flex justify-center mt-6">
                    <Link href={loadMoreHref}>
                      <ArcadeButton variant="outline">
                        Load More
                      </ArcadeButton>
                    </Link>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <section className="pb-12">
          <ArcadeCard className="p-8 text-center bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
            <h3 className="text-xl font-bold mb-3">Create a Game</h3>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              Write a prompt, pick your AI model, and generate a game.
            </p>
            <Link href="/creator">
              <ArcadeButton variant="glow" size="lg">
                <Gamepad2 className="h-5 w-5" />
                Start Creating
              </ArcadeButton>
            </Link>
          </ArcadeCard>
        </section>
      </div>
    </main>
  );
}
