/**
 * A half-open interval [start, end). The engine uses minutes from local
 * midnight; the helpers work for any numeric unit.
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

/** Keeps only the parts of `intervals` that fall inside `bounds`, merged. */
export function clipIntervals(
  intervals: readonly Interval[],
  bounds: Interval,
): Interval[] {
  return mergeIntervals(
    intervals.map((interval) => ({
      start: Math.max(interval.start, bounds.start),
      end: Math.min(interval.end, bounds.end),
    })),
  );
}

/** Returns the time covered by both lists, merged. */
export function intersectIntervals(
  a: readonly Interval[],
  b: readonly Interval[],
): Interval[] {
  const result: Interval[] = [];
  for (const bound of mergeIntervals(b)) {
    result.push(...clipIntervals(a, bound));
  }
  return mergeIntervals(result);
}

/** Returns the time in `from` that is not covered by `remove`, merged. */
export function subtractIntervals(
  from: readonly Interval[],
  remove: readonly Interval[],
): Interval[] {
  const removals = mergeIntervals(remove);
  const result: Interval[] = [];

  for (const interval of mergeIntervals(from)) {
    let cursor = interval.start;
    for (const removal of removals) {
      if (removal.end <= cursor || removal.start >= interval.end) continue;
      if (removal.start > cursor) {
        result.push({ start: cursor, end: removal.start });
      }
      cursor = Math.max(cursor, removal.end);
    }
    if (cursor < interval.end) {
      result.push({ start: cursor, end: interval.end });
    }
  }
  return result;
}
