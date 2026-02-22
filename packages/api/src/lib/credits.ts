import { db, type DbTransaction } from "@arcade-vibe/db";
import {
  creditTransactions,
  creditBatches,
} from "@arcade-vibe/db/schema/credits";
import { userExtended } from "@arcade-vibe/db/schema/users";
import { eq, and, gt, sql, lte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// CB-009: Low balance warning thresholds
export const LOW_BALANCE_THRESHOLDS = {
  WARNING: 50,
  CRITICAL: 20,
} as const;

// CB-008: Audit log interface for credit changes
export interface CreditAuditLog {
  userId: string;
  action: "add" | "deduct" | "expire" | "adjust";
  amount: number;
  balanceAfter: number;
  source: string;
  sourceId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// CB-008: Audit log storage (in-memory for now, could be persisted to DB)
const auditLogs: CreditAuditLog[] = [];
const MAX_AUDIT_LOGS = 10000;

function logAudit(entry: CreditAuditLog): void {
  auditLogs.push(entry);
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.shift();
  }
  // console.log("[AUDIT]", JSON.stringify(entry));
}

// CB-008: Get audit logs (for admin use)
export function getCreditAuditLogs(limit = 100): CreditAuditLog[] {
  return auditLogs.slice(-limit);
}

// Credit expiry constants
export const CREDIT_EXPIRY = {
  // One-time purchase credits: 1 year
  ONE_TIME_DAYS: 365,
  // Subscription credits: 1 month
  SUBSCRIPTION_DAYS: 30,
  // Admin grants: 1 year
  ADMIN_GRANT_DAYS: 365,
  // Free trial: 1 month
  FREE_TRIAL_DAYS: 30,
} as const;

export type CreditSourceType =
  | "one_time_purchase"
  | "subscription"
  | "admin_grant"
  | "free_trial";

// Calculate expiry date based on source type
export function calculateExpiryDate(sourceType: CreditSourceType): Date {
  const now = new Date();
  const daysMap: Record<CreditSourceType, number> = {
    one_time_purchase: CREDIT_EXPIRY.ONE_TIME_DAYS,
    subscription: CREDIT_EXPIRY.SUBSCRIPTION_DAYS,
    admin_grant: CREDIT_EXPIRY.ADMIN_GRANT_DAYS,
    free_trial: CREDIT_EXPIRY.FREE_TRIAL_DAYS,
  };

  const days = daysMap[sourceType];
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

// Get valid credit balance (excluding expired credits)
export const getValidCreditBalance = async (
  userId: string,
): Promise<number> => {
  const now = new Date();

  const batches = await db.query.creditBatches.findMany({
    where: and(
      eq(creditBatches.userId, userId),
      gt(creditBatches.remainingAmount, 0),
      gt(creditBatches.expiresAt, now),
    ),
    columns: {
      remainingAmount: true,
    },
  });

  return batches.reduce((sum, batch) => sum + batch.remainingAmount, 0);
};

// Get credit breakdown by expiry
export interface CreditBatchInfo {
  id: string;
  amount: number;
  remainingAmount: number;
  sourceType: string;
  expiresAt: Date;
  daysUntilExpiry: number;
  createdAt: Date;
}

export interface CreditBreakdown {
  total: number;
  expiringWithin7Days: number;
  expiringWithin30Days: number;
  validBeyond30Days: number;
  batches: CreditBatchInfo[];
}

export const getCreditBreakdown = async (
  userId: string,
): Promise<CreditBreakdown> => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const batches = await db.query.creditBatches.findMany({
    where: and(
      eq(creditBatches.userId, userId),
      gt(creditBatches.remainingAmount, 0),
      gt(creditBatches.expiresAt, now),
    ),
    orderBy: (batches, { asc }) => [asc(batches.expiresAt)],
  });

  const batchInfos: CreditBatchInfo[] = batches.map((batch) => {
    const daysUntilExpiry = Math.ceil(
      (batch.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      id: batch.id,
      amount: batch.amount,
      remainingAmount: batch.remainingAmount,
      sourceType: batch.sourceType,
      expiresAt: batch.expiresAt,
      daysUntilExpiry,
      createdAt: batch.createdAt,
    };
  });

  const total = batchInfos.reduce((sum, b) => sum + b.remainingAmount, 0);
  const expiringWithin7Days = batchInfos
    .filter((b) => b.daysUntilExpiry <= 7)
    .reduce((sum, b) => sum + b.remainingAmount, 0);
  const expiringWithin30Days = batchInfos
    .filter((b) => b.daysUntilExpiry <= 30)
    .reduce((sum, b) => sum + b.remainingAmount, 0);
  const validBeyond30Days = batchInfos
    .filter((b) => b.daysUntilExpiry > 30)
    .reduce((sum, b) => sum + b.remainingAmount, 0);

  return {
    total,
    expiringWithin7Days,
    expiringWithin30Days,
    validBeyond30Days,
    batches: batchInfos,
  };
};

// Deduct credits from user's balance using FIFO (oldest batches first)
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

  const now = new Date();

  // Use transaction for atomic operations
  await db.transaction(async (tx) => {
    // Get valid batches ordered by expiry date (FIFO - oldest first)
    const batches = await tx.query.creditBatches.findMany({
      where: and(
        eq(creditBatches.userId, userId),
        gt(creditBatches.remainingAmount, 0),
        gt(creditBatches.expiresAt, now),
      ),
      orderBy: (batches, { asc }) => [asc(batches.expiresAt)],
    });

    const totalAvailable = batches.reduce(
      (sum, b) => sum + b.remainingAmount,
      0,
    );

    if (totalAvailable < amount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Insufficient credits. Available: ${totalAvailable}, Required: ${amount}`,
      });
    }

    // Deduct from batches using FIFO
    let remainingToDeduct = amount;

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductFromThisBatch = Math.min(
        batch.remainingAmount,
        remainingToDeduct,
      );

      await tx
        .update(creditBatches)
        .set({
          remainingAmount: batch.remainingAmount - deductFromThisBatch,
        })
        .where(eq(creditBatches.id, batch.id));

      remainingToDeduct -= deductFromThisBatch;
    }

    // Calculate new balance within transaction
    const updatedBatches = await tx.query.creditBatches.findMany({
      where: and(
        eq(creditBatches.userId, userId),
        gt(creditBatches.remainingAmount, 0),
        gt(creditBatches.expiresAt, now),
      ),
      columns: { remainingAmount: true },
    });
    const newBalance = updatedBatches.reduce(
      (sum, b) => sum + b.remainingAmount,
      0,
    );

    await tx
      .update(userExtended)
      .set({ credits: newBalance })
      .where(eq(userExtended.id, userId));

    // Create transaction record with model info if provided
    const description = modelKey ? `${reason} (${modelKey})` : reason;

    await tx.insert(creditTransactions).values({
      userId,
      amount: -amount, // Negative for deduction
      type: "deduction",
      description,
    });

    // CB-008: Audit log for deduction
    logAudit({
      userId,
      action: "deduct",
      amount,
      balanceAfter: newBalance,
      source: "generation",
      reason: description,
      metadata: modelKey ? { modelKey } : undefined,
      timestamp: new Date(),
    });
  });
};

// Add credits to user's balance with batch tracking
export const addCreditsInternal = async (
  userId: string,
  amount: number,
  reason: string,
  type: CreditSourceType = "admin_grant",
  description?: string,
  sourceId?: string,
  tx?: DbTransaction,
): Promise<number> => {
  // Validate amount is positive integer
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Credit amount must be a positive integer",
    });
  }

  const executor = tx ?? db;

  // Verify user exists
  const user = await executor.query.userExtended.findFirst({
    where: eq(userExtended.id, userId),
    columns: { id: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Calculate expiry date
  const expiresAt = calculateExpiryDate(type);

  const executeInTransaction = async (txn: DbTransaction): Promise<number> => {
    // Create credit batch
    const [batch] = await txn
      .insert(creditBatches)
      .values({
        userId,
        amount,
        remainingAmount: amount,
        sourceType: type,
        sourceId: sourceId ?? null,
        expiresAt,
      })
      .returning();

    // Calculate new balance within transaction
    const now = new Date();
    const allBatches = await txn.query.creditBatches.findMany({
      where: and(
        eq(creditBatches.userId, userId),
        gt(creditBatches.remainingAmount, 0),
        gt(creditBatches.expiresAt, now),
      ),
      columns: { remainingAmount: true },
    });
    const balance = allBatches.reduce((sum, b) => sum + b.remainingAmount, 0);

    // Update user's denormalized credit balance
    await txn
      .update(userExtended)
      .set({ credits: balance })
      .where(eq(userExtended.id, userId));

    // Create transaction record
    await txn.insert(creditTransactions).values({
      userId,
      amount,
      type,
      description: description ?? reason,
      batchId: batch?.id,
      expiresAt,
    });

    // CB-008: Audit log for credit addition
    logAudit({
      userId,
      action: "add",
      amount,
      balanceAfter: balance,
      source: type,
      sourceId: sourceId,
      reason: description ?? reason,
      timestamp: new Date(),
    });

    return balance;
  };

  if (tx) {
    return executeInTransaction(tx);
  }

  const newBalance = await db.transaction(executeInTransaction);

  return newBalance;
};

// Expire old credits (to be called by a cron job or scheduled task)
export const expireOldCredits = async (): Promise<number> => {
  const now = new Date();

  // Find all expired batches with remaining credits
  const expiredBatches = await db.query.creditBatches.findMany({
    where: and(
      gt(creditBatches.remainingAmount, 0),
      sql`${creditBatches.expiresAt} <= ${now}`,
    ),
  });

  let expiredCount = 0;

  for (const batch of expiredBatches) {
    if (batch.remainingAmount > 0) {
      const amountToExpire = batch.remainingAmount;

      await db.transaction(async (tx) => {
        // Create expiry transaction
        await tx.insert(creditTransactions).values({
          userId: batch.userId,
          amount: -amountToExpire,
          type: "expiry",
          description: `Credits expired (source: ${batch.sourceType})`,
          batchId: batch.id,
        });

        // Set remaining to 0
        await tx
          .update(creditBatches)
          .set({ remainingAmount: 0 })
          .where(eq(creditBatches.id, batch.id));

        // Recalculate user balance within transaction
        const validBatches = await tx.query.creditBatches.findMany({
          where: and(
            eq(creditBatches.userId, batch.userId),
            gt(creditBatches.remainingAmount, 0),
            gt(creditBatches.expiresAt, now),
          ),
          columns: { remainingAmount: true },
        });
        const newBalance = validBatches.reduce(
          (sum, b) => sum + b.remainingAmount,
          0,
        );

        // Update user's denormalized balance
        await tx
          .update(userExtended)
          .set({ credits: newBalance })
          .where(eq(userExtended.id, batch.userId));

        // CB-008: Audit log for credit expiry
        logAudit({
          userId: batch.userId,
          action: "expire",
          amount: amountToExpire,
          balanceAfter: newBalance,
          source: batch.sourceType,
          sourceId: batch.sourceId ?? undefined,
          reason: `Credits expired (source: ${batch.sourceType})`,
          timestamp: new Date(),
        });
      });

      expiredCount += amountToExpire;
    }
  }

  return expiredCount;
};

// Sync user's credit balance with actual batch totals (for data consistency)
export const syncUserCreditBalance = async (
  userId: string,
): Promise<number> => {
  const actualBalance = await getValidCreditBalance(userId);

  await db
    .update(userExtended)
    .set({ credits: actualBalance })
    .where(eq(userExtended.id, userId));

  return actualBalance;
};

// CB-007: Credit expiry notification types
export interface CreditExpiryNotification {
  userId: string;
  batchId: string;
  amount: number;
  expiresAt: Date;
  daysUntilExpiry: number;
  notificationType: "warning_7_days" | "warning_3_days" | "warning_1_day" | "final_warning";
}

// CB-007: Get users with credits expiring soon (for cron job notifications)
export const getExpiringCreditsForNotification = async (
  daysThreshold: number,
): Promise<CreditExpiryNotification[]> => {
  const now = new Date();
  const thresholdDate = new Date(now);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const batches = await db.query.creditBatches.findMany({
    where: and(
      gt(creditBatches.remainingAmount, 0),
      gt(creditBatches.expiresAt, now),
      lte(creditBatches.expiresAt, thresholdDate),
    ),
    orderBy: (batches, { asc }) => [asc(batches.expiresAt)],
  });

  return batches.map((batch) => {
    const daysUntilExpiry = Math.ceil(
      (batch.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let notificationType: CreditExpiryNotification["notificationType"];
    if (daysUntilExpiry <= 1) {
      notificationType = "final_warning";
    } else if (daysUntilExpiry <= 3) {
      notificationType = "warning_1_day";
    } else if (daysUntilExpiry <= 5) {
      notificationType = "warning_3_days";
    } else {
      notificationType = "warning_7_days";
    }

    return {
      userId: batch.userId,
      batchId: batch.id,
      amount: batch.remainingAmount,
      expiresAt: batch.expiresAt,
      daysUntilExpiry,
      notificationType,
    };
  });
};

// CB-007: Send expiry notification (placeholder - integrate with notification system)
export const sendExpiryNotification = async (
  notification: CreditExpiryNotification,
): Promise<void> => {
  console.log(
    `[EXPIRY NOTICE] User ${notification.userId}: ${notification.amount} credits expire in ${notification.daysUntilExpiry} days (${notification.notificationType})`,
  );
};

// CB-009: Low balance warning result
export interface LowBalanceWarning {
  isLow: boolean;
  level: "none" | "warning" | "critical";
  balance: number;
  threshold: number;
}

// CB-009: Check if user has low credit balance
export const checkLowBalance = async (
  userId: string,
): Promise<LowBalanceWarning> => {
  const balance = await getValidCreditBalance(userId);

  if (balance <= LOW_BALANCE_THRESHOLDS.CRITICAL) {
    return {
      isLow: true,
      level: "critical",
      balance,
      threshold: LOW_BALANCE_THRESHOLDS.CRITICAL,
    };
  }

  if (balance <= LOW_BALANCE_THRESHOLDS.WARNING) {
    return {
      isLow: true,
      level: "warning",
      balance,
      threshold: LOW_BALANCE_THRESHOLDS.WARNING,
    };
  }

  return {
    isLow: false,
    level: "none",
    balance,
    threshold: LOW_BALANCE_THRESHOLDS.WARNING,
  };
};

// CB-020: Credit usage analytics
export interface CreditUsageAnalytics {
  userId: string;
  totalCreditsUsed: number;
  totalCreditsPurchased: number;
  totalCreditsExpired: number;
  usageByType: Record<string, number>;
  usageByModel: Record<string, number>;
  averageDailyUsage: number;
  projectedDaysUntilEmpty: number | null;
  periodStart: Date;
  periodEnd: Date;
}

// CB-020: Get credit usage analytics for a user
export const getCreditUsageAnalytics = async (
  userId: string,
  daysBack = 30,
): Promise<CreditUsageAnalytics> => {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - daysBack);
  periodStart.setHours(0, 0, 0, 0);

  const transactions = await db.query.creditTransactions.findMany({
    where: and(
      eq(creditTransactions.userId, userId),
      sql`${creditTransactions.createdAt} >= ${periodStart}`,
    ),
    orderBy: [desc(creditTransactions.createdAt)],
  });

  let totalCreditsUsed = 0;
  let totalCreditsPurchased = 0;
  let totalCreditsExpired = 0;
  const usageByType: Record<string, number> = {};
  const usageByModel: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.amount < 0) {
      const absAmount = Math.abs(tx.amount);
      totalCreditsUsed += absAmount;

      const type = tx.type;
      usageByType[type] = (usageByType[type] ?? 0) + absAmount;

      if (tx.description) {
        const modelMatch = tx.description.match(/\(([^)]+)\)$/);
        if (modelMatch?.[1]) {
          const model = modelMatch[1];
          usageByModel[model] = (usageByModel[model] ?? 0) + absAmount;
        }
      }
    } else if (tx.type === "expiry") {
      totalCreditsExpired += Math.abs(tx.amount);
    } else {
      totalCreditsPurchased += tx.amount;
    }
  }

  const averageDailyUsage = totalCreditsUsed / daysBack;
  const currentBalance = await getValidCreditBalance(userId);

  let projectedDaysUntilEmpty: number | null = null;
  if (averageDailyUsage > 0) {
    projectedDaysUntilEmpty = Math.floor(currentBalance / averageDailyUsage);
  }

  return {
    userId,
    totalCreditsUsed,
    totalCreditsPurchased,
    totalCreditsExpired,
    usageByType,
    usageByModel,
    averageDailyUsage,
    projectedDaysUntilEmpty,
    periodStart,
    periodEnd: now,
  };
};
