ALTER TABLE "games" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "hidden_reason" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "hidden_at" timestamp;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "is_submitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "submitted_at" timestamp;