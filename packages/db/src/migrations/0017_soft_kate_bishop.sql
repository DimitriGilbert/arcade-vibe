TRUNCATE TABLE "model_config";
ALTER TABLE "model_config" ADD COLUMN "model_created_at" timestamp NOT NULL DEFAULT now();