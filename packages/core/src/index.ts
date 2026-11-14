export {
  type BuildAnswerInput,
  type BusyTemplate,
  buildAnswerDays,
  expandBusyTemplates,
  type ShiftKind,
  shiftCycle,
  type WeeklyBlock,
  workweek,
} from "./availability/busy-templates";
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
export {
  buildGoogleCalendarUrl,
  buildIcs,
  type CalendarInvite,
} from "./calendar/invite";
export {
  answerPlan,
  type ConfirmedSlot,
  cancelPlan,
  confirmPlan,
  createPlan,
  joinPlan,
  type NewPlan,
  type Participant,
  type ParticipantAnswer,
  type Plan,
  PlanError,
  type PlanErrorCode,
  type PlanInputMode,
  type PlanStatus,
  suggestOptions,
} from "./plan/plan";
export type { PlanRepository } from "./plan/plan-repository";
