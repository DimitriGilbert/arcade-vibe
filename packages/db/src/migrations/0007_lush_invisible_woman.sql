ALTER TABLE "games" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "failure_details" jsonb;