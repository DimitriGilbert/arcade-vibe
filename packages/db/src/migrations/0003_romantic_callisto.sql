CREATE INDEX "idx_game_session_metrics_game_ended" ON "game_session_metrics" USING btree ("game_id","ended_at");--> statement-breakpoint
CREATE INDEX "idx_games_leaderboard_filter" ON "games" USING btree ("theme_id","is_submitted","status","is_hidden","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_themes_status_dates" ON "themes" USING btree ("status","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_themes_is_permanent" ON "themes" USING btree ("is_permanent");