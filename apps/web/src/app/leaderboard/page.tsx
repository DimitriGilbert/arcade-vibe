import type { Metadata } from "next";
import type { Route } from "next";

import { auth } from "@arcade-vibe/auth";
import { db } from "@arcade-vibe/db";
import {
  DEFAULT_LEADERBOARD_IMPLEMENTATION_PREFERENCE,
  userPreferences,
} from "@arcade-vibe/db/schema/user-preferences";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Leaderboard - Arcade Vibe",
  description: "Explore the leaderboard. Check out games in Arena, Dashboard, or Magazine view.",
};

export default async function LeaderboardLandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.id) {
    const preferences = await db.query.userPreferences.findFirst({
      where: and(
        eq(userPreferences.userId, session.user.id),
        eq(userPreferences.name, DEFAULT_LEADERBOARD_IMPLEMENTATION_PREFERENCE),
      ),
      columns: {
        value: true,
      },
    });

    if (preferences?.value) {
      redirect(`/leaderboard/${preferences.value}` as Route);
    }
  }

  redirect("/leaderboard/magazine" as Route);
}
