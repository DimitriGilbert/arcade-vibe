import type { Metadata } from "next";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { eq } from "drizzle-orm";
import GamePlayPage from "@/components/game-client";

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
    const [row] = await db
      .select({
        name: games.name,
        thumbnailUrl: games.thumbnailUrl,
        promptContent: prompts.content,
        promptVisibility: prompts.visibility,
      })
      .from(games)
      .innerJoin(prompts, eq(games.promptId, prompts.id))
      .where(eq(games.id, gameId))
      .limit(1);

    if (!row) {
      return { title: "Game Not Found" };
    }

    const canExposePrompt =
      row.promptVisibility === "public" && row.promptContent.length > 0;
    const ogTitle =
      row.name ||
      (canExposePrompt ? row.promptContent.slice(0, 100) : "AI-Generated Game");
    const ogDescription = row.name
      ? `Play "${row.name}" on Arcade Vibe`
      : canExposePrompt
        ? row.promptContent
        : "Play this AI-generated game on Arcade Vibe";
    const ogImage = row.thumbnailUrl
      ? row.thumbnailUrl.startsWith("http")
        ? row.thumbnailUrl
        : `${baseUrl}${row.thumbnailUrl}`
      : undefined;

    return {
      title: row.name || (canExposePrompt ? `${row.promptContent.slice(0, 50)}...` : "Game"),
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
