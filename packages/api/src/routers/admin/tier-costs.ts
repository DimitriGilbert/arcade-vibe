import { router, publicProcedure, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { tierCosts } from "@arcade-vibe/db/schema/credits";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const tierCostsRouter = router({
  // List all active tier costs - public (for model selector)
  list: publicProcedure.query(async () => {
    return await db.query.tierCosts.findMany({
      where: eq(tierCosts.isActive, true),
      orderBy: [asc(tierCosts.displayOrder)],
    });
  }),

  // Get by slug - public
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await db.query.tierCosts.findFirst({
        where: and(
          eq(tierCosts.slug, input.slug),
          eq(tierCosts.isActive, true),
        ),
      });
    }),

  // Get by ID - public
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.tierCosts.findFirst({
        where: eq(tierCosts.id, input.id),
      });
    }),

  // Create - admin only
  create: adminProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-z_]+$/, "Slug must be lowercase with underscores only"),
        name: z.string().min(1).max(100),
        creditCost: z.number().int().positive(),
        description: z.string().optional(),
        scoreMultiplier: z.number().positive().default(1.0),
        displayOrder: z.number().int().default(0),
        colorClass: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await db.insert(tierCosts).values(input).returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tier cost",
        });
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "create_tier_cost",
        targetType: "system",
        targetId: created.id,
        reason: `Created tier cost: ${input.name} (${input.slug})`,
        metadata: JSON.stringify(input),
      });

      return created;
    }),

  // Update - admin only
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        creditCost: z.number().int().positive().optional(),
        description: z.string().optional(),
        scoreMultiplier: z.number().positive().optional(),
        displayOrder: z.number().int().optional(),
        colorClass: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [updated] = await db
        .update(tierCosts)
        .set(updates)
        .where(eq(tierCosts.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tier cost",
        });
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "update_tier_cost",
        targetType: "system",
        targetId: id,
        reason: `Updated tier cost: ${updated.name}`,
        metadata: JSON.stringify({ id, updates }),
      });

      return updated;
    }),

  // Soft delete - admin only
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .update(tierCosts)
        .set({ isActive: false })
        .where(eq(tierCosts.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tier cost",
        });
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "delete_tier_cost",
        targetType: "system",
        targetId: input.id,
        reason: `Deleted tier cost: ${deleted.name}`,
        metadata: JSON.stringify({ id: input.id }),
      });

      return { success: true, id: input.id };
    }),
});
