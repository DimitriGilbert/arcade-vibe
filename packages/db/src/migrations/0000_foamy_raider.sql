CREATE TYPE "public"."game_status" AS ENUM('generating', 'completed', 'failed', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."library_category" AS ENUM('game_engine', 'physics', 'audio', 'graphics', 'utility', 'analytics', 'other');--> statement-breakpoint
CREATE TYPE "public"."library_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."moderation_appeal_status" AS ENUM('pending', 'reviewing', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."moderation_report_status" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."moderation_target_type" AS ENUM('prompt', 'game', 'user', 'review');--> statement-breakpoint
CREATE TYPE "public"."prompt_relation" AS ENUM('version', 'fork');--> statement-breakpoint
CREATE TYPE "public"."prompt_status" AS ENUM('draft', 'submitted', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('openai', 'anthropic', 'google', 'openrouter', 'deepseek', 'glm', 'glm-coding-plan', 'moonshot', 'custom');--> statement-breakpoint
CREATE TYPE "public"."theme_status" AS ENUM('upcoming', 'active', 'frozen', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'moderator', 'participant', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'public_on_freeze', 'public');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_games_collectionId_gameId_key" UNIQUE("collection_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"batch_id" uuid,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"stripe_event_id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"price" integer NOT NULL,
	"credits" integer NOT NULL,
	"features" text[],
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_one_time" boolean DEFAULT false NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"credit_validity_days" integer,
	"extra_credit_markup_percent" integer DEFAULT 30 NOT NULL,
	"min_extra_credits_purchase" integer DEFAULT 25 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_stripe_price_id_unique" UNIQUE("stripe_price_id"),
	CONSTRAINT "subscription_plans_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tier_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"credit_cost" integer NOT NULL,
	"description" text,
	"score_multiplier" real DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"color_class" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tier_costs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"stripe_subscription_id" text,
	"status" text NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"resend_id" text,
	"email_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subject" text NOT NULL,
	"from_email" text NOT NULL,
	"to_email" text NOT NULL,
	"html_content" text,
	"text_content" text,
	"template_id" text,
	"template_variables" jsonb,
	"idempotency_key" text NOT NULL,
	"error_message" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"answer" jsonb NOT NULL,
	"comment" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"score" integer NOT NULL,
	"is_high_score" boolean DEFAULT false NOT NULL,
	"completion_time" integer,
	"played_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_scores_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "game_session_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"playtime_seconds" integer DEFAULT 0 NOT NULL,
	"has_score_event" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_session_metrics_session_id_unique" UNIQUE("session_id")
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
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"prompt_id" uuid NOT NULL,
	"theme_id" uuid,
	"status" "game_status" DEFAULT 'generating' NOT NULL,
	"model_provider" text NOT NULL,
	"model_name" text NOT NULL,
	"tier_cost_id" uuid NOT NULL,
	"token_usage" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"reasoning_tokens" integer,
	"cached_input_tokens" integer,
	"request_cost_usd" text,
	"game_data" text,
	"image_url" text,
	"generated_at" timestamp,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" text,
	"hidden_at" timestamp,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp,
	"blocked_script_urls" jsonb,
	"sanitization_applied" boolean DEFAULT false NOT NULL,
	"strudel_code" text,
	"media_urls" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_extended" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'participant' NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspension_reason" text,
	"suspended_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" "provider" NOT NULL,
	"key_hash" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_userId_provider_key" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "model_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_name" text NOT NULL,
	"tier_cost_id" uuid NOT NULL,
	"cost_per_1k_tokens" text NOT NULL,
	"max_tokens" integer NOT NULL,
	"supports_images" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"model_created_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_config_modelName_key" UNIQUE("model_name")
);
--> statement-breakpoint
CREATE TABLE "model_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_config_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_providers_modelConfigId_provider_key" UNIQUE("model_config_id","provider")
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "theme_status" DEFAULT 'upcoming' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"requirements" jsonb NOT NULL,
	"system_prompt" text NOT NULL,
	"media_config" jsonb,
	"is_permanent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "themes_title_key" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"theme_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" varchar(100),
	"content" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"token_count" integer NOT NULL,
	"tokenizer" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"status" "prompt_status" DEFAULT 'draft' NOT NULL,
	"relation_type" "prompt_relation" DEFAULT 'version' NOT NULL,
	"hidden_at" timestamp,
	"hidden_by" text,
	"hidden_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"theme_id" uuid,
	"user_id" text NOT NULL,
	"prompt_quality" integer,
	"game_quality" integer,
	"theme_relevance" integer,
	"overall" integer NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_userId_promptId_gameId_key" UNIQUE("user_id","prompt_id","game_id"),
	CONSTRAINT "ratings_range_check" CHECK (
      (prompt_quality IS NULL OR prompt_quality BETWEEN 1 AND 5) AND
      (game_quality IS NULL OR game_quality BETWEEN 1 AND 5) AND
      (theme_relevance IS NULL OR theme_relevance BETWEEN 1 AND 5) AND
      overall BETWEEN 1 AND 5
    )
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
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"prompt_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"theme_id" uuid,
	"score" integer NOT NULL,
	"is_high_score" boolean DEFAULT false NOT NULL,
	"completion_time" integer,
	"played_at" timestamp DEFAULT now() NOT NULL,
	"quality_score" numeric(6, 4),
	"engagement_score" numeric(6, 4),
	"players_score" numeric(6, 4),
	"plays_score" numeric(6, 4),
	"replay_score" numeric(6, 4),
	"efficiency_score" numeric(6, 4),
	"tier_factor" numeric(5, 4),
	"input_tokens" integer,
	"final_score" numeric(8, 4) NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "scores_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" text NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"reason" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"total_prompts" integer DEFAULT 0 NOT NULL,
	"total_games" integer DEFAULT 0 NOT NULL,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"average_rating" text DEFAULT '0' NOT NULL,
	"last_calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid,
	"quality_weight" numeric(3, 2) DEFAULT '0.40',
	"difficulty_weight" numeric(3, 2) DEFAULT '0.25',
	"efficiency_weight" numeric(3, 2) DEFAULT '0.20',
	"engagement_weight" numeric(3, 2) DEFAULT '0.10',
	"popularity_weight" numeric(3, 2) DEFAULT '0.05',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scoring_weights_theme_id_unique" UNIQUE("theme_id")
);
--> statement-breakpoint
CREATE TABLE "moderation_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"appellant_id" text NOT NULL,
	"reason" text NOT NULL,
	"evidence" text,
	"status" "moderation_appeal_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"decision_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" "moderation_target_type" NOT NULL,
	"target_id" uuid,
	"target_user_id" text,
	"reason" text NOT NULL,
	"description" text,
	"status" "moderation_report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "theme_allowed_patterns_themeId_patternId_key" UNIQUE("theme_id","pattern_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_games" ADD CONSTRAINT "collection_games_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_games" ADD CONSTRAINT "collection_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_batches" ADD CONSTRAINT "credit_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invoices" ADD CONSTRAINT "user_invoices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invoices" ADD CONSTRAINT "user_invoices_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_metrics" ADD CONSTRAINT "game_session_metrics_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_metrics" ADD CONSTRAINT "game_session_metrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_versions" ADD CONSTRAINT "game_versions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_versions" ADD CONSTRAINT "game_versions_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_tier_cost_id_tier_costs_id_fk" FOREIGN KEY ("tier_cost_id") REFERENCES "public"."tier_costs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_extended" ADD CONSTRAINT "user_extended_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_config" ADD CONSTRAINT "model_config_tier_cost_id_tier_costs_id_fk" FOREIGN KEY ("tier_cost_id") REFERENCES "public"."tier_costs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_providers" ADD CONSTRAINT "model_providers_model_config_id_model_config_id_fk" FOREIGN KEY ("model_config_id") REFERENCES "public"."model_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_parent_id_prompts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_hidden_by_user_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_history" ADD CONSTRAINT "score_history_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_history" ADD CONSTRAINT "score_history_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_report_id_moderation_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."moderation_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_appellant_id_user_id_fk" FOREIGN KEY ("appellant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspicious_activity_logs" ADD CONSTRAINT "suspicious_activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspicious_activity_logs" ADD CONSTRAINT "suspicious_activity_logs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowed_library_patterns" ADD CONSTRAINT "allowed_library_patterns_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_allowed_patterns" ADD CONSTRAINT "theme_allowed_patterns_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_allowed_patterns" ADD CONSTRAINT "theme_allowed_patterns_pattern_id_allowed_library_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."allowed_library_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "collection_games_collectionId_idx" ON "collection_games" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_games_gameId_idx" ON "collection_games" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "collections_userId_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collections_isPublic_idx" ON "collections" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "collections_createdAt_idx" ON "collections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_batches_userId_idx" ON "credit_batches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_batches_expiresAt_idx" ON "credit_batches" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_invoices_userId_idx" ON "user_invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_invoices_stripeInvoiceId_idx" ON "user_invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_planId_idx" ON "user_subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "email_logs_userId_idx" ON "email_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_logs_status_idx" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_logs_emailType_idx" ON "email_logs" USING btree ("email_type");--> statement-breakpoint
CREATE INDEX "email_logs_resendId_idx" ON "email_logs" USING btree ("resend_id");--> statement-breakpoint
CREATE INDEX "email_logs_idempotencyKey_idx" ON "email_logs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_templates_name_idx" ON "email_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "email_templates_isActive_idx" ON "email_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "feedback_userId_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_scores_gameId_idx" ON "game_scores" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_scores_userId_idx" ON "game_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_session_metrics_gameId_idx" ON "game_session_metrics" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_session_metrics_userId_idx" ON "game_session_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_session_metrics_endedAt_idx" ON "game_session_metrics" USING btree ("ended_at");--> statement-breakpoint
CREATE INDEX "game_versions_gameId_idx" ON "game_versions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_versions_game_version" ON "game_versions" USING btree ("game_id","version");--> statement-breakpoint
CREATE INDEX "games_promptId_idx" ON "games" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "games_themeId_idx" ON "games" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "idx_games_theme_submitted" ON "games" USING btree ("prompt_id","is_submitted","status");--> statement-breakpoint
CREATE INDEX "idx_games_status_hidden" ON "games" USING btree ("status","hidden_at");--> statement-breakpoint
CREATE INDEX "idx_games_deleted_at" ON "games" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_games_status_created" ON "games" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_users_suspended" ON "user_extended" USING btree ("is_suspended");--> statement-breakpoint
CREATE INDEX "api_keys_userId_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_model_config_active" ON "model_config" USING btree ("is_active","tier_cost_id");--> statement-breakpoint
CREATE INDEX "model_providers_provider_idx" ON "model_providers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "prompts_authorId_idx" ON "prompts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "prompts_themeId_idx" ON "prompts" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "prompts_parentId_idx" ON "prompts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "prompts_title_idx" ON "prompts" USING btree ("title");--> statement-breakpoint
CREATE INDEX "prompts_contentHash_idx" ON "prompts" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "prompts_visibility_idx" ON "prompts" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_prompts_author_theme" ON "prompts" USING btree ("author_id","theme_id");--> statement-breakpoint
CREATE INDEX "prompt_runs_promptId_idx" ON "prompt_runs" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_runs_gameId_idx" ON "prompt_runs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "ratings_promptId_idx" ON "ratings" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "ratings_gameId_idx" ON "ratings" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "ratings_themeId_idx" ON "ratings" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "ratings_userId_idx" ON "ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ratings_game_user" ON "ratings" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE INDEX "score_history_gameId_idx" ON "score_history" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "score_history_calculatedAt_idx" ON "score_history" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "score_recalculation_jobs_status_idx" ON "score_recalculation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scores_userId_idx" ON "scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scores_promptId_idx" ON "scores" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "scores_gameId_idx" ON "scores" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "scores_themeId_idx" ON "scores" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "idx_scores_theme_final" ON "scores" USING btree ("theme_id","score" desc);--> statement-breakpoint
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_actions_targetType_targetId_idx" ON "admin_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "platform_stats_lastCalculatedAt_idx" ON "platform_stats" USING btree ("last_calculated_at");--> statement-breakpoint
CREATE INDEX "scoring_weights_themeId_idx" ON "scoring_weights" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "scoring_weights_isActive_idx" ON "scoring_weights" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "moderation_appeals_reportId_idx" ON "moderation_appeals" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "moderation_appeals_appellantId_idx" ON "moderation_appeals" USING btree ("appellant_id");--> statement-breakpoint
CREATE INDEX "moderation_appeals_status_idx" ON "moderation_appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_appeals_status" ON "moderation_appeals" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "moderation_reports_reporterId_idx" ON "moderation_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "moderation_reports_targetType_targetId_idx" ON "moderation_reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "moderation_reports_targetUserId_idx" ON "moderation_reports" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "moderation_reports_status_idx" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_moderation_status_created" ON "moderation_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_target_status" ON "moderation_reports" USING btree ("target_type","status");--> statement-breakpoint
CREATE INDEX "idx_moderation_reporter_target" ON "moderation_reports" USING btree ("reporter_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "suspicious_activity_logs_userId_idx" ON "suspicious_activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "suspicious_activity_logs_gameId_idx" ON "suspicious_activity_logs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "suspicious_activity_logs_activityType_idx" ON "suspicious_activity_logs" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "allowed_library_patterns_global_idx" ON "allowed_library_patterns" USING btree ("is_global");--> statement-breakpoint
CREATE INDEX "allowed_library_patterns_status_idx" ON "allowed_library_patterns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "allowed_library_patterns_category_idx" ON "allowed_library_patterns" USING btree ("category");--> statement-breakpoint
CREATE INDEX "theme_allowed_patterns_themeId_idx" ON "theme_allowed_patterns" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "theme_allowed_patterns_patternId_idx" ON "theme_allowed_patterns" USING btree ("pattern_id");