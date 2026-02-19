import type { Metadata } from "next";
import CabinetLeaderboardClient from "@/components/leaderboard/cabinet/cabinet-leaderboard-client";
import { trpcClient } from "@/utils/trpc";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const themes = await trpcClient.themes.list.query();
    const currentTheme = themes.find((t) => t.status === "active");

    if (!currentTheme) {
      return {
        title: "Cabinet Leaderboard | Arcade Vibe",
        description: "Check out the top games in the arcade cabinet",
      };
    }

    return {
      title: `${currentTheme.title} Leaderboard | Arcade Vibe`,
      description: `Top games in ${currentTheme.title} - Arcade cabinet style leaderboard`,
      openGraph: {
        title: `${currentTheme.title} Leaderboard - Arcade Vibe`,
        description: `See who's crushing it in ${currentTheme.title}`,
      },
    };
  } catch {
    return {
      title: "Cabinet Leaderboard | Arcade Vibe",
      description: "Check out the top games in the arcade cabinet",
    };
  }
}

export default function CabinetLeaderboardPage() {
  return <CabinetLeaderboardClient />;
}
