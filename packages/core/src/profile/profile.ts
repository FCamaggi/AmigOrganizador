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
import { utcToLocal, zonedTimeToUtc } from "../time/zoned";

const MINUTES_PER_DAY = 24 * 60;
const MAX_INTERVAL_END = 2 * MINUTES_PER_DAY;
const WHOLE_DAY: Interval = { start: 0, end: MINUTES_PER_DAY };

type DayMap = Readonly<Record<string, readonly Interval[]>>;

/** A span of absolute time, in UTC milliseconds. */
export interface UtcSpan {
  readonly start: number;
  readonly end: number;
}

/**
 * Busy time read from another calendar (ICS URL now; Google or Microsoft
 * later). Only busy spans are kept, as UTC instants, never event titles; each
 * group reads them in its own timezone.
 */
export interface ImportedCalendar {
  readonly id: string;
  /** A label the person gives it ("Trabajo"), not taken from the events. */
  readonly name: string;
  readonly busy: readonly UtcSpan[];
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
  /**
   * IANA zone the person's templates and one-off days are written in. Unset
   * on profiles saved before it existed: read it with `profileTimezone`.
   */
  readonly timezone?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type ProfileErrorCode =
  | "INVALID_TEMPLATE"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "INVALID_TIMEZONE";

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

function checkSpans(spans: readonly UtcSpan[]): UtcSpan[] {
  for (const span of spans) {
    if (
      !Number.isFinite(span.start) ||
      !Number.isFinite(span.end) ||
      span.start >= span.end
    ) {
      throw new ProfileError(
        "INVALID_TIME",
        "a busy span must end after it starts",
      );
    }
  }
  return [...spans].sort((a, b) => a.start - b.start);
}

/** Local busy intervals per date for UTC spans, split at local midnight. */
function spansToLocal(
  spans: readonly UtcSpan[],
  timeZone: string,
): Record<string, Interval[]> {
  const days: Record<string, Interval[]> = {};
  const add = (date: string, start: number, end: number) => {
    if (end <= start) return;
    days[date] = [...(days[date] ?? []), { start, end }];
  };
  for (const span of spans) {
    const start = utcToLocal(span.start, timeZone);
    const end = utcToLocal(span.end, timeZone);
    if (start.date === end.date) {
      add(start.date, start.minutes, end.minutes);
      continue;
    }
    add(start.date, start.minutes, MINUTES_PER_DAY);
    for (const date of dateRange(
      addDays(start.date, 1),
      addDays(end.date, -1),
    )) {
      add(date, 0, MINUTES_PER_DAY);
    }
    add(end.date, 0, end.minutes);
  }
  return days;
}

function withDay(days: DayMap, date: string, intervals: Interval[]): DayMap {
  const { [date]: _previous, ...rest } = days;
  return intervals.length > 0 ? { ...rest, [date]: intervals } : rest;
}

/** The zone of a profile that never chose one (S7: "el default Santiago"). */
export const DEFAULT_PROFILE_TIMEZONE = "America/Santiago";

/** The zone the profile's wall times are written in. */
export function profileTimezone(profile: Profile): string {
  return profile.timezone ?? DEFAULT_PROFILE_TIMEZONE;
}

/** The canonical IANA name ("america/santiago" -> "America/Santiago"), or null. */
function canonicalTimeZone(value: string): string | null {
  // Only IANA names with a region ("America/Santiago"), plus UTC.
  if (value !== "UTC" && !value.includes("/")) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: value,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** Sets the person's zone; must be a valid IANA zone. */
export function setTimezone(
  profile: Profile,
  input: { timezone: string; now: number },
): Profile {
  const timezone = canonicalTimeZone(input.timezone);
  if (!timezone) {
    throw new ProfileError("INVALID_TIMEZONE", "unknown time zone");
  }
  if (profile.timezone === timezone) return profile;
  return { ...profile, timezone, updatedAt: input.now };
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
    busy: checkSpans(input.calendar.busy),
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
 * Templates minus exceptions plus one-off busy time, per date from the day
 * before `from` to `to`, in the person's wall time (the day before carries
 * only template time that runs past midnight, as `expandBusyTemplates` gives).
 */
function wallBusy(
  profile: Profile,
  from: LocalDate,
  to: LocalDate,
): Record<string, Interval[]> {
  const fromTemplates = expandBusyTemplates(profile.templates, from, to);
  const days: Record<string, Interval[]> = {};
  for (const date of dateRange(addDays(from, -1), to)) {
    const busy = mergeIntervals([
      ...subtractIntervals(
        fromTemplates[date] ?? [],
        profile.exceptions[date] ?? [],
      ),
      ...(profile.busyDays[date] ?? []),
    ]);
    if (busy.length > 0) days[date] = busy;
  }
  return days;
}

/**
 * What the profile says about each date from `from` to `to`, ready for the
 * engine, in `timeZone` (the group's). Templates and one-off days are wall
 * time in the person's zone (`profileTimezone`): read as is when it is the
 * group's zone, else moved to the group's zone through UTC. Imported spans
 * are converted from UTC. Having a profile covers the whole range: time not
 * busy is free.
 * The day before `from` is included, without coverage, only with busy time
 * that runs past midnight into `from` (night shifts).
 */
export function availabilityFor(
  profile: Profile,
  from: LocalDate,
  to: LocalDate,
  timeZone: string,
): Record<string, DayAvailability> {
  const personZone = profileTimezone(profile);
  const importedSpans = profile.importedCalendars.flatMap((c) => c.busy);
  let wall: Record<string, Interval[]> = {};
  let spans: readonly UtcSpan[] = importedSpans;
  if (personZone === timeZone) {
    wall = wallBusy(profile, from, to);
  } else {
    // Zones are up to 26 hours apart (Pacific/Kiritimati to Etc/GMT+12):
    // two extra days on each side cover every pair.
    const moved = wallBusy(profile, addDays(from, -2), addDays(to, 2));
    spans = [
      ...importedSpans,
      ...Object.entries(moved).flatMap(([date, intervals]) =>
        intervals.map((i) => ({
          start: zonedTimeToUtc(date as LocalDate, i.start, personZone),
          end: zonedTimeToUtc(date as LocalDate, i.end, personZone),
        })),
      ),
    ];
  }
  const imported = spansToLocal(spans, timeZone);
  const busyOn = (date: string): Interval[] =>
    mergeIntervals([...(wall[date] ?? []), ...(imported[date] ?? [])]);

  const days: Record<string, DayAvailability> = {};
  const spillDay = addDays(from, -1);
  const spill = busyOn(spillDay).filter((i) => i.end > MINUTES_PER_DAY);
  if (spill.length > 0) days[spillDay] = { coverage: [], busy: spill };
  for (const date of dateRange(from, to)) {
    days[date] = { coverage: [WHOLE_DAY], busy: busyOn(date) };
  }
  return days;
}
