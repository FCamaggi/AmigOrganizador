-- Several named schedules per account (ADR 0004 amendment). Existing rows keep
-- their data untouched and become each account's `default` schedule.
CREATE TABLE "app"."people" (
	"account_id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE app.people ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app"."profiles" ADD COLUMN "schedule_id" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."profiles" DROP CONSTRAINT "profiles_pkey";--> statement-breakpoint
ALTER TABLE "app"."profiles" ADD CONSTRAINT "profiles_account_id_schedule_id_pk" PRIMARY KEY("account_id","schedule_id");
