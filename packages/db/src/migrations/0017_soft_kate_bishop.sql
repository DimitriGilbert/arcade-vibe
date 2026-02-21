TRUNCATE TABLE "model_config" CASCADE;
ALTER TABLE "model_config" ADD COLUMN "model_created_at" timestamp NOT NULL DEFAULT now();