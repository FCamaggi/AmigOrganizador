import { describe, expect, it } from "vitest";
import { mergeIntervals } from "./interval";

describe("mergeIntervals", () => {
  it("returns an empty list for no intervals", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("merges overlapping and touching intervals and sorts them", () => {
    expect(
      mergeIntervals([
        { start: 600, end: 700 },
        { start: 100, end: 300 },
        { start: 200, end: 400 },
        { start: 400, end: 450 },
      ]),
    ).toEqual([
      { start: 100, end: 450 },
      { start: 600, end: 700 },
    ]);
  });

  it("drops empty or inverted intervals", () => {
    expect(
      mergeIntervals([
        { start: 100, end: 100 },
        { start: 300, end: 200 },
        { start: 500, end: 600 },
      ]),
    ).toEqual([{ start: 500, end: 600 }]);
  });

  it("does not mutate its input", () => {
    const input = [
      { start: 200, end: 300 },
      { start: 100, end: 250 },
    ];
    const copy = input.map((interval) => ({ ...interval }));
    mergeIntervals(input);
    expect(input).toEqual(copy);
  });
});
