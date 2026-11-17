import { describe, expect, it } from "vitest";
import { createGroup, joinGroup } from "../group/group";
import {
  chooseScheduleForGroup,
  createPerson,
  createSchedule,
  DEFAULT_SCHEDULE_ID,
  DEFAULT_SCHEDULE_NAME,
  defaultSchedule,
  duplicateSchedule,
  groupSchedules,
  PersonError,
  removeSchedule,
  renamePerson,
  renameSchedule,
  scheduleForGroup,
  scheduleId,
  scheduleName,
  setDefaultSchedule,
} from "./person";
import { createProfile, setDay } from "./profile";

const NOW = Date.UTC(2026, 10, 17, 12, 0);
const LATER = NOW + 60_000;

const person = createPerson({
  accountId: "acc_ana",
  displayName: " Ana ",
  now: NOW,
});
const normal = createSchedule({
  accountId: "acc_ana",
  id: DEFAULT_SCHEDULE_ID,
  name: "Semana normal",
  now: NOW,
});
const vacation = createSchedule({
  accountId: "acc_ana",
  id: "sch_vac",
  name: "Vacaciones",
  now: NOW,
});
const schedules = [normal, vacation];

describe("person", () => {
  it("keeps the account's trimmed name and starts on the default schedule", () => {
    expect(person).toEqual({
      accountId: "acc_ana",
      displayName: "Ana",
      defaultScheduleId: DEFAULT_SCHEDULE_ID,
      groupSchedules: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it("renames, and refuses an empty or too long name", () => {
    expect(
      renamePerson(person, { displayName: "Ana María", now: LATER }),
    ).toMatchObject({
      displayName: "Ana María",
      updatedAt: LATER,
    });
    for (const displayName of ["   ", "x".repeat(61)]) {
      expect(() => renamePerson(person, { displayName, now: LATER })).toThrow(
        expect.objectContaining({ code: "INVALID_NAME" }),
      );
    }
    expect(() =>
      createPerson({ accountId: "a", displayName: "", now: NOW }),
    ).toThrow(PersonError);
  });
});

describe("schedules", () => {
  it("is a full profile with an id and a name", () => {
    expect(vacation).toEqual({
      ...createProfile({ accountId: "acc_ana", now: NOW }),
      id: "sch_vac",
      name: "Vacaciones",
    });
  });

  it("reads profiles saved before schedules existed as the default one", () => {
    const legacy = createProfile({ accountId: "acc_ana", now: NOW });
    expect(scheduleId(legacy)).toBe(DEFAULT_SCHEDULE_ID);
    expect(scheduleName(legacy)).toBe(DEFAULT_SCHEDULE_NAME);
    expect(scheduleId(vacation)).toBe("sch_vac");
    expect(scheduleName(vacation)).toBe("Vacaciones");
  });

  it("renames and refuses an empty or too long schedule name", () => {
    expect(
      renameSchedule(vacation, { name: " Verano ", now: LATER }),
    ).toMatchObject({
      name: "Verano",
      updatedAt: LATER,
    });
    expect(() => renameSchedule(vacation, { name: " ", now: LATER })).toThrow(
      expect.objectContaining({ code: "INVALID_NAME" }),
    );
    expect(() =>
      createSchedule({
        accountId: "a",
        id: "s",
        name: "x".repeat(41),
        now: NOW,
      }),
    ).toThrow(expect.objectContaining({ code: "INVALID_NAME" }));
  });

  it("duplicates every busy rule under a new id and name", () => {
    const busy = setDay(normal, {
      date: "2026-11-20",
      busy: [{ start: 600, end: 720 }],
      exceptions: [],
      now: NOW,
    });
    const copy = duplicateSchedule(busy, {
      id: "sch_copy",
      name: "Copia",
      now: LATER,
    });
    expect(copy).toEqual({
      ...busy,
      id: "sch_copy",
      name: "Copia",
      createdAt: LATER,
      updatedAt: LATER,
    });
  });
});

describe("which schedule a group reads", () => {
  it("reads the default schedule when the group has no choice", () => {
    expect(scheduleForGroup(person, schedules, "grp_1")).toBe(normal);
  });

  it("reads the schedule chosen for that group only", () => {
    const chose = chooseScheduleForGroup(person, {
      groupId: "grp_1",
      scheduleId: "sch_vac",
      schedules,
      now: LATER,
    });
    expect(chose.groupSchedules).toEqual({ grp_1: "sch_vac" });
    expect(chose.updatedAt).toBe(LATER);
    expect(scheduleForGroup(chose, schedules, "grp_1")).toBe(vacation);
    expect(scheduleForGroup(chose, schedules, "grp_2")).toBe(normal);
  });

  it("refuses a schedule the person does not have", () => {
    expect(() =>
      chooseScheduleForGroup(person, {
        groupId: "grp_1",
        scheduleId: "nope",
        schedules,
        now: LATER,
      }),
    ).toThrow(expect.objectContaining({ code: "UNKNOWN_SCHEDULE" }));
    expect(() =>
      setDefaultSchedule(person, { scheduleId: "nope", schedules, now: LATER }),
    ).toThrow(expect.objectContaining({ code: "UNKNOWN_SCHEDULE" }));
  });

  it("follows a new default in every group without a choice", () => {
    const moved = setDefaultSchedule(person, {
      scheduleId: "sch_vac",
      schedules,
      now: LATER,
    });
    expect(moved.defaultScheduleId).toBe("sch_vac");
    expect(scheduleForGroup(moved, schedules, "grp_9")).toBe(vacation);
  });

  it("reads a legacy profile when the person has no record yet", () => {
    const legacy = createProfile({ accountId: "acc_ana", now: NOW });
    expect(scheduleForGroup(null, [legacy], "grp_1")).toBe(legacy);
  });

  it("is unknown (null) when the person has no schedules", () => {
    expect(scheduleForGroup(person, [], "grp_1")).toBeNull();
    expect(scheduleForGroup(null, [], "grp_1")).toBeNull();
  });

  it("falls back to the default when the chosen schedule is gone", () => {
    const chose = chooseScheduleForGroup(person, {
      groupId: "grp_1",
      scheduleId: "sch_vac",
      schedules,
      now: LATER,
    });
    expect(scheduleForGroup(chose, [normal], "grp_1")).toBe(normal);
  });
});

describe("removing a schedule", () => {
  it("refuses to remove the default schedule", () => {
    expect(() =>
      removeSchedule(person, schedules, {
        scheduleId: DEFAULT_SCHEDULE_ID,
        now: LATER,
      }),
    ).toThrow(expect.objectContaining({ code: "DEFAULT_SCHEDULE" }));
  });

  it("moves the groups that used it back to the default", () => {
    const chose = chooseScheduleForGroup(person, {
      groupId: "grp_1",
      scheduleId: "sch_vac",
      schedules,
      now: NOW,
    });
    const result = removeSchedule(chose, schedules, {
      scheduleId: "sch_vac",
      now: LATER,
    });
    expect(result.schedules).toEqual([normal]);
    expect(result.person.groupSchedules).toEqual({});
    expect(result.person.updatedAt).toBe(LATER);
  });

  it("refuses a schedule the person does not have", () => {
    expect(() =>
      removeSchedule(person, schedules, { scheduleId: "nope", now: LATER }),
    ).toThrow(expect.objectContaining({ code: "UNKNOWN_SCHEDULE" }));
  });
});

describe("groupSchedules", () => {
  it("gives the outlook one schedule per member, the one each chose for the group", () => {
    let group = createGroup({
      id: "grp_1",
      inviteCode: "inv",
      name: "Amigos",
      ownerId: "acc_ana",
      ownerName: "Ana",
      timezone: "America/Santiago",
      now: NOW,
    });
    group = joinGroup(group, {
      accountId: "acc_beto",
      displayName: "Beto",
      now: NOW,
    });
    group = joinGroup(group, {
      accountId: "acc_caro",
      displayName: "Caro",
      now: NOW,
    });
    const ana = chooseScheduleForGroup(person, {
      groupId: "grp_1",
      scheduleId: "sch_vac",
      schedules,
      now: NOW,
    });
    const betoLegacy = createProfile({ accountId: "acc_beto", now: NOW });

    const result = groupSchedules(group, [ana], [...schedules, betoLegacy]);

    // Caro has no schedule: left out, so the outlook reads her as unknown.
    expect(result).toEqual([vacation, betoLegacy]);
  });
});

describe("defaultSchedule", () => {
  it("is the person's default, or the default-id schedule without a person", () => {
    const moved = setDefaultSchedule(person, {
      scheduleId: "sch_vac",
      schedules,
      now: LATER,
    });
    expect(defaultSchedule(person, schedules)).toBe(normal);
    expect(defaultSchedule(moved, schedules)).toBe(vacation);
    expect(defaultSchedule(null, schedules)).toBe(normal);
    expect(defaultSchedule(null, [])).toBeNull();
  });
});
