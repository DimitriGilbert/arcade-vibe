import type { NextRequest } from "next/server";

import { auth, getUserRole } from "@arcade-vibe/auth";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  const user = session?.user
    ? {
        id: session.user.id,
        role: await getUserRole(session.user.id),
      }
    : undefined;
  return {
    session,
    req,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>> & {
  user?: {
    id: string;
    role: "admin" | "moderator" | "participant" | "viewer";
  };
};
