#!/usr/bin/env node
/**
 * Update Platform Stats Job
 *
 * This job recalculates and updates the platform_stats table with current counts.
 * It can be run manually or scheduled as a cron job.
 *
 * Usage:
 *   pnpm run update-platform-stats
 */

import { db } from "@arcade-vibe/db";
import { user, session } from "@arcade-vibe/db/schema/auth";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { games } from "@arcade-vibe/db/schema/games";
import { ratings } from "@arcade-vibe/db/schema/ratings";
import { platformStats } from "@arcade-vibe/db/schema/platform";
import { count, avg, desc, eq, sql } from "drizzle-orm";

async function updatePlatformStats(): Promise<void> {
  console.log("========================================");
  console.log("Updating Platform Statistics");
  console.log("========================================\n");

  const now = new Date();

  const [
    totalUsersResult,
    activeUsersResult,
    totalPromptsResult,
    totalGamesResult,
    totalRatingsResult,
    averageRatingResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db
      .select({ count: count() })
      .from(user)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${session} 
          WHERE ${session.userId} = ${user.id} 
          AND ${session.expiresAt} > ${now}
        )`,
      ),
    db.select({ count: count() }).from(prompts),
    db.select({ count: count() }).from(games),
    db.select({ count: count() }).from(ratings),
    db.select({ avg: avg(ratings.overall) }).from(ratings),
  ]);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const activeUsers = activeUsersResult[0]?.count ?? 0;
  const totalPrompts = totalPromptsResult[0]?.count ?? 0;
  const totalGames = totalGamesResult[0]?.count ?? 0;
  const totalRatings = totalRatingsResult[0]?.count ?? 0;
  const averageRating = averageRatingResult[0]?.avg ?? null;

  console.log(`Total Users: ${totalUsers}`);
  console.log(`Active Users (with valid sessions): ${activeUsers}`);
  console.log(`Total Prompts: ${totalPrompts}`);
  console.log(`Total Games: ${totalGames}`);
  console.log(`Total Ratings: ${totalRatings}`);
  console.log(`Average Rating: ${averageRating ?? "N/A"}`);

  const existingStats = await db.query.platformStats.findFirst({
    orderBy: desc(platformStats.lastCalculatedAt),
  });

  if (existingStats) {
    await db
      .update(platformStats)
      .set({
        totalUsers,
        activeUsers,
        totalPrompts,
        totalGames,
        totalRatings,
        averageRating: averageRating?.toString() ?? "0",
        lastCalculatedAt: now,
      })
      .where(eq(platformStats.id, existingStats.id));

    console.log(`\nUpdated existing stats record: ${existingStats.id}`);
  } else {
    await db.insert(platformStats).values({
      totalUsers,
      activeUsers,
      totalPrompts,
      totalGames,
      totalRatings,
      averageRating: averageRating?.toString() ?? "0",
      lastCalculatedAt: now,
    });

    console.log("\nCreated new stats record");
  }

  console.log("\n========================================");
  console.log("Platform Stats Update Complete");
  console.log("========================================");
}

async function main(): Promise<void> {
  try {
    await updatePlatformStats();
    process.exit(0);
  } catch (error) {
    console.error("\n========================================");
    console.error("Platform Stats Update Failed");
    console.error("========================================");
    console.error(error);
    process.exit(1);
  }
}

main();
