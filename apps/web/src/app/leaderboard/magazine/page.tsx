import type { Metadata } from "next";
import LeaderboardMagazineClient from "@/components/leaderboard/magazine/leaderboard-magazine-client";
import { trpcClient } from "@/utils/trpc";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const currentTheme = await trpcClient.themes.getCurrent.query();

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

export default async function LeaderboardMagazinePage() {
  const currentTheme = await trpcClient.themes.getCurrent.query().catch(() => null);
  const allThemes = await trpcClient.themes.list.query().catch(() => []);
  const initialLeaderboardResult = currentTheme
    ? await trpcClient.leaderboard.getTop
        .query({
          themeId: currentTheme.id,
          limit: 50,
        })
        .catch(() => null)
    : null;

  return (
    <LeaderboardMagazineClient
      initialCurrentTheme={currentTheme}
      initialThemes={allThemes}
      initialLeaderboardResult={initialLeaderboardResult}
    />
  );
}
