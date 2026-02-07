import { router, protectedProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { apiKeys } from "@arcade-vibe/db/schema/models";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { encryptApiKey, maskApiKey, decryptApiKey } from "@arcade-vibe/api/lib/encryption";

const EncryptionData = z.object({
  encrypted: z.string(),
  iv: z.string(),
});

export const apiKeysRouter = router({
  addKey: protectedProcedure
    .input(
      z.object({
        provider: z.enum([
          "openai",
          "anthropic",
          "google",
          "openrouter",
          "deepseek",
          "glm",
          "glm-coding-plan",
          "moonshot",
          "custom",
        ]),
        apiKey: z.string().min(1),
        name: z.string().min(1).default("Default Key"),
        customEndpoint: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const existingKey = await db.query.apiKeys.findFirst({
        where: and(
          eq(apiKeys.userId, ctx.user.id),
          eq(apiKeys.provider, input.provider),
        ),
      });

      if (existingKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "API key already exists for this provider",
        });
      }

      const { encrypted, iv } = encryptApiKey(input.apiKey);

      const keyHash = JSON.stringify({ encrypted, iv });

      const newKey = await db.insert(apiKeys).values({
        userId: ctx.user.id,
        provider: input.provider,
        keyHash,
        name: input.name,
        isActive: true,
      }).returning();

      return {
        success: true,
        keyId: newKey[0]?.id,
        maskedKey: maskApiKey(input.apiKey),
      };
    }),

  listKeys: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, ctx.user.id),
      columns: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return keys;
  }),

  deleteKey: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const key = await db.query.apiKeys.findFirst({
        where: and(
          eq(apiKeys.id, input.id),
          eq(apiKeys.userId, ctx.user.id),
        ),
      });

      if (!key) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      await db.delete(apiKeys).where(eq(apiKeys.id, input.id));

      return {
        success: true,
        keyId: input.id,
      };
    }),

  testKey: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const keyRecord = await db.query.apiKeys.findFirst({
        where: and(
          eq(apiKeys.id, input.id),
          eq(apiKeys.userId, ctx.user.id),
        ),
      });

      if (!keyRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      if (!keyRecord.keyHash) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid keyHash data",
        });
      }
      const encryptionData = EncryptionData.parse(JSON.parse(keyRecord.keyHash));
      decryptApiKey(encryptionData.encrypted, encryptionData.iv);

      return {
        success: true,
        keyId: input.id,
        provider: keyRecord.provider,
      };
    }),
});
