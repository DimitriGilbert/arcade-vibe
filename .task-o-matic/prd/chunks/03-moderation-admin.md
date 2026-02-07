# PRD Chunk 3: Moderation & Admin System

**Source**: `prd-refined.md` lines 1486-2182, 2430-2527

---

## Subscription Plan Management (Lines 1491-1569)

```typescript
export const adminRouter = router({
  // List all subscription plans
  getPlans: adminProcedure.query(async () => {
    return db.query.subscriptionPlans.findMany({
      orderBy: [asc(subscriptionPlans.priceUsd)],
    });
  }),

  // Update plan pricing
  updatePlan: adminProcedure
    .input(z.object({
      planId: z.string().uuid(),
      priceUsd: z.number().int().min(0),
      creditsPerMonth: z.number().int().min(1),
      extraCreditMarkupPercent: z.number().int().min(0).max(100),
      minExtraCreditsPurchase: z.number().int().min(1),
      displayName: z.string().min(1).optional(),
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const oldPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, input.planId),
      });

      await db
        .update(subscriptionPlans)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, input.planId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "update_plan",
        targetType: "plan",
        targetId: input.planId,
        metadata: {
          oldPlan: { priceUsd: oldPlan?.priceUsd, creditsPerMonth: oldPlan?.creditsPerMonth },
          newPlan: { priceUsd: input.priceUsd, creditsPerMonth: input.creditsPerMonth },
        },
      });

      return { success: true };
    }),

  // Activate/deactivate a plan
  togglePlanActive: adminProcedure
    .input(z.object({
      planId: z.string().uuid(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(subscriptionPlans)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, input.planId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: input.isActive ? "activate_plan" : "deactivate_plan",
        targetType: "plan",
        targetId: input.planId,
      });

      return { success: true };
    }),
});
```

---

## Model Management (Lines 1574-1680)

```typescript
export const adminRouter = router({
  // List all models
  getModels: adminProcedure.query(async () => {
    return db.query.modelConfig.findMany({
      orderBy: [asc(modelConfig.provider), asc(modelConfig.tier)],
    });
  }),

  // Activate/deactivate a model
  toggleModelActive: adminProcedure
    .input(z.object({
      modelId: z.string().uuid(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(modelConfig)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(modelConfig.id, input.modelId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: input.isActive ? "activate_model" : "deactivate_model",
        targetType: "model",
        targetId: input.modelId,
      });

      return { success: true };
    }),

  // Update model credit cost
  updateModelPricing: adminProcedure
    .input(z.object({
      modelId: z.string().uuid(),
      creditCost: z.number().int().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const oldModel = await db.query.modelConfig.findFirst({
        where: eq(modelConfig.id, input.modelId),
      });

      await db
        .update(modelConfig)
        .set({ creditCost: input.creditCost, updatedAt: new Date() })
        .where(eq(modelConfig.id, input.modelId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "update_model_pricing",
        targetType: "model",
        targetId: input.modelId,
        metadata: { oldCost: oldModel?.creditCost, newCost: input.creditCost },
      });

      return { success: true };
    }),

  // Add new model
  addModel: adminProcedure
    .input(z.object({
      provider: z.enum(["openai", "anthropic", "google", "openrouter", "deepseek", "glm", "moonshot", "custom"]),
      modelKey: z.string().min(1).max(100),
      displayName: z.string().min(1).max(100),
      tier: z.enum(["cheater", "easy", "normal", "hard", "impossible"]),
      creditCost: z.number().int().min(1),
      supportsStreaming: z.boolean().default(true),
      maxContextTokens: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const model = await db
        .insert(modelConfig)
        .values({ ...input, isActive: true })
        .returning();

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "add_model",
        targetType: "model",
        targetId: model[0].id,
      });

      return model[0];
    }),
});
```

---

## Moderation Router (Lines 1728-2093)

### Submit Report (Lines 1729-1768)

