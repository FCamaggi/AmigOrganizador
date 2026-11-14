import { describe, expect, it } from "vitest";
import { addDays, dateRange, parseLocalDate, weekdayOf } from "./local-date";

describe("parseLocalDate", () => {
  it("accepts a valid calendar date", () => {
    expect(parseLocalDate("2026-02-28")).toBe("2026-02-28");
  });

  it.each([
    "2026-02-30",
    "2026-13-01",
    "26-01-01",
    "2026-1-1",
    "",
  ])("rejects %j", (value) => {
    expect(() => parseLocalDate(value)).toThrow(/Invalid local date/);
  });
});

describe("weekdayOf", () => {
  it("returns 0 for Sunday through 6 for Saturday", () => {
    expect(weekdayOf(parseLocalDate("2026-11-15"))).toBe(0);
    expect(weekdayOf(parseLocalDate("2026-11-13"))).toBe(5);
    expect(weekdayOf(parseLocalDate("2026-11-14"))).toBe(6);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays(parseLocalDate("2026-12-31"), 1)).toBe("2027-01-01");
    expect(addDays(parseLocalDate("2026-03-01"), -1)).toBe("2026-02-28");
  });
});

describe("dateRange", () => {
  it("lists every date from start to end inclusive", () => {
    expect(
      dateRange(parseLocalDate("2026-11-29"), parseLocalDate("2026-12-02")),
    ).toEqual(["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
  });

  it("returns an empty list when end is before start", () => {
    expect(
      dateRange(parseLocalDate("2026-11-29"), parseLocalDate("2026-11-28")),
    ).toEqual([]);
  });
});
