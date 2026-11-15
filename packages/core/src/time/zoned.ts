import type { LocalDate } from "../availability/local-date";

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Throws `RangeError` for an unknown IANA zone (from `Intl`). */
function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The wall-clock time in `timeZone` at `utcMs`, read back as if it were UTC. */
function wallClockAsUtc(utcMs: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(utcMs)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
}

const offsetAt = (utcMs: number, timeZone: string) =>
  wallClockAsUtc(utcMs, timeZone) - utcMs;

const DAY_MS = 86_400_000;

/**
 * The UTC instant of `minutes` after local midnight of `date` in `timeZone`.
 * Minutes may pass 1440 (the next day). A time repeated when clocks fall
 * back resolves to its first occurrence; a time skipped when clocks spring
 * forward moves forward with the clock change.
 */
export function zonedTimeToUtc(
  date: LocalDate,
  minutes: number,
  timeZone: string,
): number {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const wallClock = Date.UTC(year, month - 1, day) + minutes * 60_000;
  const before = offsetAt(wallClock - DAY_MS, timeZone);
  const after = offsetAt(wallClock + DAY_MS, timeZone);
  const matches = [...new Set([before, after])]
    .map((offset) => wallClock - offset)
    .filter((instant) => wallClockAsUtc(instant, timeZone) === wallClock);
  if (matches.length > 0) return Math.min(...matches);
  // In a spring-forward gap: use the offset in force before the jump.
  return wallClock - before;
}

/** Today's local date in `timeZone` at the instant `now`. */
export function todayIn(timeZone: string, now: number): LocalDate {
  return new Date(wallClockAsUtc(now, timeZone))
    .toISOString()
    .slice(0, 10) as LocalDate;
}

/** The local date and minutes after local midnight of a UTC instant. */
export function utcToLocal(
  utcMs: number,
  timeZone: string,
): { date: LocalDate; minutes: number } {
  const wall = wallClockAsUtc(utcMs, timeZone);
  const date = new Date(wall).toISOString().slice(0, 10) as LocalDate;
  const midnight = Date.parse(`${date}T00:00:00Z`);
  return { date, minutes: Math.round((wall - midnight) / 60_000) };
}