```typescript
export const moderationRouter = router({
  submitReport: protectedProcedure
    .input(z.object({
      targetType: z.enum(["game", "prompt", "profile", "review"]),
      targetId: z.string().uuid(),
      reason: z.enum(["inappropriate", "spam", "malicious", "copyright", "harassment", "other"]),
      description: z.string().min(20).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check for duplicate reports
      const existing = await db.query.moderationReports.findFirst({
        where: and(
          eq(moderationReports.reporterId, ctx.user.id),
          eq(moderationReports.targetType, input.targetType),
          eq(moderationReports.targetId, input.targetId),
          eq(moderationReports.status, "pending"),
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending report for this item.",
        });
      }

      const report = await db.insert(moderationReports).values({
        reporterId: ctx.user.id,
        ...input,
      }).returning();

      await redis.xadd("moderation:new", '*', {
        reportId: report[0].id,
        targetType: input.targetType,
      });

      return report[0];
    }),
```

### Get Queue (Lines 1771-1793)

```typescript
  getQueue: moderatorProcedure
    .input(z.object({
      targetType: z.enum(["game", "prompt", "profile", "review"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const where = input.targetType
        ? eq(moderationReports.targetType, input.targetType)
        : undefined;

      return db.query.moderationReports.findMany({
        where: and(eq(moderationReports.status, "pending"), where),
        orderBy: [asc(moderationReports.createdAt)],
        limit: input.limit,
        with: {
          reporter: { columns: { id: true, username: true } },
          assignedTo: { columns: { id: true, username: true } },
        },
      });
    }),
```

### Get Report Details (Lines 1796-1857)

```typescript
  getReport: moderatorProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .query(async ({ input }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
        with: {
          reporter: { columns: { id: true, username: true } },
          assignedTo: { columns: { id: true, username: true } },
        },
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Fetch target content based on type
      let targetContent;
      if (report.targetType === "game") {
        targetContent = await db.query.games.findFirst({
          where: eq(games.id, report.targetId),
          with: { prompt: { columns: { content: true } } },
        });
      } else if (report.targetType === "prompt") {
        targetContent = await db.query.prompts.findFirst({
          where: eq(prompts.id, report.targetId),
          columns: { content: true },
        });
      } else if (report.targetType === "profile") {
        targetContent = await db.query.users.findFirst({
          where: eq(users.id, report.targetId),
          columns: { username: true, email: true },
        });
      } else if (report.targetType === "review") {
        targetContent = await db.query.ratings.findFirst({
          where: eq(ratings.id, report.targetId),
          columns: { reviewText: true, overallScore: true },
        });
      }

      // Fetch flag history
      const flagHistory = await db.query.moderationReports.findMany({
        where: and(
          eq(moderationReports.targetType, report.targetType),
          eq(moderationReports.targetId, report.targetId),
          ne(moderationReports.id, report.id),
        ),
        orderBy: [desc(moderationReports.createdAt)],
        with: { reporter: { columns: { id: true, username: true } } },
      });

      return { report, targetContent, flagHistory };
    }),
```

### Resolve Report (Lines 1860-1947)

