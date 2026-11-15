import { randomBytes } from "node:crypto";
import type {
  CalendarSource,
  CalendarSourceRepository,
  Group,
  GroupPlan,
  GroupPlanRepository,
  GroupRepository,
  Profile,
  ProfileRepository,
} from "@amigo/core";

/**
 * In-memory adapters for groups, profiles, group plans and calendar sources,
 * so screens can be built before Supabase (T10). Data is lost on restart.
 * Every read and write clones, so callers can't mutate stored state.
 */

export class InMemoryGroupRepository implements GroupRepository {
  readonly #groups = new Map<string, Group>();

  constructor(seed: readonly Group[] = []) {
    for (const group of seed)
      this.#groups.set(group.id, structuredClone(group));
  }

  async findById(id: string): Promise<Group | null> {
    const group = this.#groups.get(id);
    return group ? structuredClone(group) : null;
  }

  async findByInviteCode(inviteCode: string): Promise<Group | null> {
    for (const group of this.#groups.values()) {
      if (group.inviteCode === inviteCode) return structuredClone(group);
    }
    return null;
  }

  async listForAccount(accountId: string): Promise<Group[]> {
    const joinedAt = (group: Group) =>
      group.members.find((m) => m.accountId === accountId)?.joinedAt ?? 0;
    return [...this.#groups.values()]
      .filter((group) => group.members.some((m) => m.accountId === accountId))
      .sort((a, b) => joinedAt(b) - joinedAt(a))
      .map((group) => structuredClone(group));
  }

  async save(group: Group): Promise<void> {
    this.#groups.set(group.id, structuredClone(group));
  }

  async delete(id: string): Promise<void> {
    this.#groups.delete(id);
  }
}

export class InMemoryProfileRepository implements ProfileRepository {
  readonly #profiles = new Map<string, Profile>();

  constructor(seed: readonly Profile[] = []) {
    for (const profile of seed) {
      this.#profiles.set(profile.accountId, structuredClone(profile));
    }
  }

  async findByAccount(accountId: string): Promise<Profile | null> {
    const profile = this.#profiles.get(accountId);
    return profile ? structuredClone(profile) : null;
  }

  async findByAccounts(accountIds: readonly string[]): Promise<Profile[]> {
    return accountIds.flatMap((id) => {
      const profile = this.#profiles.get(id);
      return profile ? [structuredClone(profile)] : [];
    });
  }

  async save(profile: Profile): Promise<void> {
    this.#profiles.set(profile.accountId, structuredClone(profile));
  }
}

export class InMemoryGroupPlanRepository implements GroupPlanRepository {
  readonly #plans = new Map<string, GroupPlan>();

  constructor(seed: readonly GroupPlan[] = []) {
    for (const plan of seed) this.#plans.set(plan.id, structuredClone(plan));
  }

  async findById(id: string): Promise<GroupPlan | null> {
    const plan = this.#plans.get(id);
    return plan ? structuredClone(plan) : null;
  }

  async listForGroup(groupId: string): Promise<GroupPlan[]> {
    return [...this.#plans.values()]
      .filter((plan) => plan.groupId === groupId)
      .sort((a, b) =>
        a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1,
      )
      .map((plan) => structuredClone(plan));
  }

  async save(plan: GroupPlan): Promise<void> {
    this.#plans.set(plan.id, structuredClone(plan));
  }
}

export class InMemoryCalendarSourceRepository
  implements CalendarSourceRepository
{
  readonly #sources = new Map<string, CalendarSource>();

  static #key(accountId: string, calendarId: string) {
    return `${accountId}\u0000${calendarId}`;
  }

  async listForAccount(accountId: string): Promise<CalendarSource[]> {
    return [...this.#sources.values()]
      .filter((source) => source.accountId === accountId)
      .map((source) => structuredClone(source));
  }

  async save(source: CalendarSource): Promise<void> {
    this.#sources.set(
      InMemoryCalendarSourceRepository.#key(
        source.accountId,
        source.calendarId,
      ),
      structuredClone(source),
    );
  }

  async delete(accountId: string, calendarId: string): Promise<void> {
    this.#sources.delete(
      InMemoryCalendarSourceRepository.#key(accountId, calendarId),
    );
  }
}

/** A group invite code is the secret in the link (ADR 0003): 128 random bits. */
export function newInviteCode(): string {
  return randomBytes(16).toString("base64url");
}
