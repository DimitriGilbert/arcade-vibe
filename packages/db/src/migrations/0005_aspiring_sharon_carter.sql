CREATE TYPE "public"."library_category" AS ENUM('game_engine', 'physics', 'audio', 'graphics', 'utility', 'analytics', 'other');--> statement-breakpoint
CREATE TYPE "public"."library_status" AS ENUM('active', 'disabled');--> statement-breakpoint
ALTER TYPE "public"."model_tier" ADD VALUE 'very_easy' BEFORE 'easy';--> statement-breakpoint
ALTER TYPE "public"."model_tier" ADD VALUE 'very_hard' BEFORE 'impossible';--> statement-breakpoint
CREATE TABLE "tier_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" "model_tier" NOT NULL,
	"credit_cost" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tier_costs_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE "allowed_library_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"url_pattern" text NOT NULL,
	"category" "library_category" NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"status" "library_status" DEFAULT 'active' NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_allowed_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"pattern_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "blocked_script_urls" jsonb;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "sanitization_applied" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "allowed_library_patterns" ADD CONSTRAINT "allowed_library_patterns_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_allowed_patterns" ADD CONSTRAINT "theme_allowed_patterns_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_allowed_patterns" ADD CONSTRAINT "theme_allowed_patterns_pattern_id_allowed_library_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."allowed_library_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "allowed_library_patterns_global_idx" ON "allowed_library_patterns" USING btree ("is_global");--> statement-breakpoint
CREATE INDEX "allowed_library_patterns_status_idx" ON "allowed_library_patterns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "allowed_library_patterns_category_idx" ON "allowed_library_patterns" USING btree ("category");--> statement-breakpoint
CREATE INDEX "theme_allowed_patterns_themeId_idx" ON "theme_allowed_patterns" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "theme_allowed_patterns_patternId_idx" ON "theme_allowed_patterns" USING btree ("pattern_id");--> statement-breakpoint
CREATE INDEX "theme_allowed_patterns_unique_idx" ON "theme_allowed_patterns" USING btree ("theme_id","pattern_id");