import type { DayAvailability } from "./find-windows";
import { type Interval, mergeIntervals, subtractIntervals } from "./interval";
import { addDays, dateRange, type LocalDate, weekdayOf } from "./local-date";

const MINUTES_PER_DAY = 24 * 60;
const MAX_INTERVAL_END = 2 * MINUTES_PER_DAY;
const WHOLE_DAY: Interval = { start: 0, end: MINUTES_PER_DAY };

/** 0 = Sunday … 6 = Saturday, like `weekdayOf`. */
export interface WeeklyBlock {
  readonly weekday: number;
  /** Minutes from local midnight; `end` may pass 1440 (overnight). */
  readonly start: number;
  readonly end: number;
}

export type ShiftKind = "day" | "night" | "off";

/**
 * A recurring source of busy time that a person describes once (S3): the
 * work week, weekly classes, or a rotating shift cycle. `kind` lets the UI
 * label it; the expansion only depends on the data.
 */
export type BusyTemplate =
  | { readonly kind: "workweek"; readonly blocks: readonly WeeklyBlock[] }
  | { readonly kind: "classes"; readonly blocks: readonly WeeklyBlock[] }
  | {
      readonly kind: "shifts";
      /** The date where the first entry of `cycle` applies. */
      readonly anchor: LocalDate;
      /** Busy intervals for each day of the cycle, repeated forever. */
      readonly cycle: readonly (readonly Interval[])[];
    };

const MONDAY_TO_FRIDAY = [1, 2, 3, 4, 5] as const;

/** Office hours on given weekdays. Default: Monday to Friday, 09:00–18:00. */
export function workweek(
  options: {
    readonly weekdays?: readonly number[];
    readonly start?: number;
    readonly end?: number;
  } = {},
): BusyTemplate {
  const {
    weekdays = MONDAY_TO_FRIDAY,
    start = 9 * 60,
    end = 18 * 60,
  } = options;
  return {
    kind: "workweek",
    blocks: weekdays.map((weekday) => ({ weekday, start, end })),
  };
}

/**
 * A rotating shift pattern, e.g. Chilean "cuarto turno":
 * `["day", "night", "off", "off"]`. Defaults: day 08:00–20:00, night
 * 20:00–08:00 the next morning.
 */
export function shiftCycle(options: {
  readonly anchor: LocalDate;
  readonly pattern: readonly ShiftKind[];
  readonly day?: Interval;
  readonly night?: Interval;
}): BusyTemplate {
  const {
    day = { start: 8 * 60, end: 20 * 60 },
    night = { start: 20 * 60, end: 32 * 60 },
  } = options;
  const hours: Record<ShiftKind, readonly Interval[]> = {
    day: [day],
    night: [night],
    off: [],
  };
  return {
    kind: "shifts",
    anchor: options.anchor,
    cycle: options.pattern.map((kind) => hours[kind]),
  };
}

function assertInterval(interval: Interval): void {
  const valid =
    Number.isFinite(interval.start) &&
    Number.isFinite(interval.end) &&
    interval.start >= 0 &&
    interval.start < interval.end &&
    interval.end <= MAX_INTERVAL_END;
  if (!valid) {
    throw new RangeError(
      "template intervals must be non-empty and within 0–2880 minutes",
    );
  }
}

function assertTemplate(template: BusyTemplate): void {
  if (template.kind === "shifts") {
    if (template.cycle.length === 0) {
      throw new RangeError("a shift cycle needs at least one day");
    }
    for (const day of template.cycle) day.forEach(assertInterval);
    return;
  }
  for (const block of template.blocks) {
    if (
      !Number.isInteger(block.weekday) ||
      block.weekday < 0 ||
      block.weekday > 6
    ) {
      throw new RangeError("weekday must be an integer from 0 to 6");
    }
    assertInterval(block);
  }
}

/** Throws `RangeError` when any template is malformed. */
export function validateTemplates(templates: readonly BusyTemplate[]): void {
  templates.forEach(assertTemplate);
}

const daysBetween = (from: LocalDate, to: LocalDate) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

