ALTER TABLE "games" ADD COLUMN "generation_time_ms" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "time_to_first_token_ms" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "tokens_per_second" double precision;