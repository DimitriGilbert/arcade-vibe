CREATE TABLE "model_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_config_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_providers_modelConfigId_provider_key" UNIQUE("model_config_id","provider")
);
--> statement-breakpoint
ALTER TABLE "model_config" DROP CONSTRAINT "model_config_provider_modelName_key";--> statement-breakpoint
ALTER TABLE "model_providers" ADD CONSTRAINT "model_providers_model_config_id_model_config_id_fk" FOREIGN KEY ("model_config_id") REFERENCES "public"."model_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_providers_provider_idx" ON "model_providers" USING btree ("provider");--> statement-breakpoint
ALTER TABLE "model_config" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "model_config" ADD CONSTRAINT "model_config_modelName_key" UNIQUE("model_name");