import type { GroupPlan } from "./group-plan";

/** Port for storing plans that come out of groups. */
export interface GroupPlanRepository {
  findById(id: string): Promise<GroupPlan | null>;
  /** A group's plans, soonest date first. */
  listForGroup(groupId: string): Promise<GroupPlan[]>;
  /** Inserts or replaces the plan with the same id. */
  save(plan: GroupPlan): Promise<void>;
}
