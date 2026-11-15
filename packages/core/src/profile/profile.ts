import {
  type BusyTemplate,
  expandBusyTemplates,
  validateTemplates,
} from "../availability/busy-templates";
import type { DayAvailability } from "../availability/find-windows";
import {
  type Interval,
  mergeIntervals,
  subtractIntervals,
} from "../availability/interval";
import {
  addDays,
  dateRange,
  type LocalDate,
  parseLocalDate,
} from "../availability/local-date";

const MINUTES_PER_DAY = 24 * 60;
const MAX_INTERVAL_END = 2 * MINUTES_PER_DAY;
const WHOLE_DAY: Interval = { start: 0, end: MINUTES_PER_DAY };

type DayMap = Readonly<Record<string, readonly Interval[]>>;

/**
 * Busy time read from another calendar (ICS URL now; Google or Microsoft
 * later). Only busy intervals per local date are kept, never event titles.
 */
export interface ImportedCalendar {
  readonly id: string;
  /** A label the person gives it ("Trabajo"), not taken from the events. */
  readonly name: string;
  readonly busy: DayMap;
  readonly syncedAt: number;
}

/**
 * One person's busy calendar, shared by all their groups (ADR 0004). Times
 * are local minutes in the timezone of the group that reads them.
 */
export interface Profile {
  readonly accountId: string;
  /** Optional helpers: classes, office week, shifts. */
  readonly templates: readonly BusyTemplate[];
  /** One-off busy time per local date. */
  readonly busyDays: DayMap;
  /** Template time freed on a date (a day off); never frees other busy time. */
  readonly exceptions: DayMap;
  readonly importedCalendars: readonly ImportedCalendar[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type ProfileErrorCode =
  | "INVALID_TEMPLATE"
  | "INVALID_DATE"
  | "INVALID_TIME";

/** A rule of the profile was broken. `code` is stable; the UI maps it to copy. */
export class ProfileError extends Error {
  readonly code: ProfileErrorCode;

  constructor(code: ProfileErrorCode, message: string) {
    super(message);
    this.name = "ProfileError";
    this.code = code;
  }
}

function checkIntervals(intervals: readonly Interval[]): Interval[] {
  for (const interval of intervals) {
    const valid =
      Number.isFinite(interval.start) &&
      Number.isFinite(interval.end) &&
      interval.start >= 0 &&
      interval.start < interval.end &&
      interval.end <= MAX_INTERVAL_END;
    if (!valid) {
      throw new ProfileError(
        "INVALID_TIME",
        "intervals must be non-empty and within 0–2880 minutes",
      );
    }
  }
  return mergeIntervals(intervals);
}

function checkDate(date: string): LocalDate {
  try {
    return parseLocalDate(date);
  } catch {
    throw new ProfileError("INVALID_DATE", `${date} is not a valid date`);
  }
}

function checkDayMap(days: DayMap): Record<string, Interval[]> {
  const clean: Record<string, Interval[]> = {};
  for (const [date, intervals] of Object.entries(days)) {
    const merged = checkIntervals(intervals);
    if (merged.length > 0) clean[checkDate(date)] = merged;
  }
  return clean;
}

function withDay(days: DayMap, date: string, intervals: Interval[]): DayMap {
  const { [date]: _previous, ...rest } = days;
  return intervals.length > 0 ? { ...rest, [date]: intervals } : rest;
}

export function createProfile(input: {
  accountId: string;
  now: number;
}): Profile {
  return {
    accountId: input.accountId,
    templates: [],
    busyDays: {},
    exceptions: {},
    importedCalendars: [],
    createdAt: input.now,
    updatedAt: input.now,
  };
}

/** Replaces the profile's templates. */
export function setTemplates(
  profile: Profile,
  input: { templates: readonly BusyTemplate[]; now: number },
): Profile {
  try {
    validateTemplates(input.templates);
  } catch (error) {
    if (error instanceof RangeError) {
      throw new ProfileError("INVALID_TEMPLATE", error.message);
    }
    throw error;
  }
  return { ...profile, templates: input.templates, updatedAt: input.now };
}

/** Replaces one date's one-off busy time and template exceptions. */
export function setDay(
  profile: Profile,
  input: {
    date: string;
    busy: readonly Interval[];
    exceptions: readonly Interval[];
    now: number;
  },
): Profile {
  const date = checkDate(input.date);
  return {
    ...profile,
    busyDays: withDay(profile.busyDays, date, checkIntervals(input.busy)),
    exceptions: withDay(
      profile.exceptions,
      date,
      checkIntervals(input.exceptions),
    ),
    updatedAt: input.now,
  };
}

/** Adds an imported calendar, or replaces the one with the same id (a re-sync). */
export function setImportedCalendar(
  profile: Profile,
  input: { calendar: ImportedCalendar; now: number },
): Profile {
  const calendar: ImportedCalendar = {
    ...input.calendar,
    busy: checkDayMap(input.calendar.busy),
  };
  return {
    ...profile,
    importedCalendars: [
      ...profile.importedCalendars.filter((c) => c.id !== calendar.id),
      calendar,
    ],
    updatedAt: input.now,
  };
}

export function removeImportedCalendar(
  profile: Profile,
  input: { id: string; now: number },
): Profile {
  return {
    ...profile,
    importedCalendars: profile.importedCalendars.filter(
      (c) => c.id !== input.id,
    ),
    updatedAt: input.now,
  };
}

/**
 * What the profile says about each date from `from` to `to`, ready for the
 * engine. Having a profile covers the whole range: time not busy is free.
 * The day before `from` is included, without coverage, only with busy time
 * that runs past midnight into `from` (night shifts).
 */
export function availabilityFor(
  profile: Profile,
  from: LocalDate,
  to: LocalDate,
): Record<string, DayAvailability> {
  const fromTemplates = expandBusyTemplates(profile.templates, from, to);
  const busyOn = (date: string): Interval[] =>
    mergeIntervals([
      ...subtractIntervals(
        fromTemplates[date] ?? [],
        profile.exceptions[date] ?? [],
      ),
      ...(profile.busyDays[date] ?? []),
      ...profile.importedCalendars.flatMap((c) => c.busy[date] ?? []),
    ]);

  const days: Record<string, DayAvailability> = {};
  const spillDay = addDays(from, -1);
  const spill = busyOn(spillDay).filter((i) => i.end > MINUTES_PER_DAY);
  if (spill.length > 0) days[spillDay] = { coverage: [], busy: spill };
  for (const date of dateRange(from, to)) {
    days[date] = { coverage: [WHOLE_DAY], busy: busyOn(date) };
  }
  return days;
}
