import {
  clipIntervals,
  type Interval,
  intersectIntervals,
  subtractIntervals,
} from "./interval";
import { addDays, dateRange, type LocalDate, weekdayOf } from "./local-date";

const MINUTES_PER_DAY = 24 * 60;

/**
 * What one member told us about one local date, in minutes from local
 * midnight. Intervals may extend past 1440 (e.g. a night shift until 07:00
 * is `{ start: 1320, end: 1860 }`); the overflow applies to the next day.
 */
export interface DayAvailability {
  /** Time ranges the member gave information about. Anything else is unknown. */
  readonly coverage: readonly Interval[];
  /** Busy time inside the coverage. Covered time that is not busy is free. */
  readonly busy: readonly Interval[];
}

export interface MemberAvailability {
  readonly memberId: string;
  /** Keyed by local date (`YYYY-MM-DD`). Missing dates are unknown. */
  readonly days: Readonly<Record<string, DayAvailability>>;
}

export interface ScoreWeights {
  readonly attendance: number;
  readonly duration: number;
  readonly timeOfDay: number;
  readonly weekday: number;
  readonly certainty: number;
}

export interface WindowSettings {
  /** Minutes from local midnight; the useful range stays within one day. */
  readonly usefulStart: number;
  readonly usefulEnd: number;
  readonly minimumBlockMinutes: number;
  /** Minimum share (1–100) of responding members who must be free. */
  readonly alternativeThreshold: number;
  readonly weights: ScoreWeights;
}

export const DEFAULT_SETTINGS: WindowSettings = {
  usefulStart: 8 * 60,
  usefulEnd: 22 * 60,
  minimumBlockMinutes: 120,
  alternativeThreshold: 80,
  weights: {
    attendance: 45,
    duration: 20,
    timeOfDay: 20,
    weekday: 10,
    certainty: 5,
  },
};

export interface FindWindowsInput {
  readonly from: LocalDate;
  readonly to: LocalDate;
  readonly members: readonly MemberAvailability[];
  readonly settings: WindowSettings;
}

export type WindowReason =
  | { readonly code: "ALL_AVAILABLE" }
  | {
      readonly code: "PARTIAL_AVAILABLE";
      readonly freeCount: number;
      readonly memberCount: number;
    }
  | { readonly code: "LONG_BLOCK" }
  | { readonly code: "ENOUGH_DURATION" }
  | { readonly code: "EVENING" }
  | { readonly code: "LATE" }
  | { readonly code: "GOOD_WEEKDAY" }
  | { readonly code: "MISSING_DATA"; readonly memberIds: readonly string[] };

export interface AvailabilityWindow {
  readonly date: LocalDate;
  readonly start: number;
  readonly end: number;
  readonly freeMemberIds: readonly string[];
  readonly unknownMemberIds: readonly string[];
  readonly busyMemberIds: readonly string[];
  /** 0–100. */
  readonly score: number;
  readonly reasons: readonly WindowReason[];
}

type TimeOfDay = "morning" | "afternoon" | "evening" | "late";

const TIME_OF_DAY_RATIO: Record<TimeOfDay, number> = {
  morning: 0.65,
  afternoon: 0.85,
  evening: 1,
  late: 0.45,
};

interface MemberDay {
  readonly memberId: string;
  readonly free: Interval[];
  readonly unknown: Interval[];
}

interface Segment {
  readonly start: number;
  readonly end: number;
  readonly freeMemberIds: string[];
  readonly unknownMemberIds: string[];
  readonly busyMemberIds: string[];
}

/**
 * Finds and ranks the time windows where enough of the group can meet.
 * See docs/domain/AVAILABILITY_ENGINE.md.
 */
