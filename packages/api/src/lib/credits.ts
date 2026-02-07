import { db } from "@arcade-vibe/db";
import { creditTransactions } from "@arcade-vibe/db/schema/credits";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Deduct credits from user's balance (internal helper)
// per PRD lines 34-38: Credits are deducted BEFORE generation starts. No refunds for...
export const deductCredits = async (
  userId: string,
  amount: number,
  reason: string,
  modelKey?: string,
): Promise<void> => {
  // Validate amount is positive integer
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Credit amount must be a positive integer",
    });
  }

  // Get current user credits
  const user = await db.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: { id: true, credits: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Parse credits from text to number
  const currentCredits = parseInt(user.credits, 10);

  if (isNaN(currentCredits)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid credit balance",
    });
  }

  if (currentCredits < amount) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Insufficient credits",
    });
  }

  // Update user's credit balance
  await db
    .update(userExtended)
    .set({
      credits: (currentCredits - amount).toString(),
    })
    .where(eq(userExtended.id, userId));

  // Create transaction record with model info if provided
  const description = modelKey ? `${reason} (${modelKey})` : reason;

  await db.insert(creditTransactions).values({
    userId,
    amount: -amount, // Negative for deduction
    type: "deduction",
    description,
  });
};

// Get user credit balance (helper)
export const getUserCredits = async (userId: string): Promise<number> => {
  const user = await db.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: { credits: true },
  });

  if (!user) {
    return 0;
  }

  const credits = parseInt(user.credits, 10);
  return isNaN(credits) ? 0 : credits;
};

// Add credits to user's balance (internal helper)
export const addCreditsInternal = async (
  userId: string,
  amount: number,
  reason: string,
  type: string = "grant",
  description?: string,
): Promise<number> => {
  // Validate amount is positive integer
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Credit amount must be a positive integer",
    });
  }

  // Get current user credits
  const user = await db.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: { id: true, credits: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Parse credits from text to number
  const currentCredits = parseInt(user.credits, 10);

  if (isNaN(currentCredits)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid credit balance",
    });
  }

  // Update user's credit balance
  const newBalance = currentCredits + amount;

  await db
    .update(userExtended)
    .set({
      credits: newBalance.toString(),
    })
    .where(eq(userExtended.id, userId));

  // Create transaction record
  await db.insert(creditTransactions).values({
    userId,
    amount,
    type,
    description: description || reason,
  });

  return newBalance;
};