```typescript
  resolveReport: moderatorProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      action: z.enum(["approved", "rejected", "requested_changes", "escalated"]),
      resolutionReason: z.string().min(20).max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db
        .update(moderationReports)
        .set({
          status: "resolved",
          resolutionAction: input.action,
          resolutionReason: input.resolutionReason,
          reviewedAt: new Date(),
          assignedTo: ctx.user.id,
        })
        .where(eq(moderationReports.id, input.reportId));

      // Take action based on resolution
      if (input.action === "approved") {
        if (report.targetType === "game") {
          await db
            .update(games)
            .set({
              status: "hidden",
              hiddenAt: new Date(),
              hiddenBy: ctx.user.id,
              hiddenReason: `Moderation: ${input.resolutionReason}`,
            })
            .where(eq(games.id, report.targetId));

          const game = await db.query.games.findFirst({
            where: eq(games.id, report.targetId),
            with: { prompt: { columns: { themeId: true } } },
          });
          await redis.del(`lb:${game?.prompt.themeId}`);
        } else if (report.targetType === "prompt") {
          await db
            .update(prompts)
            .set({ status: "disqualified" })
            .where(eq(prompts.id, report.targetId));
        } else if (report.targetType === "profile") {
          await db
            .update(users)
            .set({ isSuspended: true, suspensionReason: input.resolutionReason })
            .where(eq(users.id, report.targetId));
        } else if (report.targetType === "review") {
          await db.delete(ratings).where(eq(ratings.id, report.targetId));
        }
      } else if (input.action === "escalated") {
        await redis.xadd("admin:escalation", '*', {
          reportId: input.reportId,
          escalatedBy: ctx.user.id,
        });
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "resolve_report",
        targetType: report.targetType,
        targetId: report.targetId,
        reason: input.resolutionReason,
        metadata: { resolutionAction: input.action, reportId: input.reportId },
      });

      return { success: true };
    }),
```

### Appeal Resolution (Lines 1950-2004)

```typescript
  appealResolution: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      message: z.string().min(50).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const report = await db.query.moderationReports.findFirst({
        where: eq(moderationReports.id, input.reportId),
      });

      if (!report || report.status !== "resolved") {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      // Check if user can appeal (must be content owner)
      let canAppeal = false;
      if (report.targetType === "game") {
        const game = await db.query.games.findFirst({
          where: eq(games.id, report.targetId),
          with: { prompt: true },
        });
        canAppeal = game?.prompt.authorId === ctx.user.id;
      } else if (report.targetType === "prompt") {
        const prompt = await db.query.prompts.findFirst({
          where: eq(prompts.id, report.targetId),
        });
        canAppeal = prompt?.authorId === ctx.user.id;
      } else if (report.targetType === "profile") {
        canAppeal = report.targetId === ctx.user.id;
      } else if (report.targetType === "review") {
        const review = await db.query.ratings.findFirst({
          where: eq(ratings.id, report.targetId),
        });
        canAppeal = review?.userId === ctx.user.id;
      }

      if (!canAppeal) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const appeal = await db.insert(moderationAppeals).values({
        reportId: input.reportId,
        appellantId: ctx.user.id,
        message: input.message,
      }).returning();

      await redis.xadd("moderation:appeal", '*', {
        appealId: appeal[0].id,
        reportId: input.reportId,
      });

      return appeal[0];
    }),
```

### Resolve Appeal (Lines 2027-2091)

```typescript
  resolveAppeal: moderatorProcedure
    .input(z.object({
      appealId: z.string().uuid(),
      status: z.enum(["approved", "rejected"]),
      response: z.string().min(20).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      const appeal = await db.query.moderationAppeals.findFirst({
        where: eq(moderationAppeals.id, input.appealId),
        with: { report: true },
      });

      if (!appeal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db
        .update(moderationAppeals)
        .set({
          status: input.status,
          response: input.response,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(moderationAppeals.id, input.appealId));

      // If approved, revert original resolution
      if (input.status === "approved" && appeal.report.resolutionAction === "approved") {
        if (appeal.report.targetType === "game") {
          await db
            .update(games)
            .set({ status: "completed", hiddenAt: null, hiddenBy: null, hiddenReason: null })
            .where(eq(games.id, appeal.report.targetId));
        } else if (appeal.report.targetType === "prompt") {
          await db
            .update(prompts)
            .set({ status: "draft" })
            .where(eq(prompts.id, appeal.report.targetId));
        } else if (appeal.report.targetType === "profile") {
          await db
            .update(users)
            .set({ isSuspended: false, suspensionReason: null })
            .where(eq(users.id, appeal.report.targetId));
        }
      }

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "resolve_appeal",
        targetType: "appeal",
        targetId: input.appealId,
        reason: input.response,
        metadata: { appealStatus: input.status, originalReportId: appeal.reportId },
      });

      return { success: true };
    }),
});
```

