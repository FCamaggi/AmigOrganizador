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
  /** Keyed by `accountId/scheduleId`; insertion order is creation order. */
  readonly #profiles = new Map<string, Profile>();

  constructor(seed: readonly Profile[] = []) {
    for (const profile of seed) this.#set(profile);
  }

  #set(profile: Profile): void {
    this.#profiles.set(
      `${profile.accountId}/${scheduleId(profile)}`,
      structuredClone(profile),
    );
  }

  async listForAccount(accountId: string): Promise<Profile[]> {
    return this.listForAccounts([accountId]);
  }

  async listForAccounts(accountIds: readonly string[]): Promise<Profile[]> {
    return [...this.#profiles.values()]
      .filter((profile) => accountIds.includes(profile.accountId))
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt ||
          scheduleId(a).localeCompare(scheduleId(b)),
      )
      .map((profile) => structuredClone(profile));
  }

  async save(profile: Profile): Promise<void> {
    this.#set(profile);
  }

  async delete(accountId: string, id: string): Promise<void> {
    this.#profiles.delete(`${accountId}/${id}`);
  }
}

export class InMemoryPersonRepository implements PersonRepository {
  readonly #people = new Map<string, Person>();

  constructor(seed: readonly Person[] = []) {
    for (const person of seed) {
      this.#people.set(person.accountId, structuredClone(person));
    }
  }

  async findByAccount(accountId: string): Promise<Person | null> {
    const person = this.#people.get(accountId);
    return person ? structuredClone(person) : null;
  }

  async findByAccounts(accountIds: readonly string[]): Promise<Person[]> {
    return accountIds.flatMap((id) => {
      const person = this.#people.get(id);
      return person ? [structuredClone(person)] : [];
    });
  }

  async save(person: Person): Promise<void> {
    this.#people.set(person.accountId, structuredClone(person));
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

  async listAll(): Promise<CalendarSource[]> {
    return [...this.#sources.values()]
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt ||
          a.accountId.localeCompare(b.accountId) ||
          a.calendarId.localeCompare(b.calendarId),
      )
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

/** Product events in memory (dev and e2e); `list` is for inspection. */
export class InMemoryProductEventRepository implements ProductEventRepository {
  readonly #events: ProductEvent[] = [];

  async record(event: ProductEvent): Promise<void> {
    this.#events.push(structuredClone(event));
  }

  list(): ProductEvent[] {
    return this.#events.map((event) => structuredClone(event));
  }
}
