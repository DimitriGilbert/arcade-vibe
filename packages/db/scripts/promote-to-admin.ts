#!/usr/bin/env tsx
/**
 * Script to promote an existing user to admin role.
 *
 * Usage:
 *   pnpm run --filter @arcade-vibe/db promote-admin <email|userId>
 *
 * Examples:
 *   pnpm run --filter @arcade-vibe/db promote-admin user@example.com
 *   pnpm run --filter @arcade-vibe/db promote-admin abc123xyz
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { user } from "../src/schema/auth";
import { userExtended } from "../src/schema/users";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function promoteToAdmin(identifier: string) {
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

// Get the identifier from command line arguments
const identifier = process.argv[2];

if (!identifier) {
  console.error("❌ Please provide a user email or id");
  console.error(
    "Usage: pnpm run --filter @arcade-vibe/db promote-admin <email|userId>",
  );
  process.exit(1);
}

promoteToAdmin(identifier)
  .then(() => {
    console.log("\n👋 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
