import { describe, expect, it } from "vitest";
import {
  type BusyTemplate,
  shiftCycle,
  workweek,
} from "../availability/busy-templates";
import { parseLocalDate } from "../availability/local-date";
import {
  availabilityFor,
  createProfile,
  type Profile,
  ProfileError,
  removeImportedCalendar,
  setDay,
  setImportedCalendar,
  setTemplates,
} from "./profile";

const h = (hours: number) => hours * 60;
const NOW = Date.UTC(2026, 10, 15, 12, 0);
// 2026-11-20 is a Friday, 2026-11-21 a Saturday.
const FRI = parseLocalDate("2026-11-20");
const SAT = parseLocalDate("2026-11-21");
const WHOLE_DAY = [{ start: 0, end: h(24) }];

function expectProfileError(action: () => unknown, code: ProfileError["code"]) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ProfileError);
    expect((error as ProfileError).code).toBe(code);
    return;
  }
  throw new Error(`expected ProfileError ${code}`);
}

const empty = () => createProfile({ accountId: "acc_ana", now: NOW });

describe("createProfile", () => {
  it("starts with nothing busy", () => {
    expect(empty()).toEqual({
      accountId: "acc_ana",
      templates: [],
      busyDays: {},
      exceptions: {},
      importedCalendars: [],
      createdAt: NOW,
      updatedAt: NOW,
    });
  });
});

describe("availabilityFor", () => {
  it("covers every date in the range, so time not marked busy is free", () => {
    expect(availabilityFor(empty(), FRI, SAT)).toEqual({
      [FRI]: { coverage: WHOLE_DAY, busy: [] },
      [SAT]: { coverage: WHOLE_DAY, busy: [] },
    });
  });

  it("applies templates", () => {
    const profile = setTemplates(empty(), {
      templates: [workweek()],
      now: NOW,
    });
    expect(availabilityFor(profile, FRI, SAT)).toEqual({
      [FRI]: { coverage: WHOLE_DAY, busy: [{ start: h(9), end: h(18) }] },
      [SAT]: { coverage: WHOLE_DAY, busy: [] },
    });
  });

  it("adds one-off busy time on top of templates", () => {
    let profile = setTemplates(empty(), { templates: [workweek()], now: NOW });
    profile = setDay(profile, {
      date: FRI,
      busy: [{ start: h(17), end: h(21) }],
      exceptions: [],
      now: NOW,
    });
    expect(availabilityFor(profile, FRI, FRI)[FRI]?.busy).toEqual([
      { start: h(9), end: h(21) },
    ]);
  });

  it("lets an exception free template time, but never one-off or imported busy time", () => {
    let profile = setTemplates(empty(), { templates: [workweek()], now: NOW });
    profile = setDay(profile, {
      date: FRI,
      busy: [{ start: h(10), end: h(11) }],
      exceptions: [{ start: 0, end: h(24) }],
      now: NOW,
    });
    profile = setImportedCalendar(profile, {
      calendar: {
        id: "work",
        name: "Trabajo",
        busy: { [FRI]: [{ start: h(15), end: h(16) }] },
        syncedAt: NOW,
      },
      now: NOW,
    });
    expect(availabilityFor(profile, FRI, FRI)[FRI]?.busy).toEqual([
      { start: h(10), end: h(11) },
      { start: h(15), end: h(16) },
    ]);
  });

  it("keeps busy time from the day before that runs past midnight into the range", () => {
    let profile = setTemplates(empty(), {
      templates: [shiftCycle({ anchor: FRI, pattern: ["night"] })],
      now: NOW,
    });
    profile = setDay(profile, {
      date: parseLocalDate("2026-11-19"),
      busy: [{ start: h(23), end: h(26) }],
      exceptions: [],
      now: NOW,
    });
    expect(availabilityFor(profile, FRI, FRI)["2026-11-19"]).toEqual({
      coverage: [],
      busy: [{ start: h(20), end: h(32) }],
    });
  });
});

describe("setTemplates", () => {
  it("replaces the templates and stamps the update", () => {
    const profile = setTemplates(empty(), {
      templates: [workweek()],
      now: NOW + 1,
    });
    expect(profile.templates).toHaveLength(1);
    expect(profile.updatedAt).toBe(NOW + 1);
  });

  it("rejects a malformed template", () => {
    const bad: BusyTemplate = {
      kind: "classes",
      blocks: [{ weekday: 9, start: 0, end: 60 }],
    };
    expectProfileError(
      () => setTemplates(empty(), { templates: [bad], now: NOW }),
      "INVALID_TEMPLATE",
    );
  });
});

describe("setDay", () => {
  it("removes the date when it has nothing left", () => {
    let profile = setDay(empty(), {
      date: FRI,
      busy: [{ start: h(9), end: h(10) }],
      exceptions: [],
      now: NOW,
    });
    profile = setDay(profile, {
      date: FRI,
      busy: [],
      exceptions: [],
      now: NOW,
    });
    expect(profile.busyDays).toEqual({});
    expect(profile.exceptions).toEqual({});
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expectProfileError(
      () =>
        setDay(empty(), {
          date: "2026-13-01",
          busy: [],
          exceptions: [],
          now: NOW,
        }),
      "INVALID_DATE",
    );
  });

  it.each([
    ["start after end", { start: h(10), end: h(9) }],
    ["an empty interval", { start: h(10), end: h(10) }],
    ["an end past 2880", { start: h(20), end: h(49) }],
  ])("rejects %s", (_label, interval) => {
    expectProfileError(
      () =>
        setDay(empty(), {
          date: FRI,
          busy: [interval],
          exceptions: [],
          now: NOW,
        }),
      "INVALID_TIME",
    );
  });
});

describe("imported calendars", () => {
  const calendar = (busyStart: number) => ({
    id: "work",
    name: "Trabajo",
    busy: { [SAT]: [{ start: h(busyStart), end: h(busyStart + 1) }] },
    syncedAt: NOW,
  });

  it("replaces a calendar with the same id on a new sync", () => {
    let profile = setImportedCalendar(empty(), {
      calendar: calendar(9),
      now: NOW,
    });
    profile = setImportedCalendar(profile, {
      calendar: calendar(14),
      now: NOW,
    });
    expect(profile.importedCalendars).toHaveLength(1);
    expect(availabilityFor(profile, SAT, SAT)[SAT]?.busy).toEqual([
      { start: h(14), end: h(15) },
    ]);
  });

  it("can be removed", () => {
    let profile: Profile = setImportedCalendar(empty(), {
      calendar: calendar(9),
      now: NOW,
    });
    profile = removeImportedCalendar(profile, { id: "work", now: NOW });
    expect(profile.importedCalendars).toEqual([]);
  });

  it("rejects invalid busy times", () => {
    expectProfileError(
      () =>
        setImportedCalendar(empty(), {
          calendar: {
            ...calendar(9),
            busy: { [SAT]: [{ start: -5, end: 10 }] },
          },
          now: NOW,
        }),
      "INVALID_TIME",
    );
  });
});
