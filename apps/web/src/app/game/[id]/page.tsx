import type { Metadata } from "next";
import GamePlayPage from "@/components/game-client";
import { trpcClient } from "@/utils/trpc";

interface GamePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const gameId = params.id;

  try {
    const game = await trpcClient.games.getById.query({ id: gameId });

    if (!game) {
      return { title: "Game Not Found" };
    }

    return {
      title: game.prompt?.content
        ? `${game.prompt.content.slice(0, 50)}...`
        : "Game",
      description:
        game.prompt?.content || `Play this AI-generated game on Arcade Vibe`,
      openGraph: {
        title: game.prompt?.content?.slice(0, 100) || "AI-Generated Game",
        description: game.prompt?.content || "Play this AI-generated game",
      },
    };
  } catch {
    return {
      title: "Game",
    };
  }
}

export default function GamePage({ params }: GamePageProps) {
  return <GamePlayPage params={params} />;
}
