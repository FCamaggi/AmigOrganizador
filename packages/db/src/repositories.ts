import {
  type CalendarSource,
  type CalendarSourceRepository,
  type Group,
  type GroupPlan,
  type GroupPlanRepository,
  type GroupRepository,
  type Person,
  type PersonRepository,
  type ProductEvent,
  type ProductEventRepository,
  type Profile,
  type ProfileRepository,
  scheduleId,
} from "@amigo/core";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "./client";
import { decryptUrl, encryptUrl } from "./crypto";
import {
  calendarSources,
  groupPlans,
  groups,
  people,
  productEvents,
  profiles,
} from "./schema";

export class PostgresGroupRepository implements GroupRepository {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async findById(id: string): Promise<Group | null> {
    const [row] = await this.#db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);
    return row ? structuredClone(row.data) : null;
  }

  async findByInviteCode(inviteCode: string): Promise<Group | null> {
    const [row] = await this.#db
      .select()
      .from(groups)
      .where(eq(groups.inviteCode, inviteCode))
      .limit(1);
    return row ? structuredClone(row.data) : null;
  }

  async listForAccount(accountId: string): Promise<Group[]> {
    const needle = JSON.stringify([{ accountId }]);
    const rows = await this.#db
      .select()
      .from(groups)
      .where(sql`(${groups.data}->'members') @> ${needle}::jsonb`);
    const joinedAt = (group: Group) =>
      group.members.find((m) => m.accountId === accountId)?.joinedAt ?? 0;
    return rows
      .map((row) => structuredClone(row.data))
      .filter((group) => group.members.some((m) => m.accountId === accountId))
      .sort((a, b) => joinedAt(b) - joinedAt(a));
  }

