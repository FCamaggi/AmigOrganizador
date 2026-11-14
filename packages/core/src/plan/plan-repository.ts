import type { Plan } from "./plan";

/**
 * Port for storing plans. Adapters (e.g. Postgres on Supabase) implement it;
 * the domain never imports an adapter.
 */
export interface PlanRepository {
  findById(id: string): Promise<Plan | null>;
  /** Plans the account organizes or takes part in, newest first. */
  listForAccount(accountId: string): Promise<Plan[]>;
  /** Inserts or replaces the plan with the same id. */
  save(plan: Plan): Promise<void>;
}
