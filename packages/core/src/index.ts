export {
  type AvailabilityWindow,
  type DayAvailability,
  DEFAULT_SETTINGS,
  type FindWindowsInput,
  findWindows,
  type MemberAvailability,
  type ScoreWeights,
  type WindowReason,
  type WindowSettings,
} from "./availability/find-windows";
export {
  clipIntervals,
  type Interval,
  intersectIntervals,
  mergeIntervals,
  subtractIntervals,
} from "./availability/interval";
export {
  addDays,
  dateRange,
  type LocalDate,
  parseLocalDate,
  weekdayOf,
} from "./availability/local-date";

/** Availability is never assumed: missing data is `unknown`, not `free`. */
export type AvailabilityState = "free" | "busy" | "unknown";
