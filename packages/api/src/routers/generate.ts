import { router, protectedProcedure } from "@arcade-vibe/api";
import { generateGame } from "@arcade-vibe/api/lib/game-generation";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createRateLimitMiddleware,
  rateLimits,
} from "../middleware/rate-limit";

export const generateRouter = router({
  streamGeneration: protectedProcedure
    .use(createRateLimitMiddleware(rateLimits.strict))
    .input(
      z.object({
        promptId: z.string().uuid(),
        modelKey: z.string().min(1),
        apiKeyId: z.string().uuid().optional(),
        name: z.string().max(100).optional(),
        mediaUrls: z.record(z.string(), z.string()).optional(),
        reasoningEnabled: z.boolean().default(true),
        reasoningMaxTokens: z.number().min(500).max(10000).default(2000),
      }),
    )
    .mutation(async function* ({ input, ctx }) {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Use shared generation logic
      const result = await generateGame({
        promptId: input.promptId,
        modelKey: input.modelKey,
        userId: ctx.user.id,
        apiKeyId: input.apiKeyId,
        creditReason: "Game generation",
        name: input.name,
        mediaUrls: input.mediaUrls,
        reasoningEnabled: input.reasoningEnabled,
        reasoningMaxTokens: input.reasoningMaxTokens,
      });

      // Stream events from the generator
      for await (const event of result.stream) {
        switch (event.type) {
          case "status":
            yield {
              type: "status",
              gameId: event.gameId,
              status: event.status,
              isComplete: false,
            };
            break;
          case "chunk":
            yield {
              type: "chunk",
              gameId: event.gameId,
              code: event.code,
              isComplete: false,
            };
            break;
          case "complete":
            yield {
              type: "complete",
              gameId: event.gameId,
              assetUrl: event.assetUrl,
              tokenUsage: event.tokenUsage,
              isComplete: true,
            };
            break;
          case "error":
            yield {
              type: "error",
              gameId: event.gameId,
              error: event.error,
              isComplete: true,
            };
            break;
        }
      }
    }),
});
