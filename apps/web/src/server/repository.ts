import {
  InMemoryCalendarSourceRepository,
  InMemoryGroupPlanRepository,
  InMemoryGroupRepository,
  InMemoryProfileRepository,
} from "@amigo/adapter-memory";
import type {
  CalendarSourceRepository,
  GroupPlanRepository,
  GroupRepository,
  ProfileRepository,
} from "@amigo/core";
import { demoGroups } from "./demo-groups";

interface Stores {
  readonly groups: GroupRepository;
  readonly profiles: ProfileRepository;
  readonly groupPlans: GroupPlanRepository;
  readonly calendarSources: CalendarSourceRepository;
}

const globalForStores = globalThis as typeof globalThis & {
  __amigoStores?: Stores;
};

/**
 * The stores for this process. In memory until the Supabase adapters exist
 * (T10); kept on `globalThis` so dev hot reloads don't wipe them. Dev starts
 * with synthetic demo data; production starts empty.
 */
function stores(): Stores {
  if (!globalForStores.__amigoStores) {
    const dev = process.env.NODE_ENV !== "production";
    const now = Date.now();
    const demo = dev
      ? demoGroups(now)
      : { groups: [], profiles: [], plans: [] };
    globalForStores.__amigoStores = {
      groups: new InMemoryGroupRepository(demo.groups),
      profiles: new InMemoryProfileRepository(demo.profiles),
      groupPlans: new InMemoryGroupPlanRepository(demo.plans),
      calendarSources: new InMemoryCalendarSourceRepository(),
    };
  }
  return globalForStores.__amigoStores;
}

export const groups = () => stores().groups;
export const profiles = () => stores().profiles;
export const groupPlans = () => stores().groupPlans;
export const calendarSources = () => stores().calendarSources;
