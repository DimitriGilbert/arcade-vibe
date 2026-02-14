#!/usr/bin/env tsx
/**
 * Migration script to fix existing users who have credits in userExtended
 * but no corresponding credit batches.
 *
 * This script should be run once after deploying the credit system fix.
 *
 * Usage:
 *   pnpm run fix-credit-batches
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env from apps/web/.env (where DATABASE_URL is defined)
// Must be done BEFORE any imports that depend on env vars
config({ path: resolve(import.meta.dirname, "../../../apps/web/.env") });

async function main() {
  // Dynamic imports to ensure dotenv loads first
  const { eq, gt } = await import("drizzle-orm");
  const { db } = await import("../src/index");
  const { userExtended } = await import("../src/schema/users");
  const { creditBatches } = await import("../src/schema/credits");

  console.log("🔍 Finding users with credits but no credit batches...\n");

  // Get all users with credits > 0
  const usersWithCredits = await db
    .select()
    .from(userExtended)
    .where(gt(userExtended.credits, 0));

  console.log(`Found ${usersWithCredits.length} users with credits > 0\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const user of usersWithCredits) {
    // Check if user has any credit batches
    const batches = await db
      .select()
      .from(creditBatches)
      .where(eq(creditBatches.userId, user.id));

    if (batches.length === 0) {
      console.log(`Fixing user ${user.id} with ${user.credits} credits...`);

      // Create a credit batch for existing credits
      // Use 1 year expiry (admin_grant type) for existing users
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await db.insert(creditBatches).values({
        userId: user.id,
        amount: user.credits,
        remainingAmount: user.credits,
        sourceType: "admin_grant", // Treat as admin grant for existing users
        expiresAt,
      });

      console.log(
        `  ✅ Created credit batch for ${user.credits} credits (expires: ${expiresAt.toISOString()})`,
      );
      fixedCount++;
    } else {
      console.log(
        `  ⏭️  User ${user.id} already has ${batches.length} credit batch(es), skipping`,
      );
      skippedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount} users`);
  console.log(`   Skipped: ${skippedCount} users`);
  console.log(`   Total: ${usersWithCredits.length} users`);
}

main()
  .then(() => {
    console.log("\n👋 Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
