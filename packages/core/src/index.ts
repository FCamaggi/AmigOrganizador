export type { Interval } from "./availability/interval";
export { mergeIntervals } from "./availability/interval";

/** Availability is never assumed: missing data is `unknown`, not `free`. */
export type AvailabilityState = "free" | "busy" | "unknown";
