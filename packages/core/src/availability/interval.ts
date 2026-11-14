/**
 * A half-open time interval [start, end) in epoch milliseconds (UTC).
 */
export interface Interval {
  readonly start: number;
  readonly end: number;
}

/**
 * Sorts intervals and merges the ones that overlap or touch.
 * Empty or inverted intervals are dropped. The input is not mutated.
 */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = intervals
    .filter((interval) => interval.end > interval.start)
    .toSorted((a, b) => a.start - b.start);

  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged.at(-1);
    if (last && interval.start <= last.end) {
      merged[merged.length - 1] = {
        start: last.start,
        end: Math.max(last.end, interval.end),
      };
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }
  return merged;
}
