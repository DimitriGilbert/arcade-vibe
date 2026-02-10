#!/usr/bin/env tsx
/**
 * Script to promote an existing user to admin role.
 *
 * Usage:
 *   pnpm run promote-admin <email|userId>
 *
 * Examples:
 *   pnpm run promote-admin user@example.com
 *   pnpm run promote-admin abc123xyz
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env from apps/web/.env (where DATABASE_URL is defined)
// Must be done BEFORE any imports that depend on env vars
config({ path: resolve(import.meta.dirname, "../../../apps/web/.env") });

async function main() {
  // Dynamic imports to ensure dotenv loads first
  const { eq, or } = await import("drizzle-orm");
  const { db } = await import("../src/index");
  const { user } = await import("../src/schema/auth");
  const { userExtended } = await import("../src/schema/users");

  const identifier = process.argv[2];

  if (!identifier) {
    console.error("❌ Please provide a user email or id");
    console.error("Usage: pnpm run promote-admin <email|userId>");
    process.exit(1);
  }

  console.log(`🔍 Looking for user: ${identifier}`);

  // First, find the user by email or id
  const foundUser = await db
    .select()
    .from(user)
    .where(or(eq(user.email, identifier), eq(user.id, identifier)))
    .limit(1);

  if (foundUser.length === 0) {
    console.error(`❌ User not found with email or id: ${identifier}`);
    process.exit(1);
  }

  const targetUser = foundUser[0];
  if (!targetUser) {
    console.error(`❌ User not found with email or id: ${identifier}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${targetUser.email} (id: ${targetUser.id})`);

  // Check if user_extended record exists
  const existingExtended = await db
    .select()
    .from(userExtended)
    .where(eq(userExtended.id, targetUser.id))
    .limit(1);

  if (existingExtended.length === 0) {
    // Create user_extended record with admin role
    console.log(`📝 Creating user_extended record with admin role...`);
    await db.insert(userExtended).values({
      id: targetUser.id,
      role: "admin",
      reputation: 0,
      credits: 100,
      isSuspended: false,
    });
    console.log(`✅ Created admin user: ${targetUser.email}`);
  } else {
    // Update existing record to admin role
    const currentRole = existingExtended[0]?.role;
    if (currentRole === "admin") {
      console.log(`ℹ️  User ${targetUser.email} is already an admin`);
      return;
    }
    console.log(`📝 Updating role from "${currentRole}" to "admin"...`);
    await db
      .update(userExtended)
      .set({ role: "admin" })
      .where(eq(userExtended.id, targetUser.id));
    console.log(`✅ Promoted ${targetUser.email} to admin`);
  }

  // Verify the change
  const verifyUser = await db
    .select()
    .from(userExtended)
    .where(eq(userExtended.id, targetUser.id))
    .limit(1);

  const verifiedRole = verifyUser[0]?.role;
  console.log(
    `\n🎉 Success! User ${targetUser.email} now has role: ${verifiedRole}`,
  );
}

main()
  .then(() => {
    console.log("\n👋 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
