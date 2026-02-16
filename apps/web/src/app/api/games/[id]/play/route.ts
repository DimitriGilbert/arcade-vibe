import { auth } from "@arcade-vibe/auth";
import { db } from "@arcade-vibe/db";
import { games } from "@arcade-vibe/db/schema/games";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createGameSessionToken } from "@arcade-vibe/api/lib/game-session";
import {
  checkRateLimit,
  rateLimits,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limit";

// Arcade Vibe SDK template to be injected into game iframe
const SDK_TEMPLATE = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
    </style>
    <script>
      (function () {
        "use strict";
        const SESSION_TOKEN = "__ARCADE_VIBE_SESSION_TOKEN__";
        const API_ENDPOINT = "__ARCADE_VIBE_API_ENDPOINT__";
        const GAME_ID = "__ARCADE_VIBE_GAME_ID__";

        let sessionStart = Date.now();
        let lastHeartbeat = Date.now();
        let isSessionActive = true;

        const heartbeatInterval = setInterval(() => {
          if (!isSessionActive) return;
          const playtime = Math.floor((Date.now() - sessionStart) / 1000);
          fetch(\`\${API_ENDPOINT}/api/game-sdk/heartbeat\`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: \`Bearer \${SESSION_TOKEN}\`,
            },
            body: JSON.stringify({
              gameId: GAME_ID,
              playtime,
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          lastHeartbeat = Date.now();
        }, 5000);

        window.ArcadeVibe = {
          reportScore(score) {
            if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
              console.warn("[ArcadeVibe] Invalid score. Must be a positive integer.");
              return;
            }
            const playtime = Math.floor((Date.now() - sessionStart) / 1000);
            fetch(\`\${API_ENDPOINT}/api/game-sdk/score\`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: \`Bearer \${SESSION_TOKEN}\`,
              },
              body: JSON.stringify({
                gameId: GAME_ID,
                score,
                playtime,
                timestamp: Date.now(),
              }),
            }).catch(() => {
              console.warn("[ArcadeVibe] Failed to submit score.");
            });
          },
          getPlaytime() {
            return Math.floor((Date.now() - sessionStart) / 1000);
          },
          isReady() {
            return SESSION_TOKEN !== "__ARCADE_VIBE_SESSION_TOKEN__";
          },
        };

        window.addEventListener("beforeunload", () => {
          isSessionActive = false;
          clearInterval(heartbeatInterval);
          const playtime = Math.floor((Date.now() - sessionStart) / 1000);
          navigator.sendBeacon(
            \`\${API_ENDPOINT}/api/game-sdk/end-session\`,
            JSON.stringify({
              gameId: GAME_ID,
              token: SESSION_TOKEN,
              playtime,
            }),
          );
        });
      })();
    </script>
  </head>
  <body>
    __GAME_CODE__
  </body>
</html>`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limiting check
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimit(identifier, rateLimits.loose);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.resetIn);
  }

  const { id } = await params;

  // Validate game ID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return new NextResponse("Invalid game ID", { status: 400 });
  }

  // Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch game with prompt relation
  const gamesQuery = db.query.games;
  if (!gamesQuery) {
    return new NextResponse("Database query not available", { status: 500 });
  }

  const game = await gamesQuery.findFirst({
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
    return new NextResponse("Game not found", { status: 404 });
  }

  // Check access permissions
  const isPublic = game.status === "completed" && !game.isHidden;
  const isAuthor = session?.user?.id === game.prompt.authorId;
  let isAdmin = false;

  // Check admin/moderator role if user is logged in
  if (session?.user?.id) {
    const extendedUser = await db.query.userExtended.findFirst({
      where: eq(userExtended.id, session.user.id),
      columns: { role: true },
    });
    isAdmin =
      extendedUser?.role === "admin" || extendedUser?.role === "moderator";
  }

  // Access control: must be public, author, or admin
  if (!isPublic && !isAuthor && !isAdmin) {
    return new NextResponse("You do not have permission to access this game", {
      status: 403,
    });
  }

  // Check if game has data
  if (!game.gameData) {
    return new NextResponse("Game data not available", { status: 404 });
  }

  // For public games without session, create anonymous session token
  // For authenticated users, use their user ID
  const userId = session?.user?.id ?? `anonymous:${crypto.randomUUID()}`;
  const sessionToken = await createGameSessionToken(userId, game.id);

  // Get API endpoint from environment
  const apiEndpoint =
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.arcade-vibe.com";

  // Inject SDK script into game HTML
  const gameHtml = SDK_TEMPLATE.replace(
    "__ARCADE_VIBE_SESSION_TOKEN__",
    sessionToken,
  )
    .replace("__ARCADE_VIBE_API_ENDPOINT__", apiEndpoint)
    .replace("__ARCADE_VIBE_GAME_ID__", game.id)
    .replace("__GAME_CODE__", game.gameData);

  const cspDirectives = [
    "default-src *",
    "script-src * 'unsafe-inline' 'unsafe-eval'",
    "style-src * 'unsafe-inline'",
    "img-src * data: blob:",
    "font-src * data:",
    "connect-src *",
    "media-src * blob: data:",
    "object-src 'none'",
    "base-uri *",
    "form-action *",
  ].join("; ");

  return new NextResponse(gameHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Security-Policy": cspDirectives,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
