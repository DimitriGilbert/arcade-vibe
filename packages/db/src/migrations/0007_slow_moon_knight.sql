ALTER TABLE "games" RENAME COLUMN "model_tier" TO "tier_cost_id";--> statement-breakpoint
ALTER TABLE "model_config" RENAME COLUMN "tier" TO "tier_cost_id";--> statement-breakpoint
ALTER TABLE "tier_costs" DROP CONSTRAINT "tier_costs_tier_unique";--> statement-breakpoint
DROP INDEX "idx_model_config_active";--> statement-breakpoint
ALTER TABLE "tier_costs" ADD COLUMN "slug" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tier_costs" ADD COLUMN "name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "tier_costs" ADD COLUMN "score_multiplier" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tier_costs" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tier_costs" ADD COLUMN "color_class" varchar(100);--> statement-breakpoint
ALTER TABLE "tier_costs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_tier_cost_id_tier_costs_id_fk" FOREIGN KEY ("tier_cost_id") REFERENCES "public"."tier_costs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_config" ADD CONSTRAINT "model_config_tier_cost_id_tier_costs_id_fk" FOREIGN KEY ("tier_cost_id") REFERENCES "public"."tier_costs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_model_config_active" ON "model_config" USING btree ("is_active","tier_cost_id");--> statement-breakpoint
ALTER TABLE "tier_costs" DROP COLUMN "tier";--> statement-breakpoint
ALTER TABLE "tier_costs" ADD CONSTRAINT "tier_costs_slug_unique" UNIQUE("slug");--> statement-breakpoint
DROP TYPE "public"."model_tier";