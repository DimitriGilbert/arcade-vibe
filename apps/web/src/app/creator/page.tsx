import type { Route } from "next";

import { auth } from "@arcade-vibe/auth";
import { db } from "@arcade-vibe/db";
import {
  DEFAULT_CREATOR_IMPLEMENTATION_PREFERENCE,
  userPreferences,
} from "@arcade-vibe/db/schema/user-preferences";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CreatorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.id) {
    const preferences = await db.query.userPreferences.findFirst({
      where: and(
        eq(userPreferences.userId, session.user.id),
        eq(userPreferences.name, DEFAULT_CREATOR_IMPLEMENTATION_PREFERENCE),
      ),
      columns: {
        value: true,
      },
    });

    if (preferences?.value) {
      redirect(`/creator/${preferences.value}` as Route);
    }
  }
  redirect("/creator/ide");
}
