import {
  InMemoryCalendarSourceRepository,
  InMemoryGroupPlanRepository,
  InMemoryGroupRepository,
  InMemoryPersonRepository,
  InMemoryProductEventRepository,
  InMemoryProfileRepository,
} from "@amigo/adapter-memory";
import {
  type CalendarSourceRepository,
  defaultSchedule,
  type Group,
  type GroupPlanRepository,
  type GroupRepository,
  type GroupThread,
  groupSchedules,
  groupThreads,
  type PersonRepository,
  type ProductEventRepository,
  type Profile,
  type ProfileRepository,
} from "@amigo/core";
import {
  createDb,
  PostgresCalendarSourceRepository,
  PostgresGroupPlanRepository,
  PostgresGroupRepository,
  PostgresPersonRepository,
  PostgresProductEventRepository,
  PostgresProfileRepository,
} from "@amigo/db";
import { demoGroups } from "./demo-groups";

interface Stores {
  readonly groups: GroupRepository;
  readonly profiles: ProfileRepository;
  readonly people: PersonRepository;
  readonly groupPlans: GroupPlanRepository;
  readonly calendarSources: CalendarSourceRepository;
  readonly productEvents: ProductEventRepository;
}

const globalForStores = globalThis as typeof globalThis & {
  __amigoStores?: Stores;
};

/**
 * Postgres (Supabase) when `DATABASE_URL` is set; the ICS links are
 * encrypted with `CALENDAR_URL_KEY` (32 bytes, base64).
 */
function postgresStores(url: string): Stores {
  const key = process.env.CALENDAR_URL_KEY;
  if (!key) throw new Error("CALENDAR_URL_KEY is required with DATABASE_URL");
  const db = createDb(url);
  return {
    groups: new PostgresGroupRepository(db),
    profiles: new PostgresProfileRepository(db),
    people: new PostgresPersonRepository(db),
    groupPlans: new PostgresGroupPlanRepository(db),
    calendarSources: new PostgresCalendarSourceRepository(db, key),
    productEvents: new PostgresProductEventRepository(db),
  };
}

/**
 * In memory for development and e2e, kept on `globalThis` so dev hot
 * reloads don't wipe it. Dev starts with synthetic demo data. A production
 * build refuses to run in memory (data would vanish on every cold start)
 * unless `AMIGO_LOCAL_MODE=true` says it's a throwaway run, like e2e.
 */
function memoryStores(): Stores {
  const dev = process.env.NODE_ENV !== "production";
  if (!dev && process.env.AMIGO_LOCAL_MODE !== "true")
    throw new Error("DATABASE_URL is required in production");
  const demo = dev
    ? demoGroups(Date.now())
    : { groups: [], profiles: [], plans: [] };
  return {
    groups: new InMemoryGroupRepository(demo.groups),
    profiles: new InMemoryProfileRepository(demo.profiles),
    people: new InMemoryPersonRepository(),
    groupPlans: new InMemoryGroupPlanRepository(demo.plans),
    calendarSources: new InMemoryCalendarSourceRepository(),
    productEvents: new InMemoryProductEventRepository(),
  };
}

function stores(): Stores {
  if (!globalForStores.__amigoStores) {
    const url = process.env.DATABASE_URL;
    globalForStores.__amigoStores = url ? postgresStores(url) : memoryStores();
  }
  return globalForStores.__amigoStores;
}

export const groups = () => stores().groups;
export const profiles = () => stores().profiles;
export const people = () => stores().people;
export const groupPlans = () => stores().groupPlans;
export const calendarSources = () => stores().calendarSources;
export const productEvents = () => stores().productEvents;

/** The schedule the person edits on /perfil: their default one, if any. */
export async function myDefaultSchedule(
  accountId: string,
): Promise<Profile | null> {
  const [person, schedules] = await Promise.all([
    people().findByAccount(accountId),
    profiles().listForAccount(accountId),
  ]);
  return defaultSchedule(person, schedules);
}

/** One schedule per member, the one each reads for this group (unknown = left out). */
export async function memberSchedules(group: Group): Promise<Profile[]> {
  return (await groupMemberData(group)).schedules;
}

/** Each member's schedule for this group and their thread colour in it. */
export async function groupMemberData(
  group: Group,
): Promise<{ schedules: Profile[]; threads: GroupThread[] }> {
  const ids = group.members.map((m) => m.accountId);
  const [members, schedules] = await Promise.all([
    people().findByAccounts(ids),
    profiles().listForAccounts(ids),
  ]);
  return {
    schedules: groupSchedules(group, members, schedules),
    threads: groupThreads(group, members),
  };
}
