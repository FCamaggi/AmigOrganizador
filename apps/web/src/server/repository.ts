import {
  InMemoryCalendarSourceRepository,
  InMemoryGroupPlanRepository,
  InMemoryGroupRepository,
  InMemoryPlanRepository,
  InMemoryProfileRepository,
} from "@amigo/adapter-memory";
import type {
  CalendarSourceRepository,
  GroupPlanRepository,
  GroupRepository,
  PlanRepository,
  ProfileRepository,
} from "@amigo/core";
import { demoGroups } from "./demo-groups";
import { demoPlans } from "./demo-plans";

interface Stores {
  readonly plans: PlanRepository;
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
      plans: new InMemoryPlanRepository(dev ? demoPlans(now) : []),
      groups: new InMemoryGroupRepository(demo.groups),
      profiles: new InMemoryProfileRepository(demo.profiles),
      groupPlans: new InMemoryGroupPlanRepository(demo.plans),
      calendarSources: new InMemoryCalendarSourceRepository(),
    };
  }
  return globalForStores.__amigoStores;
}

/** Plan-first store; removed in T9 once group screens replace it. */
export const plans = () => stores().plans;
export const groups = () => stores().groups;
export const profiles = () => stores().profiles;
export const groupPlans = () => stores().groupPlans;
export const calendarSources = () => stores().calendarSources;