function busyOn(template: BusyTemplate, date: LocalDate): readonly Interval[] {
  if (template.kind === "shifts") {
    const length = template.cycle.length;
    const position =
      ((daysBetween(template.anchor, date) % length) + length) % length;
    return template.cycle[position] ?? [];
  }
  const weekday = weekdayOf(date);
  return template.blocks.filter((block) => block.weekday === weekday);
}

/**
 * Busy intervals per local date from `from` to `to`. The day before `from`
 * is included only with the intervals that run past midnight into `from`
 * (night shifts). Dates without busy time are left out.
 */
export function expandBusyTemplates(
  templates: readonly BusyTemplate[],
  from: LocalDate,
  to: LocalDate,
): Record<string, Interval[]> {
  templates.forEach(assertTemplate);
  const result: Record<string, Interval[]> = {};
  const collect = (date: LocalDate, keep: (i: Interval) => boolean) => {
    const intervals = mergeIntervals(
      templates.flatMap((template) => busyOn(template, date)).filter(keep),
    );
    if (intervals.length > 0) result[date] = intervals;
  };
  collect(addDays(from, -1), (interval) => interval.end > MINUTES_PER_DAY);
  for (const date of dateRange(from, to)) collect(date, () => true);
  return result;
}

type Marks = Readonly<Record<string, readonly Interval[]>>;

export type BuildAnswerInput =
  | {
      /** Default mode: the person marks when they can't. */
      readonly mode: "busy";
      readonly from: LocalDate;
      readonly to: LocalDate;
      readonly templates?: readonly BusyTemplate[];
      /** One-off busy time, per local date. */
      readonly busy?: Marks;
      /** Time to free up on a date despite a template (e.g. a day off). */
      readonly cleared?: Marks;
    }
  | {
      /** Optional mode: the person marks when they can. */
      readonly mode: "free";
      readonly from: LocalDate;
      readonly to: LocalDate;
      readonly free?: Marks;
    };

function assertMarks(
  marks: Marks,
  from: LocalDate,
  to: LocalDate,
  maxEnd: number,
): void {
  for (const [date, intervals] of Object.entries(marks)) {
    if (!(date >= from && date <= to)) {
      throw new RangeError(`${date} is outside the plan`);
    }
    for (const interval of intervals) {
      assertInterval(interval);
      if (interval.end > maxEnd) {
        throw new RangeError("free time must stay within the day");
      }
    }
  }
}

/**
 * Turns what a person tapped into the per-date answer `answerPlan` stores.
 * Answering covers the whole range: in busy mode, time not marked busy is
 * free; in free mode, time not marked free is busy. Nothing becomes unknown.
 */
export function buildAnswerDays(
  input: BuildAnswerInput,
): Record<string, DayAvailability> {
  const { from, to } = input;
  const days: Record<string, DayAvailability> = {};

  if (input.mode === "free") {
    const free = input.free ?? {};
    assertMarks(free, from, to, MINUTES_PER_DAY);
    for (const date of dateRange(from, to)) {
      days[date] = {
        coverage: [WHOLE_DAY],
        busy: subtractIntervals([WHOLE_DAY], mergeIntervals(free[date] ?? [])),
      };
    }
    return days;
  }

  const busy = input.busy ?? {};
  const cleared = input.cleared ?? {};
  assertMarks(busy, from, to, MAX_INTERVAL_END);
  assertMarks(cleared, from, to, MAX_INTERVAL_END);
  const fromTemplates = expandBusyTemplates(input.templates ?? [], from, to);

  const spillDay = addDays(from, -1);
  const spill = fromTemplates[spillDay];
  if (spill) days[spillDay] = { coverage: [], busy: spill };

  for (const date of dateRange(from, to)) {
    const marked = mergeIntervals([
      ...(fromTemplates[date] ?? []),
      ...(busy[date] ?? []),
    ]);
    days[date] = {
      coverage: [WHOLE_DAY],
      busy: subtractIntervals(marked, mergeIntervals(cleared[date] ?? [])),
    };
  }
  return days;
}
