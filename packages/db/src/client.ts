import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const clients = new Map<string, PostgresJsDatabase<typeof schema>>();

export function createDb(url: string): PostgresJsDatabase<typeof schema> {
  const existing = clients.get(url);
  if (existing) return existing;

  const client = postgres(url, { prepare: false });
  const db = drizzle(client, { schema });
  clients.set(url, db);
  return db;
}
