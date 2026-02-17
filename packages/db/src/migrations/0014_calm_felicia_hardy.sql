ALTER TABLE "scores" ALTER COLUMN "bayesian_rating" SET DATA TYPE numeric(6, 2);--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "difficulty_multiplier" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "brevity_score" SET DATA TYPE numeric(6, 2);--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "engagement_score" SET DATA TYPE numeric(6, 2);--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "popularity_score" SET DATA TYPE numeric(6, 2);