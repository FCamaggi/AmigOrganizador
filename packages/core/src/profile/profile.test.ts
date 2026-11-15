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
  DEFAULT_PROFILE_TIMEZONE,
  type Profile,
  ProfileError,
  profileTimezone,
  removeImportedCalendar,
  setDay,
  setImportedCalendar,
  setTemplates,
  setTimezone,
} from "./profile";

const h = (hours: number) => hours * 60;
const NOW = Date.UTC(2026, 10, 15, 12, 0);
// 2026-11-20 is a Friday, 2026-11-21 a Saturday.
const FRI = parseLocalDate("2026-11-20");
const SAT = parseLocalDate("2026-11-21");
const WHOLE_DAY = [{ start: 0, end: h(24) }];
// Santiago is UTC-3 in November.
const TZ = "America/Santiago";

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
    expect(availabilityFor(empty(), FRI, SAT, TZ)).toEqual({
      [FRI]: { coverage: WHOLE_DAY, busy: [] },
      [SAT]: { coverage: WHOLE_DAY, busy: [] },
    });
  });

  it("applies templates", () => {
    const profile = setTemplates(empty(), {
      templates: [workweek()],
      now: NOW,
    });
    expect(availabilityFor(profile, FRI, SAT, TZ)).toEqual({
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
    expect(availabilityFor(profile, FRI, FRI, TZ)[FRI]?.busy).toEqual([
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
        busy: [
          {
            start: Date.UTC(2026, 10, 20, 18),
            end: Date.UTC(2026, 10, 20, 19),
          },
        ],
        syncedAt: NOW,
      },
      now: NOW,
    });
    expect(availabilityFor(profile, FRI, FRI, TZ)[FRI]?.busy).toEqual([
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
    expect(availabilityFor(profile, FRI, FRI, TZ)["2026-11-19"]).toEqual({
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
  // Saturday 21 Nov, 09:00 local = 12:00 UTC.
  const calendar = (localHour: number) => ({
    id: "work",
    name: "Trabajo",
    busy: [
      {
        start: Date.UTC(2026, 10, 21, localHour + 3),
        end: Date.UTC(2026, 10, 21, localHour + 4),
      },
    ],
    syncedAt: NOW,
  });

  it("stores busy time as UTC instants and reads it in the group's timezone", () => {
    const profile = setImportedCalendar(empty(), {
      calendar: calendar(9),
      now: NOW,
    });
    expect(availabilityFor(profile, SAT, SAT, TZ)[SAT]?.busy).toEqual([
      { start: h(9), end: h(10) },
    ]);
    expect(availabilityFor(profile, SAT, SAT, "UTC")[SAT]?.busy).toEqual([
      { start: h(12), end: h(13) },
    ]);
  });

  it("splits an event that crosses local midnight across both dates", () => {
    const profile = setImportedCalendar(empty(), {
      calendar: {
        id: "party",
        name: "Otro",
        // Fri 22:00 to Sat 02:00 local.
        busy: [
          { start: Date.UTC(2026, 10, 21, 1), end: Date.UTC(2026, 10, 21, 5) },
        ],
        syncedAt: NOW,
      },
      now: NOW,
    });
    const days = availabilityFor(profile, FRI, SAT, TZ);
    expect(days[FRI]?.busy).toEqual([{ start: h(22), end: h(24) }]);
    expect(days[SAT]?.busy).toEqual([{ start: 0, end: h(2) }]);
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
    expect(availabilityFor(profile, SAT, SAT, TZ)[SAT]?.busy).toEqual([
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

  it("rejects an event that ends before it starts", () => {
    expectProfileError(
      () =>
        setImportedCalendar(empty(), {
          calendar: { ...calendar(9), busy: [{ start: NOW, end: NOW - 1 }] },
          now: NOW,
        }),
      "INVALID_TIME",
    );
  });
});

describe("profile timezone", () => {
  const MADRID = "Europe/Madrid"; // UTC+1 in November; Santiago is UTC-3.
  const LIMA = "America/Lima"; // UTC-5 all year.
  const THU = parseLocalDate("2026-11-19");
  const inMadrid = () =>
    setTimezone(empty(), { timezone: MADRID, now: NOW + 1 });

  it("is Santiago for a profile that never chose one", () => {
    expect(DEFAULT_PROFILE_TIMEZONE).toBe("America/Santiago");
    expect(profileTimezone(empty())).toBe("America/Santiago");
  });

  it("stores the zone the person chose", () => {
    const profile = inMadrid();
    expect(profile.timezone).toBe(MADRID);
    expect(profileTimezone(profile)).toBe(MADRID);
    expect(profile.updatedAt).toBe(NOW + 1);
  });

  it.each([
    "",
    "Mars/Olympus",
    "Santiago",
  ])("rejects %j as a zone", (timezone) => {
    expectProfileError(
      () => setTimezone(empty(), { timezone, now: NOW }),
      "INVALID_TIMEZONE",
    );
  });

  it("reads the same as before when the person and the group share a zone", () => {
    const base = setTemplates(empty(), { templates: [workweek()], now: NOW });
    const explicit = setTimezone(base, { timezone: TZ, now: NOW });
    expect(availabilityFor(explicit, FRI, SAT, TZ)).toEqual(
      availabilityFor(base, FRI, SAT, TZ),
    );
  });

  it("moves a routine written in the person's zone into the group's zone", () => {
    const profile = setTemplates(inMadrid(), {
      templates: [workweek()],
      now: NOW,
    });
    // Madrid 09:00-18:00 is Santiago 05:00-14:00.
    expect(availabilityFor(profile, FRI, SAT, TZ)).toEqual({
      [FRI]: { coverage: WHOLE_DAY, busy: [{ start: h(5), end: h(14) }] },
      [SAT]: { coverage: WHOLE_DAY, busy: [] },
    });
  });

  it("moves busy time into the group's previous day when it starts after the group's midnight", () => {
    const profile = setDay(inMadrid(), {
      date: SAT,
      busy: [{ start: h(2), end: h(4) }],
      exceptions: [],
      now: NOW,
    });
    // Madrid Saturday 02:00-04:00 is Santiago Friday 22:00-24:00.
    expect(availabilityFor(profile, FRI, SAT, TZ)).toEqual({
      [FRI]: { coverage: WHOLE_DAY, busy: [{ start: h(22), end: h(24) }] },
      [SAT]: { coverage: WHOLE_DAY, busy: [] },
    });
  });

  it("carries a night written the day before the range into the first day", () => {
    const profile = setDay(inMadrid(), {
      date: THU,
      busy: [{ start: h(22), end: h(30) }],
      exceptions: [],
      now: NOW,
    });
    // Madrid Thu 22:00 to Fri 06:00 is Santiago Thu 18:00 to Fri 02:00.
    expect(availabilityFor(profile, FRI, FRI, TZ)[FRI]?.busy).toEqual([
      { start: 0, end: h(2) },
    ]);
  });

  it("lets an exception free template time on the person's own date", () => {
    const profile = setDay(
      setTemplates(inMadrid(), { templates: [workweek()], now: NOW }),
      { date: FRI, busy: [], exceptions: WHOLE_DAY, now: NOW },
    );
    expect(availabilityFor(profile, FRI, FRI, TZ)[FRI]?.busy).toEqual([]);
  });

  it("reads a group zone west of the person too", () => {
    const profile = setTemplates(
      setTimezone(empty(), { timezone: TZ, now: NOW }),
      { templates: [workweek()], now: NOW },
    );
    // Santiago 09:00-18:00 is Lima 07:00-16:00.
    expect(availabilityFor(profile, FRI, FRI, LIMA)[FRI]?.busy).toEqual([
      { start: h(7), end: h(16) },
    ]);
  });
});
