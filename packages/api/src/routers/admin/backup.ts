import { router, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Pool } from "pg";

const DATABASE_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "user_extended",
  "credit_batches",
  "credit_transactions",
  "subscription_plans",
  "user_subscriptions",
  "user_invoices",
  "stripe_webhook_events",
  "tier_costs",
  "email_logs",
  "email_templates",
  "feedback",
  "games",
  "game_versions",
  "game_scores",
  "game_session_metrics",
  "prompts",
  "prompt_runs",
  "ratings",
  "scores",
  "score_history",
  "score_recalculation_jobs",
  "themes",
  "allowed_library_patterns",
  "theme_allowed_patterns",
  "library_patterns",
  "model_config",
  "model_providers",
  "moderation_reports",
  "moderation_appeals",
  "platform_stats",
  "admin_actions",
  "scoring_weights",
  "api_keys",
  "suspicious_activity_logs",
  "collections",
  "collection_games",
  "todo",
] as const;

type TableName = (typeof DATABASE_TABLES)[number];

interface TableData {
  name: TableName;
  rows: Record<string, unknown>[];
  count: number;
}

export interface BackupData {
  version: number;
  timestamp: string;
  tables: TableData[];
  metadata: {
    totalRows: number;
    tableCount: number;
    databaseName: string;
  };
}

async function getPool(): Promise<Pool> {
  const { env } = await import("@arcade-vibe/env/server");
  return new Pool({ connectionString: env.DATABASE_URL });
}

export const backupRouter = router({
  backup: adminProcedure.mutation(async ({ ctx }) => {
    const pool = await getPool();

    try {
      const backupData: BackupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        tables: [],
        metadata: {
          totalRows: 0,
          tableCount: 0,
          databaseName: "arcade-vibe",
        },
      };

      for (const tableName of DATABASE_TABLES) {
        const result = await pool.query<Record<string, unknown>>(
          `SELECT * FROM ${tableName}`,
        );

        backupData.tables.push({
          name: tableName,
          rows: result.rows,
          count: result.rowCount ?? 0,
        });
        backupData.metadata.totalRows += result.rowCount ?? 0;
      }

      backupData.metadata.tableCount = backupData.tables.length;

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "db_backup",
        targetType: "system",
        targetId: "database",
        reason: `Database backup created with ${backupData.metadata.totalRows} rows across ${backupData.metadata.tableCount} tables`,
        metadata: JSON.stringify({
          tableCount: backupData.metadata.tableCount,
          totalRows: backupData.metadata.totalRows,
        }),
      });

      return {
        success: true,
        data: backupData,
        filename: `arcade-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      };
    } finally {
      await pool.end();
    }
  }),

  restore: adminProcedure
    .input(
      z.object({
        backupData: z.object({
          version: z.number(),
          timestamp: z.string(),
          tables: z.array(
            z.object({
              name: z.string(),
              rows: z.array(z.record(z.string(), z.unknown())),
              count: z.number(),
            }),
          ),
          metadata: z.object({
            totalRows: z.number(),
            tableCount: z.number(),
            databaseName: z.string(),
          }),
        }),
        truncateFirst: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const results: { table: string; action: string; count: number }[] = [];

        if (input.truncateFirst) {
          for (const table of input.backupData.tables) {
            await client.query(`TRUNCATE TABLE ${table.name} CASCADE`);
            results.push({ table: table.name, action: "truncated", count: 0 });
          }
        }

        for (const table of input.backupData.tables) {
          if (table.rows.length === 0) continue;

          const columns = Object.keys(table.rows[0] ?? {});
          if (columns.length === 0) continue;

          for (const row of table.rows) {
            const values = columns.map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return null;
              if (typeof val === "object") return JSON.stringify(val);
              return val;
            });

            const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
            const columnNames = columns.join(", ");

            const insertQuery = `
              INSERT INTO ${table.name} (${columnNames})
              VALUES (${placeholders})
              ON CONFLICT DO NOTHING
            `;

            await client.query(insertQuery, values);
          }

          results.push({
            table: table.name,
            action: "restored",
            count: table.rows.length,
          });
        }

        await client.query("COMMIT");

        await db.insert(adminActions).values({
          adminId: ctx.user.id,
          actionType: "db_restore",
          targetType: "system",
          targetId: "database",
          reason: `Database restored from backup dated ${input.backupData.timestamp}`,
          metadata: JSON.stringify({
            backupTimestamp: input.backupData.timestamp,
            tablesRestored: results.filter((r) => r.action === "restored").length,
            totalRowsRestored: input.backupData.metadata.totalRows,
          }),
        });

        return {
          success: true,
          results,
          summary: {
            tablesProcessed: results.length,
            totalRowsRestored: input.backupData.metadata.totalRows,
          },
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Restore failed: ${error.message}`
              : "Restore failed with unknown error",
        });
      } finally {
        client.release();
        await pool.end();
      }
    }),

  getBackupInfo: adminProcedure
    .input(
      z.object({
        backupData: z.object({
          version: z.number(),
          timestamp: z.string(),
          tables: z.array(
            z.object({
              name: z.string(),
              rows: z.array(z.record(z.string(), z.unknown())),
              count: z.number(),
            }),
          ),
          metadata: z.object({
            totalRows: z.number(),
            tableCount: z.number(),
            databaseName: z.string(),
          }),
        }),
      }),
    )
    .query(async ({ input }) => {
      const tables = input.backupData.tables.map((t) => ({
        name: t.name,
        rowCount: t.count,
      }));

      return {
        timestamp: input.backupData.timestamp,
        version: input.backupData.version,
        totalRows: input.backupData.metadata.totalRows,
        tableCount: input.backupData.metadata.tableCount,
        databaseName: input.backupData.metadata.databaseName,
        tables,
      };
    }),

  listTableCounts: adminProcedure.query(async () => {
    const pool = await getPool();

    try {
      const counts: { table: string; count: number }[] = [];

      for (const tableName of DATABASE_TABLES) {
        const result = await pool.query<{ count: string }>(
          `SELECT COUNT(*) FROM ${tableName}`,
        );
        counts.push({
          table: tableName,
          count: parseInt(result.rows[0]?.count ?? "0", 10),
        });
      }

      return {
        tables: counts,
        totalRows: counts.reduce((sum, t) => sum + t.count, 0),
      };
    } finally {
      await pool.end();
    }
  }),
});