---

## Direct Admin Actions (Lines 2095-2182)

```typescript
export const adminRouter = router({
  hideGame: adminProcedure
    .input(z.object({
      gameId: z.string().uuid(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(games)
        .set({
          status: "hidden",
          hiddenAt: new Date(),
          hiddenBy: ctx.user.id,
          hiddenReason: input.reason,
        })
        .where(eq(games.id, input.gameId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "hide_game",
        targetType: "game",
        targetId: input.gameId,
        reason: input.reason,
      });

      const game = await db.query.games.findFirst({
        where: eq(games.id, input.gameId),
        with: { prompt: { columns: { themeId: true } } },
      });
      await redis.del(`lb:${game.prompt.themeId}`);

      return { success: true };
    }),

  suspendUser: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10).max(500),
      duration: z.enum(["7d", "30d", "permanent"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(users)
        .set({
          isSuspended: true,
          suspensionReason: input.reason,
        })
        .where(eq(users.id, input.userId));

      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        action: "suspend_user",
        targetType: "user",
        targetId: input.userId,
        reason: input.reason,
        metadata: { duration: input.duration },
      });

      return { success: true };
    }),
});
```

---

## Scoring Weight Adjustment (Lines 2469-2527)

```typescript
export const adminRouter = router({
  updateScoringWeights: adminProcedure
    .input(z.object({
      themeId: z.string().uuid(),
      weights: z.object({
        quality: z.number().min(0).max(1),
        difficulty: z.number().min(0).max(1),
        efficiency: z.number().min(0).max(1),
        engagement: z.number().min(0).max(1),
        popularity: z.number().min(0).max(1),
      }).refine(
        (w) => Math.abs(w.quality + w.difficulty + w.efficiency + w.engagement + w.popularity - 1.0) < 0.01,
        { message: "Weights must sum to 1.0" },
      ),
    }))
    .mutation(async ({ input, ctx }) => {
      await db
        .insert(scoringWeights)
        .values({
          themeId: input.themeId,
          qualityWeight: input.weights.quality.toFixed(2),
          difficultyWeight: input.weights.difficulty.toFixed(2),
          efficiencyWeight: input.weights.efficiency.toFixed(2),
          engagementWeight: input.weights.engagement.toFixed(2),
          popularityWeight: input.weights.popularity.toFixed(2),
          updatedBy: ctx.user.id,
        })
        .onConflictDoUpdate({
          target: scoringWeights.themeId,
          set: {
            qualityWeight: input.weights.quality.toFixed(2),
            difficultyWeight: input.weights.difficulty.toFixed(2),
            efficiencyWeight: input.weights.efficiency.toFixed(2),
            engagementWeight: input.weights.engagement.toFixed(2),
            popularityWeight: input.weights.popularity.toFixed(2),
            updatedAt: new Date(),
            updatedBy: ctx.user.id,
          },
        });

      await recalculateThemeScores(input.themeId);

      return { success: true };
    }),
});
```

---

## Admin UI Components (Lines 2184-2194)

Required admin dashboard features:
- **Plan Management Dashboard**: Table of all subscription plans with pricing, credits, markup configuration
- **Model Management Dashboard**: Table of all models with activate/deactivate toggles, credit cost editor
- **Provider Configuration**: Custom endpoint URLs for OpenAI/Anthropic compatible APIs
- **Moderation Dashboard**: Table with flagged games, low ratings, user reports
- **Game Viewer**: Iframe preview with "Hide Game" button + reason textarea
- **User Management**: List of users with "Suspend" action, duration selector
- **Audit Log**: Filterable table of all admin actions with undo capability
- **Theme Management**: CRUD interface for monthly challenges
- **Credit Management**: Grant/revoke credits for users, view transaction history
