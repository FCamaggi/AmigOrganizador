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
export type {
  DayLine,
  LineSegment,
  LineState,
} from "./availability/day-lines";
export { slotFromOption } from "./availability/slot";
export {
  buildGoogleCalendarUrl,
  buildIcs,
  buildIcsFeed,
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
export {
  cancelGroupPlan,
  confirmGroupPlan,
  type GroupPlan,
  GroupPlanError,
  type GroupPlanErrorCode,
  type GroupPlanStatus,
  groupFeed,
  groupPlanInvite,
  type NewGroupPlan,
  proposeGroupPlan,
} from "./group/group-plan";
export type { GroupPlanRepository } from "./group/group-plan-repository";
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
  MAX_SETUP_SECONDS,
  type PlanEvent,
  type ProductEvent,
  type ProductEventKind,
  type ProfileCreatedEvent,
  planEvent,
  profileCreatedEvent,
} from "./metrics/product-event";
export type { ProductEventRepository } from "./metrics/product-event-repository";
export type {
  CalendarSource,
  CalendarSourceRepository,
} from "./profile/calendar-source-repository";
export {
  chooseScheduleForGroup,
  createPerson,
  createSchedule,
  DEFAULT_SCHEDULE_ID,
  DEFAULT_SCHEDULE_NAME,
  defaultSchedule,
  duplicateSchedule,
  groupSchedules,
  type Person,
  PersonError,
  type PersonErrorCode,
  removeSchedule,
  renamePerson,
  renameSchedule,
  scheduleForGroup,
  scheduleId,
  scheduleName,
  setDefaultSchedule,
} from "./profile/person";
export type { PersonRepository } from "./profile/person-repository";
export {
  availabilityFor,
  createProfile,
  DEFAULT_PROFILE_TIMEZONE,
  type ImportedCalendar,
  type Profile,
  ProfileError,
  type ProfileErrorCode,
  profileTimezone,
  removeImportedCalendar,
  setDay,
  setImportedCalendar,
  setTemplates,
  setTimezone,
  type UtcSpan,
} from "./profile/profile";
export type { ProfileRepository } from "./profile/profile-repository";
export {
  type ResyncCalendarsInput,
  type ResyncReport,
  resyncCalendars,
} from "./profile/resync-calendars";
export { todayIn, utcToLocal, zonedTimeToUtc } from "./time/zoned";
