import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../availability/local-date";
import { todayIn, utcToLocal, zonedTimeToUtc } from "./zoned";

const SANTIAGO = "America/Santiago";

describe("zonedTimeToUtc", () => {
  it("converts Santiago summer time (UTC-3)", () => {
    expect(
      zonedTimeToUtc(parseLocalDate("2026-12-19"), 19 * 60, SANTIAGO),
    ).toBe(Date.UTC(2026, 11, 19, 22, 0));
  });

  it("converts Santiago winter time (UTC-4)", () => {
    expect(
      zonedTimeToUtc(parseLocalDate("2026-07-10"), 19 * 60, SANTIAGO),
    ).toBe(Date.UTC(2026, 6, 10, 23, 0));
  });

  it("lets minutes run past midnight into the next day", () => {
    expect(
      zonedTimeToUtc(parseLocalDate("2026-12-19"), 25 * 60, SANTIAGO),
    ).toBe(Date.UTC(2026, 11, 20, 4, 0));
  });

  it("works for other zones", () => {
    expect(zonedTimeToUtc(parseLocalDate("2026-12-19"), 0, "UTC")).toBe(
      Date.UTC(2026, 11, 19),
    );
  });

  it("moves a time in the spring-forward gap forward (Santiago jumps at midnight)", () => {
    // 6 Sep 2026: 00:00 local does not exist; the day starts at 01:00 (-03) = 04:00Z.
    expect(zonedTimeToUtc(parseLocalDate("2026-09-06"), 0, SANTIAGO)).toBe(
      Date.UTC(2026, 8, 6, 4),
    );
  });

  it("picks the earlier instant for a repeated time when clocks fall back", () => {
    // 4 Apr 2027: at 00:00 (-03) clocks go back to 23:00 (-04) on the 3rd,
    // so 23:30 on the 3rd happens twice; the first one is 02:30Z.
    expect(
      zonedTimeToUtc(parseLocalDate("2027-04-03"), 23 * 60 + 30, SANTIAGO),
    ).toBe(Date.UTC(2027, 3, 4, 2, 30));
  });

  it("rejects an unknown timezone", () => {
    expect(() =>
      zonedTimeToUtc(parseLocalDate("2026-12-19"), 0, "Mars/Olympus"),
    ).toThrow(RangeError);
  });
});

describe("todayIn", () => {
  it("returns the local date in the zone, not in UTC", () => {
    // 02:00 UTC on the 14th is still the 13th in Santiago.
    expect(todayIn(SANTIAGO, Date.UTC(2026, 10, 14, 2, 0))).toBe("2026-11-13");
    expect(todayIn("UTC", Date.UTC(2026, 10, 14, 2, 0))).toBe("2026-11-14");
  });
});

describe("utcToLocal", () => {
  it("returns the local date and minutes after midnight in the zone", () => {
    expect(utcToLocal(Date.UTC(2026, 11, 19, 22, 30), SANTIAGO)).toEqual({
      date: "2026-12-19",
      minutes: 19 * 60 + 30,
    });
  });

  it("moves to the previous local date when UTC is already past midnight", () => {
    expect(utcToLocal(Date.UTC(2026, 11, 20, 2, 0), SANTIAGO)).toEqual({
      date: "2026-12-19",
      minutes: 23 * 60,
    });
  });
});
