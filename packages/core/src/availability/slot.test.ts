import { describe, expect, it } from "vitest";
import type { AvailabilityWindow } from "./find-windows";
import { parseLocalDate } from "./local-date";
import { slotFromOption } from "./slot";

const h = (hours: number) => hours * 60;
const SAT = parseLocalDate("2026-12-19");

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
