import { router, publicProcedure, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { themes } from "@arcade-vibe/db/schema/themes";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const themesRouter = router({
  list: publicProcedure.query(async () => {
    const allThemes = await db.query.themes.findMany({
      orderBy: [desc(themes.createdAt)],
    });

    return allThemes.map((theme) => ({
      id: theme.id,
      title: theme.title,
      description: theme.description,
      status: theme.status,
      visibility: theme.visibility,
      startDate: theme.startDate,
      endDate: theme.endDate,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    }));
  }),

  getCurrent: publicProcedure.query(async () => {
    const now = new Date();
    const currentTheme = await db.query.themes.findFirst({
      where: and(
        eq(themes.status, "active"),
        sql`${themes.startDate} <= ${now} AND ${themes.endDate} >= ${now}`,
      ),
    });

    if (!currentTheme) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active theme found",
      });
    }

    return {
      id: currentTheme.id,
      title: currentTheme.title,
      description: currentTheme.description,
      status: currentTheme.status,
      visibility: currentTheme.visibility,
      startDate: currentTheme.startDate,
      endDate: currentTheme.endDate,
      createdAt: currentTheme.createdAt,
      updatedAt: currentTheme.updatedAt,
    };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const theme = await db.query.themes.findFirst({
        where: eq(themes.id, input.id),
      });

      if (!theme) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Theme not found",
        });
      }

      return {
        id: theme.id,
        title: theme.title,
        description: theme.description,
        status: theme.status,
        visibility: theme.visibility,
        startDate: theme.startDate,
        endDate: theme.endDate,
        systemPrompt: theme.systemPrompt,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().min(1),
        status: z.enum(["upcoming", "active", "frozen", "archived"]).default("upcoming"),
        visibility: z.enum(["private", "public_on_freeze", "public"]).default("private"),
        startDate: z.string().or(z.date()).nullable(),
        endDate: z.string().or(z.date()).nullable(),
        requirements: z.record(z.string(), z.unknown()),
        systemPrompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const startDate = input.startDate instanceof Date ? input.startDate : input.startDate ? new Date(input.startDate) : null;
      const endDate = input.endDate instanceof Date ? input.endDate : input.endDate ? new Date(input.endDate) : null;

      const result = await db
        .insert(themes)
        .values({
          title: input.title,
          description: input.description,
          status: input.status,
          visibility: input.visibility,
          startDate,
          endDate,
          requirements: input.requirements,
          systemPrompt: input.systemPrompt,
        })
        .returning();

      return {
        success: true,
        themeId: result[0]?.id,
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        status: z.enum(["upcoming", "active", "frozen", "archived"]).optional(),
        visibility: z.enum(["private", "public_on_freeze", "public"]).optional(),
        startDate: z.string().or(z.date()).nullable().optional(),
        endDate: z.string().or(z.date()).nullable().optional(),
        requirements: z.record(z.string(), z.unknown()).optional(),
        systemPrompt: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
      if (updates.startDate !== undefined) {
        updateData.startDate = updates.startDate instanceof Date ? updates.startDate : updates.startDate ? new Date(updates.startDate) : null;
      }
      if (updates.endDate !== undefined) {
        updateData.endDate = updates.endDate instanceof Date ? updates.endDate : updates.endDate ? new Date(updates.endDate) : null;
      }
      if (updates.requirements !== undefined) updateData.requirements = updates.requirements;
      if (updates.systemPrompt !== undefined) updateData.systemPrompt = updates.systemPrompt;

      const result = await db
        .update(themes)
        .set(updateData)
        .where(eq(themes.id, id))
        .returning();

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Theme not found",
        });
      }

      return {
        success: true,
        themeId: result[0].id,
      };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["upcoming", "active", "frozen", "archived"]),
      }),
    )
    .mutation(async ({ input }) => {
      const currentTheme = await db.query.themes.findFirst({
        where: eq(themes.id, input.id),
        columns: { status: true },
      });

      if (!currentTheme) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Theme not found",
        });
      }

      const validTransitions: Record<string, string[]> = {
        upcoming: ["active", "archived"],
        active: ["frozen", "archived"],
        frozen: ["archived"],
        archived: [],
      };

      if (!validTransitions[currentTheme.status]?.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid status transition from ${currentTheme.status} to ${input.status}`,
        });
      }

      const result = await db
        .update(themes)
        .set({ status: input.status })
        .where(eq(themes.id, input.id))
        .returning({ id: themes.id, status: themes.status });

      return {
        success: true,
        themeId: result[0]?.id,
        newStatus: result[0]?.status,
      };
    }),
});
