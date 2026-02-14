import { router, adminProcedure, publicProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import {
  allowedLibraryPatterns,
  themeAllowedPatterns,
} from "@arcade-vibe/db/schema/library-patterns";
import { themes } from "@arcade-vibe/db/schema/themes";
import { adminActions } from "@arcade-vibe/db/schema/platform";
import { isUrlAllowed } from "@arcade-vibe/api/lib/script-sanitizer";
import { z } from "zod";
import { eq, desc, and, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const libraryPatternsRouter = router({
  list: adminProcedure.query(async () => {
    const patterns = await db.query.allowedLibraryPatterns.findMany({
      orderBy: [desc(allowedLibraryPatterns.createdAt)],
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        themeAllowedPatterns: {
          with: {
            theme: {
              columns: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return patterns;
  }),

  getByTheme: publicProcedure
    .input(
      z.object({
        themeId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const patterns = await db.query.allowedLibraryPatterns.findMany({
        where: and(
          eq(allowedLibraryPatterns.status, "active"),
          or(eq(allowedLibraryPatterns.isGlobal, true)),
        ),
      });

      const themePatterns = await db.query.themeAllowedPatterns.findMany({
        where: eq(themeAllowedPatterns.themeId, input.themeId),
        with: {
          pattern: true,
        },
      });

      const themePatternIds = new Set(themePatterns.map((tp) => tp.patternId));

      const additionalPatterns = await db.query.allowedLibraryPatterns.findMany(
        {
          where: and(eq(allowedLibraryPatterns.status, "active")),
        },
      );

      const filteredAdditionalPatterns = additionalPatterns.filter((p) =>
        themePatternIds.has(p.id),
      );

      return {
        globalPatterns: patterns.filter((p) => p.isGlobal),
        themePatterns: filteredAdditionalPatterns,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).default(""),
        urlPattern: z.string().min(1),
        category: z.enum([
          "game_engine",
          "physics",
          "audio",
          "graphics",
          "utility",
          "analytics",
          "other",
        ]),
        isGlobal: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingPattern = await db.query.allowedLibraryPatterns.findFirst({
        where: eq(allowedLibraryPatterns.name, input.name),
      });

      if (existingPattern) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Library pattern with this name already exists",
        });
      }

      const newPattern = await db
        .insert(allowedLibraryPatterns)
        .values({
          name: input.name,
          description: input.description,
          urlPattern: input.urlPattern,
          category: input.category,
          isGlobal: input.isGlobal,
          status: "active",
          createdById: ctx.user.id,
        })
        .returning();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "create_library_pattern",
        targetType: "library_pattern",
        targetId: newPattern[0]?.id,
        reason: `Created library pattern: ${input.name}`,
        metadata: JSON.stringify({
          name: input.name,
          urlPattern: input.urlPattern,
          category: input.category,
          isGlobal: input.isGlobal,
        }),
      });

      return {
        success: true,
        pattern: newPattern[0],
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        urlPattern: z.string().min(1).optional(),
        category: z
          .enum([
            "game_engine",
            "physics",
            "audio",
            "graphics",
            "utility",
            "analytics",
            "other",
          ])
          .optional(),
        isGlobal: z.boolean().optional(),
        status: z.enum(["active", "disabled"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingPattern = await db.query.allowedLibraryPatterns.findFirst({
        where: eq(allowedLibraryPatterns.id, input.id),
      });

      if (!existingPattern) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Library pattern not found",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.urlPattern !== undefined)
        updateData.urlPattern = input.urlPattern;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.isGlobal !== undefined) updateData.isGlobal = input.isGlobal;
      if (input.status !== undefined) updateData.status = input.status;

      const updated = await db
        .update(allowedLibraryPatterns)
        .set(updateData)
        .where(eq(allowedLibraryPatterns.id, input.id))
        .returning();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "update_library_pattern",
        targetType: "library_pattern",
        targetId: input.id,
        reason: `Updated library pattern: ${existingPattern.name}`,
        metadata: JSON.stringify({
          oldPattern: existingPattern,
          changes: updateData,
        }),
      });

      return {
        success: true,
        pattern: updated[0],
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingPattern = await db.query.allowedLibraryPatterns.findFirst({
        where: eq(allowedLibraryPatterns.id, input.id),
      });

      if (!existingPattern) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Library pattern not found",
        });
      }

      await db
        .delete(allowedLibraryPatterns)
        .where(eq(allowedLibraryPatterns.id, input.id));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "delete_library_pattern",
        targetType: "library_pattern",
        targetId: input.id,
        reason: `Deleted library pattern: ${existingPattern.name}`,
        metadata: JSON.stringify({
          name: existingPattern.name,
          urlPattern: existingPattern.urlPattern,
        }),
      });

      return {
        success: true,
        deletedId: input.id,
      };
    }),

  addToTheme: adminProcedure
    .input(
      z.object({
        patternId: z.string().uuid(),
        themeId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const theme = await db.query.themes.findFirst({
        where: eq(themes.id, input.themeId),
      });

      if (!theme) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Theme not found",
        });
      }

      const pattern = await db.query.allowedLibraryPatterns.findFirst({
        where: eq(allowedLibraryPatterns.id, input.patternId),
      });

      if (!pattern) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Library pattern not found",
        });
      }

      if (pattern.isGlobal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Global patterns are already available to all themes",
        });
      }

      const existingAssociation = await db.query.themeAllowedPatterns.findFirst(
        {
          where: and(
            eq(themeAllowedPatterns.themeId, input.themeId),
            eq(themeAllowedPatterns.patternId, input.patternId),
          ),
        },
      );

      if (existingAssociation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Library pattern is already added to this theme",
        });
      }

      await db.insert(themeAllowedPatterns).values({
        themeId: input.themeId,
        patternId: input.patternId,
      });

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "add_library_to_theme",
        targetType: "theme",
        targetId: input.themeId,
        reason: `Added library pattern ${pattern.name} to theme ${theme.title}`,
        metadata: JSON.stringify({
          libraryPatternId: input.patternId,
          themeTitle: theme.title,
          patternName: pattern.name,
        }),
      });

      return {
        success: true,
        themeId: input.themeId,
        patternId: input.patternId,
      };
    }),

  removeFromTheme: adminProcedure
    .input(
      z.object({
        patternId: z.string().uuid(),
        themeId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingAssociation = await db.query.themeAllowedPatterns.findFirst(
        {
          where: and(
            eq(themeAllowedPatterns.themeId, input.themeId),
            eq(themeAllowedPatterns.patternId, input.patternId),
          ),
        },
      );

      if (!existingAssociation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Association not found",
        });
      }

      const pattern = await db.query.allowedLibraryPatterns.findFirst({
        where: eq(allowedLibraryPatterns.id, input.patternId),
      });

      const theme = await db.query.themes.findFirst({
        where: eq(themes.id, input.themeId),
      });

      await db
        .delete(themeAllowedPatterns)
        .where(
          and(
            eq(themeAllowedPatterns.themeId, input.themeId),
            eq(themeAllowedPatterns.patternId, input.patternId),
          ),
        );

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: "remove_library_from_theme",
        targetType: "theme",
        targetId: input.themeId,
        reason: `Removed library pattern ${pattern?.name ?? "unknown"} from theme ${theme?.title ?? "unknown"}`,
        metadata: JSON.stringify({
          libraryPatternId: input.patternId,
          themeTitle: theme?.title,
          patternName: pattern?.name,
        }),
      });

      return {
        success: true,
        themeId: input.themeId,
        patternId: input.patternId,
      };
    }),

  validateUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
      }),
    )
    .query(async ({ input }) => {
      const activePatterns = await db.query.allowedLibraryPatterns.findMany({
        where: eq(allowedLibraryPatterns.status, "active"),
      });

      // Use the shared isUrlAllowed function
      const allowed = isUrlAllowed(input.url, activePatterns);

      return {
        allowed,
      };
    }),
});
