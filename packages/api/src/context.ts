import type { NextRequest } from "next/server";

import { auth } from "@arcade-vibe/auth";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  const user = session?.user ? {
    id: session.user.id,
    role: ((session.user as { role?: string }).role || 'participant') as "admin" | "moderator" | "participant" | "viewer"
  } : undefined;
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
