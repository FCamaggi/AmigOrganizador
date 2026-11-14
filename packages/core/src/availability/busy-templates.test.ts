import { describe, expect, it } from "vitest";
import {
  type BusyTemplate,
  buildAnswerDays,
  expandBusyTemplates,
  shiftCycle,
  workweek,
} from "./busy-templates";
import { parseLocalDate } from "./local-date";

const h = (hours: number) => hours * 60;
const d = parseLocalDate;
// 2026-11-13 is a Friday.
const FRI = d("2026-11-13");
const MON = d("2026-11-16");
const WHOLE_DAY = [{ start: 0, end: h(24) }];

describe("expandBusyTemplates", () => {
  it("repeats a workweek on Monday to Friday only", () => {
    const busy = expandBusyTemplates([workweek()], FRI, MON);
    expect(busy).toEqual({
      "2026-11-13": [{ start: h(9), end: h(18) }],
      "2026-11-16": [{ start: h(9), end: h(18) }],
    });
  });

  it("accepts custom workweek hours and days", () => {
    const busy = expandBusyTemplates(
      [workweek({ weekdays: [6], start: h(10), end: h(14) })],
      FRI,
      MON,
    );
    expect(busy).toEqual({ "2026-11-14": [{ start: h(10), end: h(14) }] });
  });

  it("places weekly classes on their weekday and merges overlaps", () => {
    const classes: BusyTemplate = {
      kind: "classes",
      blocks: [
        { weekday: 5, start: h(8), end: h(10) },
        { weekday: 5, start: h(9), end: h(11) },
        { weekday: 1, start: h(14), end: h(16) },
      ],
    };
    expect(expandBusyTemplates([classes], FRI, MON)).toEqual({
      "2026-11-13": [{ start: h(8), end: h(11) }],
      "2026-11-16": [{ start: h(14), end: h(16) }],
    });
  });

  it("merges several templates on the same date", () => {
    const classes: BusyTemplate = {
      kind: "classes",
      blocks: [{ weekday: 1, start: h(17), end: h(20) }],
    };
    expect(expandBusyTemplates([workweek(), classes], MON, MON)).toEqual({
      "2026-11-16": [{ start: h(9), end: h(20) }],
    });
  });

  it("rotates a shift cycle from its anchor, also before the anchor", () => {
    // Day, night, off, off, starting Saturday 14.
    const shifts = shiftCycle({
      anchor: d("2026-11-14"),
      pattern: ["day", "night", "off", "off"],
    });
    const busy = expandBusyTemplates(
      [shifts],
      d("2026-11-11"),
      d("2026-11-18"),
    );
    // Tue 10 is a day shift (no spill), so the day before the range is left out.
    expect(busy).toEqual({
      "2026-11-11": [{ start: h(20), end: h(32) }],
      "2026-11-14": [{ start: h(8), end: h(20) }],
      "2026-11-15": [{ start: h(20), end: h(32) }],
      "2026-11-18": [{ start: h(8), end: h(20) }],
    });
  });

  it("includes the day before the range only when a shift spills into it", () => {
    const shifts = shiftCycle({
      anchor: FRI,
      pattern: ["off", "day"],
    });
    expect(Object.keys(expandBusyTemplates([shifts], FRI, FRI))).toEqual([]);
  });

  it("uses custom shift hours", () => {
    const shifts = shiftCycle({
      anchor: FRI,
      pattern: ["night"],
      night: { start: h(22), end: h(30) },
    });
    expect(expandBusyTemplates([shifts], FRI, FRI)).toEqual({
      "2026-11-12": [{ start: h(22), end: h(30) }],
      "2026-11-13": [{ start: h(22), end: h(30) }],
    });
  });

  it.each([
    ["a weekday outside 0-6", workweek({ weekdays: [7] })],
    ["start after end", workweek({ start: h(18), end: h(9) })],
    ["an empty interval", workweek({ start: h(9), end: h(9) })],
    ["an end past 2880", workweek({ start: h(9), end: h(49) })],
    ["an empty shift cycle", shiftCycle({ anchor: FRI, pattern: [] })],
  ])("rejects %s", (_label, template) => {
    expect(() => expandBusyTemplates([template], FRI, MON)).toThrow(RangeError);
  });
});

describe("buildAnswerDays", () => {
  it("in busy mode covers every date in the range and marks templates and taps as busy", () => {
    const days = buildAnswerDays({
      mode: "busy",
      from: FRI,
      to: d("2026-11-14"),
      templates: [workweek()],
      busy: { "2026-11-14": [{ start: h(12), end: h(15) }] },
    });
    expect(days).toEqual({
      "2026-11-13": {
        coverage: WHOLE_DAY,
        busy: [{ start: h(9), end: h(18) }],
      },
      "2026-11-14": {
        coverage: WHOLE_DAY,
        busy: [{ start: h(12), end: h(15) }],
      },
    });
  });

  it("in busy mode lets the person clear a template on one date", () => {
    const days = buildAnswerDays({
      mode: "busy",
      from: FRI,
      to: FRI,
      templates: [workweek()],
      cleared: { "2026-11-13": [{ start: h(14), end: h(18) }] },
    });
    expect(days["2026-11-13"]?.busy).toEqual([{ start: h(9), end: h(14) }]);
  });

  it("in busy mode keeps only the overnight spill of the day before, with no coverage", () => {
    const days = buildAnswerDays({
      mode: "busy",
      from: FRI,
      to: FRI,
      templates: [shiftCycle({ anchor: FRI, pattern: ["night"] })],
    });
    expect(days["2026-11-12"]).toEqual({
      coverage: [],
      busy: [{ start: h(20), end: h(32) }],
    });
  });

  it("in free mode treats everything not marked free as busy", () => {
    const days = buildAnswerDays({
      mode: "free",
      from: FRI,
      to: d("2026-11-14"),
      free: { "2026-11-13": [{ start: h(19), end: h(23) }] },
    });
    expect(days).toEqual({
      "2026-11-13": {
        coverage: WHOLE_DAY,
        busy: [
          { start: 0, end: h(19) },
          { start: h(23), end: h(24) },
        ],
      },
      "2026-11-14": { coverage: WHOLE_DAY, busy: WHOLE_DAY },
    });
  });

  it("rejects marks outside the range", () => {
    expect(() =>
      buildAnswerDays({
        mode: "busy",
        from: FRI,
        to: FRI,
        busy: { "2026-11-20": [{ start: h(9), end: h(10) }] },
      }),
    ).toThrow(RangeError);
  });

  it("rejects free marks that leave the day", () => {
    expect(() =>
      buildAnswerDays({
        mode: "free",
        from: FRI,
        to: FRI,
        free: { "2026-11-13": [{ start: h(20), end: h(26) }] },
      }),
    ).toThrow(RangeError);
  });
});
