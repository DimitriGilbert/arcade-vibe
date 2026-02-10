CREATE TABLE "suspicious_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"game_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"details" jsonb NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_config" ALTER COLUMN "tier" SET DATA TYPE "public"."model_tier" USING "tier"::"public"."model_tier";--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "display_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "extra_credit_markup_percent" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "min_extra_credits_purchase" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "current_period_start" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "token_usage" integer;--> statement-breakpoint
ALTER TABLE "suspicious_activity_logs" ADD CONSTRAINT "suspicious_activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspicious_activity_logs" ADD CONSTRAINT "suspicious_activity_logs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suspicious_activity_logs_userId_idx" ON "suspicious_activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "suspicious_activity_logs_gameId_idx" ON "suspicious_activity_logs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "suspicious_activity_logs_activityType_idx" ON "suspicious_activity_logs" USING btree ("activity_type");