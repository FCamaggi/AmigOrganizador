import type { Group, GroupPlan, Profile } from "@amigo/core";
import { sql } from "drizzle-orm";
import {
  bigint,
  index,
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

export const profiles = appSchema.table("profiles", {
  accountId: text("account_id").primaryKey(),
  data: jsonb("data").$type<Profile>().notNull(),
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
