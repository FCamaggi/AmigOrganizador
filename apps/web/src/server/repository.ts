import { InMemoryPlanRepository } from "@amigo/adapter-memory";
import type { PlanRepository } from "@amigo/core";
import { demoPlans } from "./demo-plans";

const globalForRepo = globalThis as typeof globalThis & {
  __amigoPlans?: PlanRepository;
};

/**
 * The plan store for this process. In-memory until the Supabase adapter
 * exists (T3); kept on `globalThis` so dev hot reloads don't wipe it. Dev
 * starts with synthetic demo plans.
 */
export function plans(): PlanRepository {
  globalForRepo.__amigoPlans ??= new InMemoryPlanRepository(
    process.env.NODE_ENV === "production" ? [] : demoPlans(Date.now()),
  );
  return globalForRepo.__amigoPlans;
}
