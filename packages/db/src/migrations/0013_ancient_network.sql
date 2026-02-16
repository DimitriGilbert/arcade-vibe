CREATE TABLE "user_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" uuid,
	"stripe_invoice_id" text NOT NULL,
	"stripe_subscription_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"invoice_pdf" text,
	"invoice_url" text,
	"hosted_invoice_url" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "game_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"name" text,
	"game_data" text,
	"strudel_code" text,
	"media_urls" jsonb,
	"changed_by" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"score_id" uuid NOT NULL,
	"previous_score" numeric(8, 4),
	"new_score" numeric(8, 4) NOT NULL,
	"previous_components" text,
	"new_components" text,
	"reason" text DEFAULT 'recalculation' NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_recalculation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_games" integer DEFAULT 0 NOT NULL,
	"processed_games" integer DEFAULT 0 NOT NULL,
	"failed_games" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_invoices" ADD CONSTRAINT "user_invoices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invoices" ADD CONSTRAINT "user_invoices_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_versions" ADD CONSTRAINT "game_versions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_versions" ADD CONSTRAINT "game_versions_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_history" ADD CONSTRAINT "score_history_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_history" ADD CONSTRAINT "score_history_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_invoices_userId_idx" ON "user_invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_invoices_stripeInvoiceId_idx" ON "user_invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "game_versions_gameId_idx" ON "game_versions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_versions_game_version" ON "game_versions" USING btree ("game_id","version");--> statement-breakpoint
CREATE INDEX "score_history_gameId_idx" ON "score_history" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "score_history_calculatedAt_idx" ON "score_history" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "score_recalculation_jobs_status_idx" ON "score_recalculation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_games_deleted_at" ON "games" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_games_status_created" ON "games" USING btree ("status","created_at");