CREATE TYPE "public"."creator_implementation" AS ENUM('workbench', 'inbox', 'filebrowser');--> statement-breakpoint
CREATE TYPE "public"."leaderboard_implementation" AS ENUM('arena', 'dashboard', 'magazine');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"default_leaderboard_implementation" "leaderboard_implementation",
	"default_creator_implementation" "creator_implementation",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_preferences_leaderboard_idx" ON "user_preferences" USING btree ("default_leaderboard_implementation");--> statement-breakpoint
CREATE INDEX "user_preferences_creator_idx" ON "user_preferences" USING btree ("default_creator_implementation");