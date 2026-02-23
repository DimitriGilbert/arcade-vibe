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
ALTER TABLE "game_session_metrics" ADD CONSTRAINT "game_session_metrics_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_session_metrics" ADD CONSTRAINT "game_session_metrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "game_session_metrics_gameId_idx" ON "game_session_metrics" USING btree ("game_id");
--> statement-breakpoint
CREATE INDEX "game_session_metrics_userId_idx" ON "game_session_metrics" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "game_session_metrics_endedAt_idx" ON "game_session_metrics" USING btree ("ended_at");
--> statement-breakpoint

TRUNCATE TABLE "score_history", "scores" RESTART IDENTITY;
--> statement-breakpoint

ALTER TABLE "scores" DROP COLUMN "bayesian_rating";
--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "difficulty_multiplier";
--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "brevity_score";
--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "engagement_score";
--> statement-breakpoint
ALTER TABLE "scores" DROP COLUMN "popularity_score";
--> statement-breakpoint

ALTER TABLE "scores" ADD COLUMN "quality_score" decimal(6,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "engagement_score" decimal(6,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "players_score" decimal(6,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "plays_score" decimal(6,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "replay_score" decimal(6,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "efficiency_score" decimal(6,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "tier_factor" decimal(5,4);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "input_tokens" integer;
