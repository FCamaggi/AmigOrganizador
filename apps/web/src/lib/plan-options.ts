/** Choices offered when creating a plan. */
export const RANGES = [
  { key: "week", days: 7, label: "create.range.week" },
  { key: "twoWeeks", days: 14, label: "create.range.twoWeeks" },
  { key: "month", days: 30, label: "create.range.month" },
] as const;
export type RangeKey = (typeof RANGES)[number]["key"];

/** Minutes. */
export const DURATIONS = [60, 120, 180, 240] as const;

export const TIMEZONES = [
  "America/Santiago",
  "America/Punta_Arenas",
  "Pacific/Easter",
  "America/Argentina/Buenos_Aires",
  "America/Lima",
  "Europe/Madrid",
] as const;
export const DEFAULT_TIMEZONE = "America/Santiago";
