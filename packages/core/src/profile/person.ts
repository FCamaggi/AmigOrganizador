import type { Group } from "../group/group";
import { createProfile, type Profile } from "./profile";
import type { ThreadColor } from "./thread-color";

/** The id of the schedule every account starts with, and of legacy profiles. */
export const DEFAULT_SCHEDULE_ID = "default";
/** The name shown for a schedule saved before schedules had names. */
export const DEFAULT_SCHEDULE_NAME = "Mi horario";

const MAX_DISPLAY_NAME_LENGTH = 60;
const MAX_SCHEDULE_NAME_LENGTH = 40;

/**
 * The account behind a profile (S4, S5): the person's name and which of their
 * schedules each group reads. A group without a choice reads the default.
 */
export interface Person {
  readonly accountId: string;
  readonly displayName: string;
  readonly defaultScheduleId: string;
  /** Group id -> schedule id, only for groups with an explicit choice. */
  readonly groupSchedules: Readonly<Record<string, string>>;
  /** The thread colour picked in the profile (S9); none means automatic. */
  readonly threadColor?: ThreadColor;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type PersonErrorCode =
  | "INVALID_NAME"
  | "UNKNOWN_SCHEDULE"
  | "DEFAULT_SCHEDULE"
  | "INVALID_COLOR";

/** A rule of the person or their schedules was broken; the UI maps `code`. */
export class PersonError extends Error {
  readonly code: PersonErrorCode;

  constructor(code: PersonErrorCode, message: string) {
    super(message);
    this.name = "PersonError";
    this.code = code;
  }
}

function cleanName(value: string, max: number): string {
  const name = value.trim();
  if (name.length === 0 || name.length > max) {
    throw new PersonError("INVALID_NAME", `must be 1 to ${max} characters`);
  }
  return name;
}

function checkOwned(schedules: readonly Profile[], id: string): void {
  if (!schedules.some((schedule) => scheduleId(schedule) === id)) {
    throw new PersonError("UNKNOWN_SCHEDULE", "no schedule with that id");
  }
}

export function createPerson(input: {
  accountId: string;
  displayName: string;
  now: number;
}): Person {
  return {
    accountId: input.accountId,
    displayName: cleanName(input.displayName, MAX_DISPLAY_NAME_LENGTH),
    defaultScheduleId: DEFAULT_SCHEDULE_ID,
    groupSchedules: {},
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function renamePerson(
  person: Person,
  input: { displayName: string; now: number },
): Person {
  return {
    ...person,
    displayName: cleanName(input.displayName, MAX_DISPLAY_NAME_LENGTH),
    updatedAt: input.now,
  };
}

/** A new, empty schedule: a complete profile with its own id and name. */
export function createSchedule(input: {
  accountId: string;
  id: string;
  name: string;
  now: number;
}): Profile {
  return {
    ...createProfile({ accountId: input.accountId, now: input.now }),
    id: input.id,
    name: cleanName(input.name, MAX_SCHEDULE_NAME_LENGTH),
  };
}

export function renameSchedule(
  schedule: Profile,
  input: { name: string; now: number },
): Profile {
  return {
    ...schedule,
    name: cleanName(input.name, MAX_SCHEDULE_NAME_LENGTH),
    updatedAt: input.now,
  };
}

/** A copy of every busy rule (templates, days, calendars, zone). */
export function duplicateSchedule(
  source: Profile,
  input: { id: string; name: string; now: number },
): Profile {
  return {
    ...source,
    id: input.id,
    name: cleanName(input.name, MAX_SCHEDULE_NAME_LENGTH),
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function scheduleId(schedule: Profile): string {
  return schedule.id ?? DEFAULT_SCHEDULE_ID;
}

export function scheduleName(schedule: Profile): string {
  return schedule.name ?? DEFAULT_SCHEDULE_NAME;
}

export function chooseScheduleForGroup(
  person: Person,
  input: {
    groupId: string;
    scheduleId: string;
    schedules: readonly Profile[];
    now: number;
  },
): Person {
  checkOwned(input.schedules, input.scheduleId);
  return {
    ...person,
    groupSchedules: {
      ...person.groupSchedules,
      [input.groupId]: input.scheduleId,
    },
    updatedAt: input.now,
  };
}

export function setDefaultSchedule(
  person: Person,
  input: { scheduleId: string; schedules: readonly Profile[]; now: number },
): Person {
  checkOwned(input.schedules, input.scheduleId);
  return {
    ...person,
    defaultScheduleId: input.scheduleId,
    updatedAt: input.now,
  };
}

/**
 * Removes a schedule. The default cannot go; groups that read the removed
 * one go back to the default.
 */
export function removeSchedule(
  person: Person,
  schedules: readonly Profile[],
  input: { scheduleId: string; now: number },
): { person: Person; schedules: Profile[] } {
  if (input.scheduleId === person.defaultScheduleId) {
    throw new PersonError("DEFAULT_SCHEDULE", "the default cannot be removed");
  }
  checkOwned(schedules, input.scheduleId);
  const groupSchedules = Object.fromEntries(
    Object.entries(person.groupSchedules).filter(
      ([, id]) => id !== input.scheduleId,
    ),
  );
  return {
    person: { ...person, groupSchedules, updatedAt: input.now },
    schedules: schedules.filter((s) => scheduleId(s) !== input.scheduleId),
  };
}

/**
 * The schedule a group reads for this person: the one chosen for the group,
 * else the default, else (no person record yet) the default-id schedule.
 * `null` means no schedule, which the group reads as unknown, never free.
 */
export function scheduleForGroup(
  person: Person | null,
  schedules: readonly Profile[],
  groupId: string,
): Profile | null {
  const byId = (id: string | undefined) =>
    id === undefined
      ? undefined
      : schedules.find((schedule) => scheduleId(schedule) === id);
  return (
    byId(person?.groupSchedules[groupId]) ??
    byId(person?.defaultScheduleId ?? DEFAULT_SCHEDULE_ID) ??
    null
  );
}

/** The schedule the person edits first and groups read by default. */
export function defaultSchedule(
  person: Person | null,
  schedules: readonly Profile[],
): Profile | null {
  const id = person?.defaultScheduleId ?? DEFAULT_SCHEDULE_ID;
  return schedules.find((schedule) => scheduleId(schedule) === id) ?? null;
}

/**
 * One schedule per member for the group outlook, from every member's people
 * records and schedules. Members without a schedule are left out (unknown).
 */
export function groupSchedules(
  group: Group,
  people: readonly Person[],
  schedules: readonly Profile[],
): Profile[] {
  return group.members.flatMap((member) => {
    const person = people.find((p) => p.accountId === member.accountId);
    const own = schedules.filter((s) => s.accountId === member.accountId);
    const schedule = scheduleForGroup(person ?? null, own, group.id);
    return schedule ? [schedule] : [];
  });
}
