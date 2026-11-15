import { intervalsFor, type MemberAvailability } from "./find-windows";
import {
  clipIntervals,
  type Interval,
  intersectIntervals,
  subtractIntervals,
} from "./interval";
import type { LocalDate } from "./local-date";

export type LineState = "free" | "busy" | "unknown";

export interface LineSegment {
  readonly start: number;
  readonly end: number;
  readonly state: LineState;
}

/** One participant's day, drawn as a line: what we know, minute by minute. */
export interface DayLine {
  readonly accountId: string;
  readonly displayName: string;
  readonly answered: boolean;
  /** Ordered, contiguous segments covering the requested span. */
  readonly segments: readonly LineSegment[];
}

/** Free, busy and unknown segments of one member on `date`, covering `span`. */
export function lineSegments(
  member: MemberAvailability,
  date: LocalDate,
  span: Interval,
): LineSegment[] {
  const known = clipIntervals(
    intervalsFor(member, date, (day) => day.coverage),
    span,
  );
  const busy = intersectIntervals(
    clipIntervals(
      intervalsFor(member, date, (day) => day.busy),
      span,
    ),
    known,
  );
  const tagged: LineSegment[] = [
    ...subtractIntervals(known, busy).map((i) => ({
      ...i,
      state: "free" as const,
    })),
    ...busy.map((i) => ({ ...i, state: "busy" as const })),
    ...subtractIntervals([span], known).map((i) => ({
      ...i,
      state: "unknown" as const,
    })),
  ].toSorted((a, b) => a.start - b.start);

  const merged: LineSegment[] = [];
  for (const segment of tagged) {
    const last = merged.at(-1);
    if (last && last.state === segment.state && last.end === segment.start) {
      merged[merged.length - 1] = { ...last, end: segment.end };
    } else {
      merged.push(segment);
    }
  }
  return merged;
}
