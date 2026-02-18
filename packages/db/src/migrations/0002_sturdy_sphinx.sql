ALTER TYPE "public"."moderation_target_type" ADD VALUE 'review';--> statement-breakpoint
ALTER TABLE "user_extended" ALTER COLUMN "reputation" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_extended" ALTER COLUMN "credits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_extended" ALTER COLUMN "reputation" SET DATA TYPE integer USING CASE WHEN "reputation" ~ '^-?\d+$' THEN "reputation"::integer ELSE 0 END;--> statement-breakpoint
ALTER TABLE "user_extended" ALTER COLUMN "credits" SET DATA TYPE integer USING CASE WHEN "credits" ~ '^-?\d+$' THEN "credits"::integer ELSE 0 END;--> statement-breakpoint
ALTER TABLE "user_extended" ALTER COLUMN "reputation" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_extended" ALTER COLUMN "credits" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "prompts" ALTER COLUMN "author_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "prompts" ALTER COLUMN "hidden_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "bayesian_rating" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "difficulty_multiplier" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "brevity_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "engagement_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "popularity_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "final_score" numeric(8, 4) NOT NULL;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "calculated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "quality_weight" numeric(3, 2) DEFAULT '0.40';--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "difficulty_weight" numeric(3, 2) DEFAULT '0.25';--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "efficiency_weight" numeric(3, 2) DEFAULT '0.20';--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "engagement_weight" numeric(3, 2) DEFAULT '0.10';--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "popularity_weight" numeric(3, 2) DEFAULT '0.05';--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_games_theme_submitted" ON "games" USING btree ("prompt_id","is_submitted","status");--> statement-breakpoint
CREATE INDEX "idx_games_status_hidden" ON "games" USING btree ("status","hidden_at");--> statement-breakpoint
CREATE INDEX "idx_users_suspended" ON "user_extended" USING btree ("is_suspended");--> statement-breakpoint
CREATE INDEX "idx_model_config_active" ON "model_config" USING btree ("is_active","tier");--> statement-breakpoint
CREATE INDEX "idx_prompts_author_theme" ON "prompts" USING btree ("author_id","theme_id");--> statement-breakpoint
CREATE INDEX "idx_ratings_game_user" ON "ratings" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_scores_theme_final" ON "scores" USING btree ("theme_id","score" desc);--> statement-breakpoint
CREATE INDEX "idx_appeals_status" ON "moderation_appeals" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_status_created" ON "moderation_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_target_status" ON "moderation_reports" USING btree ("target_type","status");--> statement-breakpoint
CREATE INDEX "idx_moderation_reporter_target" ON "moderation_reports" USING btree ("reporter_id","target_type","target_id");--> statement-breakpoint
ALTER TABLE "scoring_weights" DROP COLUMN "prompt_quality_weight";--> statement-breakpoint
ALTER TABLE "scoring_weights" DROP COLUMN "game_quality_weight";--> statement-breakpoint
ALTER TABLE "scoring_weights" DROP COLUMN "theme_relevance_weight";--> statement-breakpoint
ALTER TABLE "scoring_weights" DROP COLUMN "overall_weight";
