CREATE TABLE "credit_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"remaining_amount" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ALTER COLUMN "target_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "credit_validity_days" integer;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD CONSTRAINT "credit_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_batches_userId_idx" ON "credit_batches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_batches_expiresAt_idx" ON "credit_batches" USING btree ("expires_at");