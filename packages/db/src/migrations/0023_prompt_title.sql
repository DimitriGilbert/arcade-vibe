ALTER TABLE "prompts" ADD COLUMN "title" varchar(100);
--> statement-breakpoint
CREATE INDEX "prompts_title_idx" ON "prompts" USING btree ("title");
