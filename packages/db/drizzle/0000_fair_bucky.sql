CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TABLE "app"."calendar_sources" (
	"account_id" text NOT NULL,
	"calendar_id" text NOT NULL,
	"url_ciphertext" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "calendar_sources_account_id_calendar_id_pk" PRIMARY KEY("account_id","calendar_id")
);
--> statement-breakpoint
CREATE TABLE "app"."group_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."groups" (
	"id" text PRIMARY KEY NOT NULL,
	"invite_code" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "app"."profiles" (
	"account_id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "group_plans_group_id_idx" ON "app"."group_plans" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "groups_members_gin_idx" ON "app"."groups" USING gin (("data"->'members') jsonb_path_ops);