import type { Metadata } from "next";
import ArenaClient from "@/components/leaderboard/arena/arena-client";
import { trpcClient } from "@/utils/trpc";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const currentTheme = await trpcClient.themes.getCurrent.query();

    if (!currentTheme) {
      return {
        title: "Arena - Leaderboard",
        description: "Step into the arena and see who's on top",
      };
    }

    return {
      title: "Arena - Leaderboard",
      description: currentTheme.description
        ? `Arena showdown: ${currentTheme.title} - ${currentTheme.description}`
        : `Arena showdown for ${currentTheme.title} at Arcade Vibe`,
      openGraph: {
        title: `${currentTheme.title} Arena - Arcade Vibe`,
        description:
          currentTheme.description || `Who's winning ${currentTheme.title}?`,
      },
    };
  } catch {
    return {
      title: "Arena - Leaderboard",
      description: "Step into the arena and see who's on top",
    };
  }
}

export default function ArenaPage() {
  return <ArenaClient />;
}