  async save(group: Group): Promise<void> {
    const copy = structuredClone(group);
    const updatedAt = new Date();
    await this.#db
      .insert(groups)
      .values({
        id: copy.id,
        inviteCode: copy.inviteCode,
        data: copy,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: groups.id,
        set: {
          inviteCode: copy.inviteCode,
          data: copy,
          updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.#db.delete(groups).where(eq(groups.id, id));
  }
}

export class PostgresProfileRepository implements ProfileRepository {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async listForAccount(accountId: string): Promise<Profile[]> {
    return this.listForAccounts([accountId]);
  }

  async listForAccounts(accountIds: readonly string[]): Promise<Profile[]> {
    if (accountIds.length === 0) return [];
    const rows = await this.#db
      .select()
      .from(profiles)
      .where(inArray(profiles.accountId, [...accountIds]))
      .orderBy(
        sql`(${profiles.data}->>'createdAt')::bigint`,
        profiles.scheduleId,
      );
    return rows.map((row) => structuredClone(row.data));
  }

  async save(profile: Profile): Promise<void> {
    const copy = structuredClone(profile);
    await this.#db
      .insert(profiles)
      .values({
        accountId: copy.accountId,
        scheduleId: scheduleId(copy),
        data: copy,
      })
      .onConflictDoUpdate({
        target: [profiles.accountId, profiles.scheduleId],
        set: { data: copy },
      });
  }

  async delete(accountId: string, id: string): Promise<void> {
    await this.#db
      .delete(profiles)
      .where(
        and(eq(profiles.accountId, accountId), eq(profiles.scheduleId, id)),
      );
  }
}

export class PostgresPersonRepository implements PersonRepository {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async findByAccount(accountId: string): Promise<Person | null> {
    const [row] = await this.#db
      .select()
      .from(people)
      .where(eq(people.accountId, accountId))
      .limit(1);
    return row ? structuredClone(row.data) : null;
  }

  async findByAccounts(accountIds: readonly string[]): Promise<Person[]> {
    if (accountIds.length === 0) return [];
    const rows = await this.#db
      .select()
      .from(people)
      .where(inArray(people.accountId, [...accountIds]));
    const byAccount = new Map(rows.map((row) => [row.accountId, row.data]));
    return accountIds.flatMap((id) => {
      const person = byAccount.get(id);
      return person ? [structuredClone(person)] : [];
    });
  }

  async save(person: Person): Promise<void> {
    const copy = structuredClone(person);
    await this.#db
      .insert(people)
      .values({ accountId: copy.accountId, data: copy })
      .onConflictDoUpdate({ target: people.accountId, set: { data: copy } });
  }
}

export class PostgresGroupPlanRepository implements GroupPlanRepository {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async findById(id: string): Promise<GroupPlan | null> {
    const [row] = await this.#db
      .select()
      .from(groupPlans)
      .where(eq(groupPlans.id, id))
      .limit(1);
    return row ? structuredClone(row.data) : null;
  }

  async listForGroup(groupId: string): Promise<GroupPlan[]> {
    const rows = await this.#db
      .select()
      .from(groupPlans)
      .where(eq(groupPlans.groupId, groupId));
    return rows
      .map((row) => structuredClone(row.data))
      .sort((a, b) =>
        a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1,
      );
  }

  async save(plan: GroupPlan): Promise<void> {
    const copy = structuredClone(plan);
    await this.#db
      .insert(groupPlans)
      .values({
        id: copy.id,
        groupId: copy.groupId,
        data: copy,
      })
      .onConflictDoUpdate({
        target: groupPlans.id,
        set: {
          groupId: copy.groupId,
          data: copy,
        },
      });
  }
}

export class PostgresCalendarSourceRepository
  implements CalendarSourceRepository
{
  readonly #db: Database;
  readonly #key: string;

  constructor(db: Database, keyBase64: string) {
    this.#db = db;
    this.#key = keyBase64;
  }

  async listForAccount(accountId: string): Promise<CalendarSource[]> {
    const rows = await this.#db
      .select()
      .from(calendarSources)
      .where(eq(calendarSources.accountId, accountId))
      .orderBy(asc(calendarSources.createdAt), asc(calendarSources.calendarId));
    return rows.map((row) => ({
      accountId: row.accountId,
      calendarId: row.calendarId,
      url: decryptUrl(row.urlCiphertext, this.#key),
      createdAt: row.createdAt,
    }));
  }

  async listAll(): Promise<CalendarSource[]> {
    const rows = await this.#db
      .select()
      .from(calendarSources)
      .orderBy(
        asc(calendarSources.createdAt),
        asc(calendarSources.accountId),
        asc(calendarSources.calendarId),
      );
    return rows.map((row) => ({
      accountId: row.accountId,
      calendarId: row.calendarId,
      url: decryptUrl(row.urlCiphertext, this.#key),
      createdAt: row.createdAt,
    }));
  }

  async save(source: CalendarSource): Promise<void> {
    const urlCiphertext = encryptUrl(source.url, this.#key);
    await this.#db
      .insert(calendarSources)
      .values({
        accountId: source.accountId,
        calendarId: source.calendarId,
        urlCiphertext,
        createdAt: source.createdAt,
      })
      .onConflictDoUpdate({
        target: [calendarSources.accountId, calendarSources.calendarId],
        set: {
          urlCiphertext,
          createdAt: source.createdAt,
        },
      });
  }

  async delete(accountId: string, calendarId: string): Promise<void> {
    await this.#db
      .delete(calendarSources)
      .where(
        and(
          eq(calendarSources.accountId, accountId),
          eq(calendarSources.calendarId, calendarId),
        ),
      );
  }
}

export class PostgresProductEventRepository implements ProductEventRepository {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async record(event: ProductEvent): Promise<void> {
    await this.#db.insert(productEvents).values({
      kind: event.kind,
      accountId: event.accountId,
      groupId: event.kind === "profile_created" ? null : event.groupId,
      planId: event.kind === "profile_created" ? null : event.planId,
      setupSeconds:
        event.kind === "profile_created" ? event.setupSeconds : null,
      at: new Date(event.at),
    });
  }
}