export function findWindows(input: FindWindowsInput): AvailabilityWindow[] {
  const { settings, members } = input;
  validateSettings(settings);
  validateMembers(members);
  if (members.length === 0) return [];

  const useful: Interval = {
    start: settings.usefulStart,
    end: settings.usefulEnd,
  };
  const dates = dateRange(input.from, input.to);
  const respondents = new Set(
    members
      .filter((member) =>
        dates.some((date) => coverageFor(member, date, useful).length > 0),
      )
      .map((member) => member.memberId),
  );
  if (respondents.size === 0) return [];

  const windows: AvailabilityWindow[] = [];
  for (const date of dates) {
    const memberDays = members.map((member) =>
      memberDay(member, date, useful, respondents.has(member.memberId)),
    );
    for (const segment of segmentsFor(memberDays, useful)) {
      const qualifies =
        segment.freeMemberIds.length > 0 &&
        segment.freeMemberIds.length * 100 >=
          settings.alternativeThreshold * respondents.size;
      if (
        qualifies &&
        segment.end - segment.start >= settings.minimumBlockMinutes
      ) {
        windows.push(toWindow(date, segment, members.length, settings.weights));
      }
    }
  }

  return windows.toSorted(compareWindows(members.length));
}

function validateSettings(settings: WindowSettings): void {
  const { usefulStart, usefulEnd, minimumBlockMinutes, alternativeThreshold } =
    settings;
  if (
    !Number.isFinite(usefulStart) ||
    !Number.isFinite(usefulEnd) ||
    usefulStart < 0 ||
    usefulEnd > MINUTES_PER_DAY
  ) {
    throw new RangeError("useful hours must be within 0 and 1440 minutes");
  }
  if (usefulStart >= usefulEnd) {
    throw new RangeError("usefulStart must be before usefulEnd");
  }
  if (!Number.isFinite(minimumBlockMinutes) || minimumBlockMinutes < 0) {
    throw new RangeError("minimumBlockMinutes must be a non-negative number");
  }
  if (
    !Number.isFinite(alternativeThreshold) ||
    alternativeThreshold <= 0 ||
    alternativeThreshold > 100
  ) {
    throw new RangeError("alternativeThreshold must be between 1 and 100");
  }
  const weights = Object.values(settings.weights);
  if (
    weights.some((weight) => !Number.isFinite(weight) || weight < 0) ||
    weights.reduce((sum, weight) => sum + weight, 0) > 100
  ) {
    throw new RangeError(
      "weights must be non-negative numbers that add up to at most 100",
    );
  }
}

/** Overnight overflow reaches one day ahead, so intervals stay in [0, 2880]. */
const MAX_INTERVAL_END = 2 * MINUTES_PER_DAY;

function validateMembers(members: readonly MemberAvailability[]): void {
  const seen = new Set<string>();
  for (const member of members) {
    if (seen.has(member.memberId)) {
      throw new RangeError(`Duplicate memberId: ${member.memberId}`);
    }
    seen.add(member.memberId);
    for (const day of Object.values(member.days)) {
      for (const interval of [...day.coverage, ...day.busy]) {
        if (
          !Number.isFinite(interval.start) ||
          !Number.isFinite(interval.end) ||
          interval.start < 0 ||
          interval.end > MAX_INTERVAL_END
        ) {
          throw new RangeError(
            "intervals must be between 0 and 2880 minutes from local midnight",
          );
        }
      }
    }
  }
}

/** Today's intervals plus the overflow of yesterday's past midnight. */
function intervalsFor(
  member: MemberAvailability,
  date: LocalDate,
  pick: (day: DayAvailability) => readonly Interval[],
): Interval[] {
  const today = member.days[date];
  const yesterday = member.days[addDays(date, -1)];
  const spill = yesterday
    ? pick(yesterday)
        .filter((interval) => interval.end > MINUTES_PER_DAY)
        .map((interval) => ({
          start: interval.start - MINUTES_PER_DAY,
          end: interval.end - MINUTES_PER_DAY,
        }))
    : [];
  return [...(today ? pick(today) : []), ...spill];
}

function coverageFor(
  member: MemberAvailability,
  date: LocalDate,
  useful: Interval,
): Interval[] {
  return clipIntervals(
    intervalsFor(member, date, (day) => day.coverage),
    useful,
  );
}

function memberDay(
  member: MemberAvailability,
  date: LocalDate,
  useful: Interval,
  isRespondent: boolean,
): MemberDay {
  if (!isRespondent) {
    return { memberId: member.memberId, free: [], unknown: [useful] };
  }
  const known = coverageFor(member, date, useful);
  const busy = intersectIntervals(
    clipIntervals(
      intervalsFor(member, date, (day) => day.busy),
      useful,
    ),
    known,
  );
  return {
    memberId: member.memberId,
    free: subtractIntervals(known, busy),
    unknown: subtractIntervals([useful], known),
  };
}

