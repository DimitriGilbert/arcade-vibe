import type { Metadata } from "next";
import GamePlayPage from "@/components/game-client";
import { trpcClient } from "@/utils/trpc";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

    const ogTitle =
      game.name ||
      (canExposePrompt ? game.prompt.content.slice(0, 100) : "AI-Generated Game");
    const ogDescription = game.name
      ? `Play "${game.name}" on Arcade Vibe`
      : promptDescription;

    const ogImage = game.thumbnailUrl
      ? `${baseUrl}${game.thumbnailUrl}`
      : undefined;

    return {
      title: game.name || promptTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        ...(ogImage && { images: [ogImage] }),
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        ...(ogImage && { images: [ogImage] }),
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
