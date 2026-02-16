ALTER TABLE "game_scores" ADD COLUMN "session_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_extended" ADD COLUMN "suspended_until" timestamp;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "is_permanent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_session_id_unique" UNIQUE("session_id");--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_game_id_unique" UNIQUE("game_id");--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_theme_id_unique" UNIQUE("theme_id");