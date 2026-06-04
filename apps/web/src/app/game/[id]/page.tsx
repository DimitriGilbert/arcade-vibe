import type { Metadata } from "next";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { eq } from "drizzle-orm";
import GamePlayPage from "@/components/game-client";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getGameSeoData(gameId: string) {
  const [row] = await db
    .select({
      name: games.name,
      thumbnailUrl: games.thumbnailUrl,
      modelName: games.modelName,
      modelProvider: games.modelProvider,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
      promptContent: prompts.content,
      promptVisibility: prompts.visibility,
    })
    .from(games)
    .innerJoin(prompts, eq(games.promptId, prompts.id))
    .where(eq(games.id, gameId))
    .limit(1);

  return row ?? null;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { id: gameId } = await params;

  try {
    const row = await getGameSeoData(gameId);

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
        : `${getSiteUrl()}${row.thumbnailUrl}`
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
  const seoData = await getGameSeoData(id).catch(() => null);

  const canExposePrompt =
    seoData !== null &&
    seoData.promptVisibility === "public" &&
    seoData.promptContent.length > 0;
  const gameTitle =
    seoData?.name ??
    (canExposePrompt && seoData
      ? seoData.promptContent.slice(0, 100)
      : "AI-Generated Game");
  const gameUrl = toAbsoluteUrl(`/game/${id}`);
  const imageUrl = seoData?.thumbnailUrl
    ? seoData.thumbnailUrl.startsWith("http")
      ? seoData.thumbnailUrl
      : `${getSiteUrl()}${seoData.thumbnailUrl}`
    : undefined;

  return (
    <>
      {seoData && (
        <JsonLd
          id="game-play-json-ld"
          data={{
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "@id": `${gameUrl}#game`,
            name: gameTitle,
            url: gameUrl,
            description: canExposePrompt
              ? seoData.promptContent.slice(0, 500)
              : `Play this AI-generated game on Arcade Vibe.`,
            inLanguage: "en",
            applicationCategory: "Game",
            gamePlatform: "Web browser",
            playMode: "SinglePlayer",
            publisher: {
              "@id": `${getSiteUrl()}/#organization`,
            },
            ...(imageUrl ? { image: imageUrl } : {}),
            dateCreated: seoData.createdAt.toISOString(),
            dateModified: seoData.updatedAt.toISOString(),
            keywords: [
              seoData.modelName,
              seoData.modelProvider,
              "AI game",
              "browser game",
            ],
          }}
        />
      )}
      <GamePlayPage gameId={id} />
    </>
  );
}
