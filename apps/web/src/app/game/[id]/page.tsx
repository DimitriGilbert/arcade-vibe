import type { Metadata } from "next";
import GamePlayPage from "@/components/game-client";
import { trpcClient } from "@/utils/trpc";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { id: gameId } = await params;

  try {
    const game = await trpcClient.games.getById.query({ id: gameId });

    if (!game) {
      return { title: "Game Not Found" };
    }

    const canExposePrompt =
      game.prompt?.visibility === "public" && game.prompt.content.length > 0;
    const promptTitle = canExposePrompt
      ? `${game.prompt.content.slice(0, 50)}...`
      : "Game";
    const promptDescription = canExposePrompt
      ? game.prompt.content
      : "Play this AI-generated game on Arcade Vibe";

    return {
      title: game.name || promptTitle,
      description: game.name
        ? `Play "${game.name}" on Arcade Vibe`
        : promptDescription,
      openGraph: {
        title: game.name || (canExposePrompt ? game.prompt.content.slice(0, 100) : "AI-Generated Game"),
        description: game.name
          ? `Play "${game.name}" on Arcade Vibe`
          : promptDescription,
      },
    };
  } catch {
    return {
      title: "Game",
    };
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  return <GamePlayPage gameId={id} />;
}
