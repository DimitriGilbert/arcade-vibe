import { router, protectedProcedure, adminProcedure } from "@arcade-vibe/api";
import { db } from "@arcade-vibe/db";
import { feedback } from "@arcade-vibe/db/schema/feedback";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const feedbackAnswerSchema = z.record(z.string(), z.unknown());

export const feedbackRouter = router({
  /**
   * Submit feedback (requires authentication)
   */
  submit: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "Subject is required"),
        answer: feedbackAnswerSchema,
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newFeedback] = await db
        .insert(feedback)
        .values({
          subject: input.subject,
          answer: input.answer,
          comment: input.comment ?? null,
          userId: ctx.user.id,
        })
        .returning();

      if (!newFeedback) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit feedback",
        });
      }

      return {
        success: true,
        feedbackId: newFeedback.id,
        createdAt: newFeedback.createdAt,
      };
    }),

  /**
   * List all feedback (admin only)
   */
  list: adminProcedure.query(async () => {
    const feedbackList = await db.query.feedback.findMany({
      orderBy: [desc(feedback.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return feedbackList;
  }),

  /**
   * Get single feedback by ID (admin only)
   */
  getById: adminProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid feedback ID"),
      }),
    )
    .query(async ({ input }) => {
      const feedbackItem = await db.query.feedback.findFirst({
        where: eq(feedback.id, input.id),
      });

      if (!feedbackItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback not found",
        });
      }

      return feedbackItem;
    }),

  /**
   * Delete feedback by ID (admin only)
   */
  delete: adminProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid feedback ID"),
      }),
    )
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(feedback)
        .where(eq(feedback.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback not found",
        });
      }

      return { success: true, deletedId: deleted.id };
    }),
});
