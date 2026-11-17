import type { Group, GroupPlan, Person, Profile } from "@amigo/core";
import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const appSchema = pgSchema("app");

export const groups = appSchema.table(
  "groups",
  {
    id: text("id").primaryKey(),
    inviteCode: text("invite_code").notNull().unique(),
    data: jsonb("data").$type<Group>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("groups_members_gin_idx").using(
      "gin",
      sql`(${table.data}->'members') jsonb_path_ops`,
    ),
  ],
);

/** Schedules: several per account (ADR 0004 amendment), keyed by id. */
export const profiles = appSchema.table(
  "profiles",
  {
    accountId: text("account_id").notNull(),
    /** `scheduleId(data)`; rows saved before schedules are `default`. */
    scheduleId: text("schedule_id").notNull().default("default"),
    data: jsonb("data").$type<Profile>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.scheduleId] })],
);

/** The person behind an account: name and which schedule each group reads. */
export const people = appSchema.table("people", {
  accountId: text("account_id").primaryKey(),
  data: jsonb("data").$type<Person>().notNull(),
});

export const groupPlans = appSchema.table(
  "group_plans",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull(),
    data: jsonb("data").$type<GroupPlan>().notNull(),
  },
  (table) => [index("group_plans_group_id_idx").on(table.groupId)],
);

export const calendarSources = appSchema.table(
  "calendar_sources",
  {
    accountId: text("account_id").notNull(),
    calendarId: text("calendar_id").notNull(),
    urlCiphertext: text("url_ciphertext").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.accountId, table.calendarId],
    }),
  ],
);

/** Phase 1 exit test events (`docs/product/METRICS.md`): ids and times only. */
export const productEvents = appSchema.table(
  "product_events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    kind: text("kind").notNull(),
    accountId: text("account_id").notNull(),
    groupId: text("group_id"),
    planId: text("plan_id"),
    setupSeconds: integer("setup_seconds"),
    at: timestamp("at", { withTimezone: true }).notNull(),
  },
  (table) => [index("product_events_kind_at_idx").on(table.kind, table.at)],
);
