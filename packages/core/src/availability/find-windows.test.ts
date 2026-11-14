import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  type FindWindowsInput,
  findWindows,
  type MemberAvailability,
} from "./find-windows";
import { parseLocalDate } from "./local-date";

const FRIDAY = parseLocalDate("2026-11-13");
const SATURDAY = parseLocalDate("2026-11-14");
const MONDAY = parseLocalDate("2026-11-16");

const h = (hours: number) => hours * 60;
const WHOLE_DAY = { start: 0, end: h(24) };

/** A member who answered for the whole day and is busy in `busy`. */
function answered(
  memberId: string,
  date: string,
  busy: { start: number; end: number }[] = [],
): MemberAvailability {
  return {
    memberId,
    days: { [date]: { coverage: [WHOLE_DAY], busy } },
  };
}

function input(overrides: Partial<FindWindowsInput>): FindWindowsInput {
  return {
    from: FRIDAY,
    to: FRIDAY,
    members: [],
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

describe("findWindows", () => {
  it("finds the common free window and lists who can come", () => {
    const windows = findWindows(
      input({
        members: [
          answered("ana", FRIDAY, [{ start: h(8), end: h(18) }]),
          answered("beto", FRIDAY, [{ start: h(8), end: h(17) }]),
        ],
      }),
    );

    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      date: FRIDAY,
      start: h(18),
      end: h(22),
      freeMemberIds: ["ana", "beto"],
      unknownMemberIds: [],
      busyMemberIds: [],
    });
  });

  it("never treats a member without data as free", () => {
    const windows = findWindows(
      input({
        members: [
          answered("ana", FRIDAY),
          answered("beto", FRIDAY),
          { memberId: "caro", days: {} },
        ],
      }),
    );

    expect(windows).toHaveLength(1);
    expect(windows[0]?.freeMemberIds).toEqual(["ana", "beto"]);
    expect(windows[0]?.unknownMemberIds).toEqual(["caro"]);
    expect(windows[0]?.reasons).toContainEqual({
      code: "MISSING_DATA",
      memberIds: ["caro"],
    });
    expect(windows[0]?.reasons).not.toContainEqual({ code: "ALL_AVAILABLE" });
  });

  it("treats time outside a member's coverage as unknown, not free", () => {
    const windows = findWindows(
      input({
        members: [
          answered("ana", FRIDAY),
          {
            memberId: "beto",
            days: {
              [FRIDAY]: { coverage: [{ start: h(8), end: h(14) }], busy: [] },
            },
          },
        ],
        settings: { ...DEFAULT_SETTINGS, alternativeThreshold: 100 },
      }),
    );

    expect(windows.map((w) => [w.start, w.end, w.freeMemberIds])).toEqual([
      [h(8), h(14), ["ana", "beto"]],
    ]);
  });

  it("applies overnight busy time from the previous day", () => {
    const windows = findWindows(
      input({
        members: [
          {
            memberId: "nurse",
            days: {
              "2026-11-12": {
                coverage: [WHOLE_DAY],
                busy: [{ start: h(20), end: h(24 + 12) }],
              },
              [FRIDAY]: { coverage: [WHOLE_DAY], busy: [] },
            },
          },
        ],
      }),
    );

    expect(windows.map((w) => [w.start, w.end])).toEqual([[h(12), h(22)]]);
  });

  it("drops windows below the attendance threshold", () => {
    const windows = findWindows(
      input({
        members: [
          answered("ana", FRIDAY),
          answered("beto", FRIDAY),
          answered("caro", FRIDAY, [{ start: h(8), end: h(22) }]),
        ],
        settings: { ...DEFAULT_SETTINGS, alternativeThreshold: 80 },
      }),
    );

    expect(windows).toEqual([]);
  });

  it("drops windows shorter than the minimum block", () => {
    const windows = findWindows(
      input({
        members: [answered("ana", FRIDAY, [{ start: h(9), end: h(21) }])],
        settings: { ...DEFAULT_SETTINGS, minimumBlockMinutes: 90 },
      }),
    );

    expect(windows).toEqual([]);
  });

  it("splits a window where the set of free members changes", () => {
    const windows = findWindows(
      input({
        members: [
          answered("ana", FRIDAY, [{ start: h(8), end: h(14) }]),
          answered("beto", FRIDAY, [{ start: h(8), end: h(14) }]),
          answered("caro", FRIDAY, [
            { start: h(8), end: h(14) },
            { start: h(18), end: h(22) },
          ]),
          answered("dani", FRIDAY, [{ start: h(8), end: h(14) }]),
          answered("eli", FRIDAY, [{ start: h(8), end: h(14) }]),
        ],
      }),
    );

    expect(
      windows.map((w) => [w.start, w.end, w.freeMemberIds.length]),
    ).toEqual([
      [h(14), h(18), 5],
      [h(18), h(22), 4],
    ]);
  });

  it("scores with the v1 weights and explains the score", () => {
    const [window] = findWindows(
      input({
        from: SATURDAY,
        to: SATURDAY,
        members: [answered("ana", SATURDAY, [{ start: h(8), end: h(19) }])],
      }),
    );

    // 45 * 1 + 20 * 1 (3h) + 20 * 1 (evening) + 10 * 1 (Saturday) + 5 * 1
    expect(window?.score).toBe(100);
    expect(window?.reasons).toEqual([
      { code: "ALL_AVAILABLE" },
      { code: "LONG_BLOCK" },
      { code: "EVENING" },
      { code: "GOOD_WEEKDAY" },
    ]);
  });

  it("lowers the score on weekdays, mornings and short blocks", () => {
    const [window] = findWindows(
      input({
        from: MONDAY,
        to: MONDAY,
        members: [answered("ana", MONDAY, [{ start: h(10), end: h(22) }])],
      }),
    );

    // 45 + 20 * (120 / 180) + 20 * 0.65 (morning) + 10 * 0.65 + 5 = 82.83
    expect(window?.score).toBe(83);
    expect(window?.reasons).toEqual([
      { code: "ALL_AVAILABLE" },
      { code: "ENOUGH_DURATION" },
    ]);
  });

  it("ranks windows where everyone can come first, then by score", () => {
    const members: MemberAvailability[] = [
      {
        memberId: "ana",
        days: {
          [FRIDAY]: { coverage: [WHOLE_DAY], busy: [] },
          [SATURDAY]: { coverage: [WHOLE_DAY], busy: [] },
        },
      },
      {
        memberId: "beto",
        days: {
          [FRIDAY]: {
            coverage: [WHOLE_DAY],
            busy: [{ start: h(8), end: h(19) }],
          },
        },
      },
    ];

    const windows = findWindows(
      input({
        from: FRIDAY,
        to: SATURDAY,
        members,
        settings: { ...DEFAULT_SETTINGS, alternativeThreshold: 50 },
      }),
    );

    expect(windows[0]).toMatchObject({
      date: FRIDAY,
      start: h(19),
      end: h(22),
    });
    expect(windows[0]?.freeMemberIds).toEqual(["ana", "beto"]);
    expect(windows.slice(1).every((w) => w.freeMemberIds.length === 1)).toBe(
      true,
    );
    const scores = windows.slice(1).map((w) => w.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("returns nothing for a group with no members", () => {
    expect(findWindows(input({ members: [] }))).toEqual([]);
  });

  it("rejects invalid settings", () => {
    expect(() =>
      findWindows(
        input({
          settings: {
            ...DEFAULT_SETTINGS,
            usefulStart: h(22),
            usefulEnd: h(8),
          },
        }),
      ),
    ).toThrow(/usefulStart must be before usefulEnd/);
    expect(() =>
      findWindows(
        input({ settings: { ...DEFAULT_SETTINGS, alternativeThreshold: 0 } }),
      ),
    ).toThrow(/alternativeThreshold/);
  });
});

describe("findWindows review follow-ups", () => {
  it("applies overnight coverage from the previous day", () => {
    const windows = findWindows(
      input({
        members: [
          {
            memberId: "nurse",
            days: {
              "2026-11-12": {
                coverage: [{ start: h(20), end: h(24 + 14) }],
                busy: [{ start: h(20), end: h(24 + 10) }],
              },
            },
          },
        ],
      }),
    );

    expect(windows.map((w) => [w.start, w.end])).toEqual([[h(10), h(14)]]);
  });

  it("explains partial attendance and late windows", () => {
    const [window] = findWindows(
      input({
        members: [
          answered("ana", FRIDAY, [{ start: h(8), end: h(20) }]),
          answered("beto", FRIDAY, [{ start: h(8), end: h(20) }]),
          answered("caro", FRIDAY, [{ start: h(8), end: h(20) }]),
          answered("dani", FRIDAY, [{ start: h(8), end: h(20) }]),
          answered("eli", FRIDAY, [{ start: h(8), end: h(24) }]),
        ],
        settings: { ...DEFAULT_SETTINGS, usefulEnd: h(24) },
      }),
    );

    expect(window).toMatchObject({ start: h(20), end: h(24) });
    expect(window?.reasons).toEqual([
      { code: "PARTIAL_AVAILABLE", freeCount: 4, memberCount: 5 },
      { code: "LONG_BLOCK" },
      { code: "LATE" },
      { code: "GOOD_WEEKDAY" },
    ]);
  });

  it.each([
    [
      "a NaN threshold",
      { alternativeThreshold: Number.NaN },
      /alternativeThreshold/,
    ],
    [
      "a NaN minimum block",
      { minimumBlockMinutes: Number.NaN },
      /minimumBlockMinutes/,
    ],
    [
      "an infinite useful end",
      { usefulEnd: Number.POSITIVE_INFINITY },
      /useful hours/,
    ],
    [
      "a negative weight",
      { weights: { ...DEFAULT_SETTINGS.weights, duration: -1 } },
      /weights/,
    ],
    [
      "weights above 100",
      { weights: { ...DEFAULT_SETTINGS.weights, attendance: 90 } },
      /weights/,
    ],
  ])("rejects %s", (_label, override, error) => {
    expect(() =>
      findWindows(input({ settings: { ...DEFAULT_SETTINGS, ...override } })),
    ).toThrow(error);
  });

  it("rejects duplicate member ids", () => {
    expect(() =>
      findWindows(
        input({ members: [answered("ana", FRIDAY), answered("ana", FRIDAY)] }),
      ),
    ).toThrow(/Duplicate memberId: ana/);
  });

  it("rejects intervals outside the supported range", () => {
    expect(() =>
      findWindows(
        input({
          members: [answered("ana", FRIDAY, [{ start: h(20), end: h(49) }])],
        }),
      ),
    ).toThrow(/between 0 and 2880/);
  });
});
