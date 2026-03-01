CREATE TABLE "collection_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_games_collectionId_gameId_key" UNIQUE("collection_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_session_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"playtime_seconds" integer DEFAULT 0 NOT NULL,
	"has_score_event" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_session_metrics_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_parent_id_prompts_id_fk";
--> statement-breakpoint
DROP INDEX "theme_allowed_patterns_unique_idx";--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "engagement_score" SET DATA TYPE numeric(6, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "quality_score" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "players_score" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "plays_score" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "replay_score" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "efficiency_score" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "tier_factor" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "collection_games" ADD CONSTRAINT "collection_games_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_games" ADD CONSTRAINT "collection_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_metrics" ADD CONSTRAINT "game_session_metrics_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_metrics" ADD CONSTRAINT "game_session_metrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_games_collectionId_idx" ON "collection_games" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_games_gameId_idx" ON "collection_games" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "collections_userId_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collections_isPublic_idx" ON "collections" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "collections_createdAt_idx" ON "collections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "game_session_metrics_gameId_idx" ON "game_session_metrics" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_session_metrics_userId_idx" ON "game_session_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_session_metrics_endedAt_idx" ON "game_session_metrics" USING btree ("ended_at");--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_parent_id_prompts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "bayesian_rating";--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "difficulty_multiplier";--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "brevity_score";--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "popularity_score";--> statement-breakpoint
ALTER TABLE "theme_allowed_patterns" ADD CONSTRAINT "theme_allowed_patterns_themeId_patternId_key" UNIQUE("theme_id","pattern_id");--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_range_check" CHECK (
      (prompt_quality IS NULL OR prompt_quality BETWEEN 1 AND 5) AND
      (game_quality IS NULL OR game_quality BETWEEN 1 AND 5) AND
      (theme_relevance IS NULL OR theme_relevance BETWEEN 1 AND 5) AND
      overall BETWEEN 1 AND 5
    );