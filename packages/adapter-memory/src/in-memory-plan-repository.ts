import { randomBytes } from "node:crypto";
import type { Plan, PlanRepository } from "@amigo/core";

/**
 * Keeps plans in process memory. Used to build and test screens before the
 * Supabase adapter exists; data is lost on restart.
 */
export class InMemoryPlanRepository implements PlanRepository {
  readonly #plans = new Map<string, Plan>();

  constructor(seed: readonly Plan[] = []) {
    for (const plan of seed) this.#plans.set(plan.id, structuredClone(plan));
  }

  async findById(id: string): Promise<Plan | null> {
    const plan = this.#plans.get(id);
    return plan ? structuredClone(plan) : null;
  }

  async listForAccount(accountId: string): Promise<Plan[]> {
    return [...this.#plans.values()]
      .filter((plan) =>
        plan.participants.some((p) => p.accountId === accountId),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((plan) => structuredClone(plan));
  }

  async save(plan: Plan): Promise<void> {
    this.#plans.set(plan.id, structuredClone(plan));
  }
}

/** A plan id is also the share-link secret (ADR 0003): 128 random bits. */
export function newPlanId(): string {
  return randomBytes(16).toString("base64url");
}
