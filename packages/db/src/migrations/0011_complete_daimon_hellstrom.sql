CREATE TABLE "stripe_webhook_events" (
	"stripe_event_id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL
);
