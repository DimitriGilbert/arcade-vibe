import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@arcade-vibe/auth";
import { GamePlayerEmbed } from "./game-player-embed";

interface EmbedPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return <EmbedError message="Invalid game ID" />;
  }

  const game = await db.query.games.findFirst({
    where: eq(games.id, id),
    with: {
      prompt: {
        with: {
          user: {
            columns: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!game) {
    return <EmbedError message="Game not found" />;
  }

  const isPublic = game.status === "completed" && !game.isHidden;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthor = session?.user?.id === game.prompt.authorId;
  let isAdmin = false;

  if (session?.user?.id) {
    const extendedUser = await db.query.userExtended.findFirst({
      where: eq(userExtended.id, session.user.id),
      columns: { role: true },
    });
    isAdmin = extendedUser?.role === "admin" || extendedUser?.role === "moderator";
  }

  if (!isPublic && !isAuthor && !isAdmin) {
    return <EmbedError message="This game is not publicly available" />;
  }

  if (!game.gameData) {
    return <EmbedError message="Game data not available" />;
  }

  return <GamePlayerEmbed gameId={game.id} />;
}

function EmbedError({ message }: { message: string }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
