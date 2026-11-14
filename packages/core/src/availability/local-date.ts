declare const localDateBrand: unique symbol;

/**
 * A calendar date in the group's timezone, formatted `YYYY-MM-DD`.
 * Create one with `parseLocalDate`.
 */
export type LocalDate = string & { readonly [localDateBrand]: true };

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Validates a `YYYY-MM-DD` string that names a real calendar date. */
export function parseLocalDate(value: string): LocalDate {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (match) {
    const [, year, month, day] = match.map(Number) as [
      number,
      number,
      number,
      number,
    ];
    const utc = new Date(Date.UTC(year, month - 1, day));
    if (
      utc.getUTCFullYear() === year &&
      utc.getUTCMonth() === month - 1 &&
      utc.getUTCDate() === day
    ) {
      return value as LocalDate;
    }
  }
  throw new RangeError(`Invalid local date: ${JSON.stringify(value)}`);
}

function toUtcMs(date: LocalDate): number {
  const [year, month, day] = date.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10) as LocalDate;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: LocalDate): number {
  return new Date(toUtcMs(date)).getUTCDay();
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Every date from `from` to `to`, both included. Empty when `to < from`. */
export function dateRange(from: LocalDate, to: LocalDate): LocalDate[] {
  const dates: LocalDate[] = [];
  for (let ms = toUtcMs(from); ms <= toUtcMs(to); ms += DAY_MS) {
    dates.push(fromUtcMs(ms));
  }
  return dates;
}
