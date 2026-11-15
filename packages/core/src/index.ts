export {
  type BuildAnswerInput,
  type BusyTemplate,
  buildAnswerDays,
  expandBusyTemplates,
  type ShiftKind,
  shiftCycle,
  validateTemplates,
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
  createGroup,
  type Group,
  GroupError,
  type GroupErrorCode,
  type GroupMember,
  type GroupRole,
  joinGroup,
  leaveGroup,
  type NewGroup,
  updateGroup,
} from "./group/group";
export type { GroupRepository } from "./group/group-repository";
export {
  DEFAULT_OUTLOOK_DAYS,
  type GroupOutlook,
  groupDayLines,
  groupOutlook,
  type OutlookMember,
  outlookRange,
} from "./group/outlook";
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
export {
  type DayLine,
  dayLines,
  inviteFor,
  type LineSegment,
  type LineState,
  slotFromOption,
} from "./plan/plan-view";
export {
  availabilityFor,
  createProfile,
  type ImportedCalendar,
  type Profile,
  ProfileError,
  type ProfileErrorCode,
  removeImportedCalendar,
  setDay,
  setImportedCalendar,
  setTemplates,
  type UtcSpan,
} from "./profile/profile";
export type { ProfileRepository } from "./profile/profile-repository";
export { todayIn, utcToLocal, zonedTimeToUtc } from "./time/zoned";
