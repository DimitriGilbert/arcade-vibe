ALTER TABLE "user_extended" ALTER COLUMN "credits" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "strudel_code" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "media_urls" jsonb;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "media_config" jsonb;