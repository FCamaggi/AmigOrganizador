import { describe, expect, it } from "vitest";
import type { AvailabilityWindow } from "../availability/find-windows";
import { parseLocalDate } from "../availability/local-date";
import {
  answerPlan,
  confirmPlan,
  createPlan,
  joinPlan,
  type Plan,
} from "./plan";
import { dayLines, inviteFor, slotFromOption } from "./plan-view";

const h = (hours: number) => hours * 60;
const NOW = Date.UTC(2026, 10, 13, 12, 0);
const FRI = parseLocalDate("2026-12-18");
const SAT = parseLocalDate("2026-12-19");
const WHOLE_DAY = [{ start: 0, end: h(24) }];

function basePlan(): Plan {
  let plan = createPlan({
    id: "p_secret",
    title: "Asado",
    organizerId: "acc_ana",
    organizerName: "Ana",
    from: FRI,
    to: SAT,
    durationMinutes: 180,
    timezone: "America/Santiago",
    now: NOW,
  });
  plan = joinPlan(plan, {
    accountId: "acc_beto",
    displayName: "Beto",
    now: NOW,
  });
  return answerPlan(plan, {
    accountId: "acc_ana",
    days: {
      [SAT]: { coverage: WHOLE_DAY, busy: [{ start: h(12), end: h(18) }] },
      // A night shift on Friday spills into Saturday morning.
      [FRI]: { coverage: WHOLE_DAY, busy: [{ start: h(22), end: h(31) }] },
    },
    now: NOW,
  });
}

describe("dayLines", () => {
  it("gives each participant free, busy and unknown segments across the span", () => {
    const lines = dayLines(basePlan(), SAT, { start: h(6), end: h(22) });
    expect(lines).toEqual([
      {
        accountId: "acc_ana",
        displayName: "Ana",
        answered: true,
        segments: [
          { start: h(6), end: h(7), state: "busy" },
          { start: h(7), end: h(12), state: "free" },
          { start: h(12), end: h(18), state: "busy" },
          { start: h(18), end: h(22), state: "free" },
        ],
      },
      {
        accountId: "acc_beto",
        displayName: "Beto",
        answered: false,
        segments: [{ start: h(6), end: h(22), state: "unknown" }],
      },
    ]);
  });

  it("treats time outside an answer's coverage as unknown", () => {
    const plan = answerPlan(basePlan(), {
      accountId: "acc_beto",
      days: { [SAT]: { coverage: [{ start: h(18), end: h(24) }], busy: [] } },
      now: NOW,
    });
    const beto = dayLines(plan, SAT, { start: h(16), end: h(20) })[1];
    expect(beto?.segments).toEqual([
      { start: h(16), end: h(18), state: "unknown" },
      { start: h(18), end: h(20), state: "free" },
    ]);
  });
});

describe("slotFromOption", () => {
  const window = (start: number, end: number) =>
    ({ date: SAT, start, end }) as AvailabilityWindow;

  it("starts at 19:00 when the window allows it", () => {
    expect(slotFromOption(window(h(8), h(22)), 180)).toEqual({
      date: SAT,
      start: h(19),
    });
  });

  it("starts as late as the window allows when it ends before 19:00 + duration", () => {
    expect(slotFromOption(window(h(8), h(21)), 180)).toEqual({
      date: SAT,
      start: h(18),
    });
  });

  it("starts at the window start, rounded up to the grid, when it begins after 19:00", () => {
    expect(slotFromOption(window(h(19) + 10, h(23)), 180)).toEqual({
      date: SAT,
      start: h(19) + 15,
    });
  });

  it("keeps the slot on the 15-minute grid inside the window", () => {
    expect(slotFromOption(window(h(14), h(20) + 50), 120)).toEqual({
      date: SAT,
      start: h(18) + 45,
    });
  });
});

describe("inviteFor", () => {
  it("is null until the plan is confirmed", () => {
    expect(inviteFor(basePlan(), "https://x.test/p/p_secret")).toBeNull();
  });

  it("turns the confirmed local slot into UTC times in the plan's timezone", () => {
    const plan = confirmPlan(basePlan(), {
      accountId: "acc_ana",
      date: SAT,
      start: h(19),
      now: NOW,
    });
    expect(inviteFor(plan, "https://x.test/p/p_secret")).toEqual({
      uid: "p_secret@amigorganizador",
      title: "Asado",
      start: Date.UTC(2026, 11, 19, 22, 0),
      end: Date.UTC(2026, 11, 20, 1, 0),
      url: "https://x.test/p/p_secret",
      description: "https://x.test/p/p_secret",
    });
  });
});
