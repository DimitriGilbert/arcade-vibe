import { db } from "./index";
import { themes } from "./schema/themes";
import { eq } from "drizzle-orm";

const FREE_THEME_SLUG = "Bring Your Own Theme";

const FREE_FORM_SYSTEM_PROMPT = `## Your Mission

Create a complete, self-contained browser game based on the theme or concept provided by the user.

## Controls

Unless overriden by user :

Implement both:
- **Keyboard** — whichever keys fit the game (arrows, WASD, spacebar, etc.)
- **Touch/pointer** — tap, swipe, or drag equivalents so the game is fully playable on mobile

## Authorized Libraries

The following libraries are available via CDN and may be used if they genuinely improve the game.
Only import what you actually use.`;

const freeThemeData = {
  title: FREE_THEME_SLUG,
  description:
    "Create games without a specific theme. Let your creativity run wild!",
  status: "active" as const,
  visibility: "public" as const,
  startDate: new Date("2020-01-01T00:00:00Z"),
  endDate: new Date("2100-12-31T23:59:59Z"),
  requirements: [],
  systemPrompt: FREE_FORM_SYSTEM_PROMPT,
  isPermanent: true,
};

async function seedFreeTheme() {
  console.log("Seeding free theme...");

  const existing = await db.query.themes.findFirst({
    where: eq(themes.title, FREE_THEME_SLUG),
  });

  if (existing) {
    console.log(`  Free theme already exists (id: ${existing.id})`);
    return;
  }

  const [inserted] = await db.insert(themes).values(freeThemeData).returning();
  console.log(`  Created free theme (id: ${inserted?.id})`);
  console.log("Done!");
}

seedFreeTheme().catch(console.error);
