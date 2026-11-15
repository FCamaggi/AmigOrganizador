import type { GroupPlan } from "../group/group-plan";

/**
 * What we record to run the Phase 1 exit test ("3 groups confirm a plan;
 * median profile setup under 2 minutes"). Ids and times only: never names,
 * titles or calendar content.
 */
export type ProductEvent = ProfileCreatedEvent | PlanEvent;

export interface ProfileCreatedEvent {
  readonly kind: "profile_created";
  readonly accountId: string;
  readonly at: number;
  /** From the first edit in the profile editor to the save; null when unknown. */
  readonly setupSeconds: number | null;
}

export interface PlanEvent {
  readonly kind: "plan_proposed" | "plan_confirmed";
  readonly accountId: string;
  readonly groupId: string;
  readonly planId: string;
  readonly at: number;
}

export type ProductEventKind = ProductEvent["kind"];

/** Longer than this is not a setup session (the tab was left open). */
export const MAX_SETUP_SECONDS = 24 * 60 * 60;

/** A profile was saved for the first time. `setupSeconds` comes from the client: anything odd becomes null. */
export function profileCreatedEvent(input: {
  accountId: string;
  at: number;
  setupSeconds?: unknown;
}): ProfileCreatedEvent {
  const raw = input.setupSeconds;
  const valid =
    typeof raw === "number" &&
    Number.isFinite(raw) &&
    raw >= 0 &&
    raw <= MAX_SETUP_SECONDS;
  return {
    kind: "profile_created",
    accountId: input.accountId,
    at: input.at,
    setupSeconds: valid ? Math.round(raw) : null,
  };
}

/** A plan was proposed or confirmed by `accountId`. */
export function planEvent(
  kind: "plan_proposed" | "plan_confirmed",
  plan: GroupPlan,
  input: { accountId: string; at: number },
): PlanEvent {
  return {
    kind,
    accountId: input.accountId,
    groupId: plan.groupId,
    planId: plan.id,
    at: input.at,
  };
}