const contains = (blocks: readonly Interval[], start: number, end: number) =>
  blocks.some((block) => block.start <= start && block.end >= end);

/** Cuts the useful range at every boundary and merges equal neighbours. */
function segmentsFor(
  memberDays: readonly MemberDay[],
  useful: Interval,
): Segment[] {
  const boundaries = new Set([useful.start, useful.end]);
  for (const day of memberDays) {
    for (const block of [...day.free, ...day.unknown]) {
      boundaries.add(block.start);
      boundaries.add(block.end);
    }
  }
  const points = [...boundaries].toSorted((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i] as number;
    const end = points[i + 1] as number;
    const freeMemberIds: string[] = [];
    const unknownMemberIds: string[] = [];
    const busyMemberIds: string[] = [];
    for (const day of memberDays) {
      if (contains(day.free, start, end)) freeMemberIds.push(day.memberId);
      else if (contains(day.unknown, start, end))
        unknownMemberIds.push(day.memberId);
      else busyMemberIds.push(day.memberId);
    }

    const last = segments.at(-1);
    if (
      last &&
      last.end === start &&
      sameIds(last.freeMemberIds, freeMemberIds) &&
      sameIds(last.unknownMemberIds, unknownMemberIds)
    ) {
      segments[segments.length - 1] = { ...last, end };
    } else {
      segments.push({
        start,
        end,
        freeMemberIds,
        unknownMemberIds,
        busyMemberIds,
      });
    }
  }
  return segments;
}

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

function timeOfDay(start: number, end: number): TimeOfDay {
  const midpoint = (start + end) / 2;
  if (midpoint < 12 * 60) return "morning";
  if (midpoint < 17 * 60) return "afternoon";
  if (midpoint < 22 * 60) return "evening";
  return "late";
}

function weekdayRatio(date: LocalDate): number {
  const weekday = weekdayOf(date);
  if (weekday === 5 || weekday === 6) return 1;
  if (weekday === 0) return 0.9;
  return 0.65;
}

function toWindow(
  date: LocalDate,
  segment: Segment,
  memberCount: number,
  weights: ScoreWeights,
): AvailabilityWindow {
  const duration = segment.end - segment.start;
  const freeCount = segment.freeMemberIds.length;
  const quality = timeOfDay(segment.start, segment.end);
  const dayRatio = weekdayRatio(date);
  const score = Math.round(
    (freeCount / memberCount) * weights.attendance +
      Math.min(duration / 180, 1) * weights.duration +
      TIME_OF_DAY_RATIO[quality] * weights.timeOfDay +
      dayRatio * weights.weekday +
      ((memberCount - segment.unknownMemberIds.length) / memberCount) *
        weights.certainty,
  );

  const reasons: WindowReason[] = [
    freeCount === memberCount
      ? { code: "ALL_AVAILABLE" }
      : { code: "PARTIAL_AVAILABLE", freeCount, memberCount },
  ];
  if (duration >= 180) reasons.push({ code: "LONG_BLOCK" });
  else if (duration >= 120) reasons.push({ code: "ENOUGH_DURATION" });
  if (quality === "evening") reasons.push({ code: "EVENING" });
  else if (quality === "late") reasons.push({ code: "LATE" });
  if (dayRatio >= 0.9) reasons.push({ code: "GOOD_WEEKDAY" });
  if (segment.unknownMemberIds.length > 0) {
    reasons.push({ code: "MISSING_DATA", memberIds: segment.unknownMemberIds });
  }

  return {
    date,
    start: segment.start,
    end: segment.end,
    freeMemberIds: segment.freeMemberIds,
    unknownMemberIds: segment.unknownMemberIds,
    busyMemberIds: segment.busyMemberIds,
    score,
    reasons,
  };
}

/** Everyone-can-come first, then by score, then earliest. */
function compareWindows(memberCount: number) {
  return (a: AvailabilityWindow, b: AvailabilityWindow): number => {
    const aAll = a.freeMemberIds.length === memberCount ? 1 : 0;
    const bAll = b.freeMemberIds.length === memberCount ? 1 : 0;
    return (
      bAll - aAll ||
      b.score - a.score ||
      a.date.localeCompare(b.date) ||
      a.start - b.start
    );
  };
}
