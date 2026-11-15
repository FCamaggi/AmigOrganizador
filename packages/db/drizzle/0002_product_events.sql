CREATE TABLE "app"."product_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."product_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"kind" text NOT NULL,
	"account_id" text NOT NULL,
	"group_id" text,
	"plan_id" text,
	"setup_seconds" integer,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_events_kind_at_idx" ON "app"."product_events" USING btree ("kind","at");--> statement-breakpoint
ALTER TABLE app.product_events ENABLE ROW LEVEL SECURITY;
