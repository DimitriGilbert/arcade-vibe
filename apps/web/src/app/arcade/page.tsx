import type { Metadata } from "next";
import ArcadeClient from "@/components/arcade-client";
import { trpcClient } from "@/utils/trpc";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const currentTheme = await trpcClient.themes.getCurrent.query();

    if (!currentTheme) {
      return {
        title: "Arcade",
        description: "Discover and play AI-generated games at Arcade Vibe",
      };
    }

    return {
      title: "Arcade",
      description: currentTheme.description
        ? `${currentTheme.title}: ${currentTheme.description}`
        : `Play AI-generated games in the ${currentTheme.title} theme at Arcade Vibe`,
      openGraph: {
        title: `${currentTheme.title} - Arcade Vibe`,
        description:
          currentTheme.description || `Monthly theme: ${currentTheme.title}`,
      },
    };
  } catch {
    return {
      title: "Arcade",
      description: "Discover and play AI-generated games at Arcade Vibe",
    };
  }
}

export default function ArcadePage() {
  return <ArcadeClient />;
}
