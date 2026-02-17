ALTER TABLE "games" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "reasoning_tokens" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "cached_input_tokens" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "request_cost_usd" text;