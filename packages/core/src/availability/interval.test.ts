import { describe, expect, it } from "vitest";
import {
  clipIntervals,
  intersectIntervals,
  mergeIntervals,
  subtractIntervals,
} from "./interval";

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

describe("clipIntervals", () => {
  it("keeps only the parts inside the bounds", () => {
    expect(
      clipIntervals(
        [
          { start: 0, end: 500 },
          { start: 900, end: 1000 },
          { start: 1300, end: 1500 },
        ],
        { start: 480, end: 1320 },
      ),
    ).toEqual([
      { start: 480, end: 500 },
      { start: 900, end: 1000 },
      { start: 1300, end: 1320 },
    ]);
  });
});

describe("intersectIntervals", () => {
  it("returns the time present in both lists", () => {
    expect(
      intersectIntervals(
        [
          { start: 0, end: 100 },
          { start: 200, end: 400 },
        ],
        [{ start: 50, end: 250 }],
      ),
    ).toEqual([
      { start: 50, end: 100 },
      { start: 200, end: 250 },
    ]);
  });
});

describe("subtractIntervals", () => {
  it("removes the second list from the first", () => {
    expect(
      subtractIntervals(
        [{ start: 0, end: 1000 }],
        [
          { start: 100, end: 200 },
          { start: 150, end: 300 },
          { start: 900, end: 1200 },
        ],
      ),
    ).toEqual([
      { start: 0, end: 100 },
      { start: 300, end: 900 },
    ]);
  });

  it("returns the first list unchanged when nothing overlaps", () => {
    expect(
      subtractIntervals([{ start: 0, end: 100 }], [{ start: 100, end: 200 }]),
    ).toEqual([{ start: 0, end: 100 }]);
  });
});
