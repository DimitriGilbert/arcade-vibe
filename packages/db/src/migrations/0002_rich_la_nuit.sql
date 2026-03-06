DROP INDEX "user_preferences_leaderboard_idx";--> statement-breakpoint
DROP INDEX "user_preferences_creator_idx";--> statement-breakpoint
ALTER TABLE "user_preferences" RENAME TO "user_preferences_legacy";--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_preferences_user_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_name_idx" ON "user_preferences" USING btree ("user_id","name");--> statement-breakpoint
INSERT INTO "user_preferences" ("user_id", "name", "value")
SELECT
	"user_id",
	'defaultLeaderboardImplementation',
	"default_leaderboard_implementation"::text
FROM "user_preferences_legacy"
WHERE "default_leaderboard_implementation" IS NOT NULL;--> statement-breakpoint
INSERT INTO "user_preferences" ("user_id", "name", "value")
SELECT
	"user_id",
	'defaultCreatorImplementation',
	"default_creator_implementation"::text
FROM "user_preferences_legacy"
WHERE "default_creator_implementation" IS NOT NULL;--> statement-breakpoint
DROP TABLE "user_preferences_legacy";--> statement-breakpoint
DROP TYPE "public"."creator_implementation";--> statement-breakpoint
DROP TYPE "public"."leaderboard_implementation";
