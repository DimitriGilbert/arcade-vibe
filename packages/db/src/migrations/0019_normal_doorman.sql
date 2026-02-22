CREATE TYPE "public"."prompt_relation" AS ENUM('version', 'fork');--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "relation_type" "prompt_relation" DEFAULT 'version' NOT NULL;