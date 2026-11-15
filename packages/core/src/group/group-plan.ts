import { type LocalDate, parseLocalDate } from "../availability/local-date";
import type { CalendarInvite } from "../calendar/invite";
import { zonedTimeToUtc } from "../time/zoned";
import type { Group } from "./group";

const MAX_TITLE_LENGTH = 80;
const GRID_MINUTES = 15;
const MAX_DURATION_MINUTES = 12 * 60;
const MINUTES_PER_DAY = 24 * 60;

export type GroupPlanStatus = "proposed" | "confirmed" | "cancelled";

/**
 * A plan that comes out of a group (ADR 0004): someone picks a good day from
 * the group view and proposes a slot; the proposer or the group owner
 * confirms it. Times are local minutes in the group's timezone.
 */
export interface GroupPlan {
  readonly id: string;
  readonly groupId: string;
  readonly title: string;
  readonly proposedBy: string;
  readonly date: LocalDate;
  readonly start: number;
  /** May pass 1440 (after midnight). */
  readonly end: number;
  readonly status: GroupPlanStatus;
  readonly createdAt: number;
  readonly confirmedAt: number | null;
}

export type GroupPlanErrorCode =
  | "INVALID_TITLE"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "INVALID_DURATION"
  | "NOT_A_MEMBER"
  | "NOT_ALLOWED"
  | "NOT_PROPOSED"
  | "ALREADY_CANCELLED"
  | "WRONG_GROUP";

/** A rule of the group plan was broken. `code` is stable; the UI maps it to copy. */
export class GroupPlanError extends Error {
  readonly code: GroupPlanErrorCode;

  constructor(code: GroupPlanErrorCode, message: string) {
    super(message);
    this.name = "GroupPlanError";
    this.code = code;
  }
}

export interface NewGroupPlan {
  readonly id: string;
  readonly accountId: string;
  readonly title: string;
  readonly date: string;
  readonly start: number;
  readonly durationMinutes: number;
  readonly now: number;
}

const onGrid = (minutes: number) =>
  Number.isInteger(minutes) && minutes % GRID_MINUTES === 0;

function assertMember(group: Group, accountId: string): void {
  if (!group.members.some((m) => m.accountId === accountId)) {
    throw new GroupPlanError("NOT_A_MEMBER", "not a member of this group");
  }
}

/** Only the proposer or the group owner may confirm or cancel. */
function assertCanDecide(plan: GroupPlan, group: Group, accountId: string) {
  if (plan.groupId !== group.id) {
    throw new GroupPlanError("WRONG_GROUP", "plan belongs to another group");
  }
  assertMember(group, accountId);
  const owner = group.members.find((m) => m.role === "owner");
  if (plan.proposedBy !== accountId && owner?.accountId !== accountId) {
    throw new GroupPlanError(
      "NOT_ALLOWED",
      "only the proposer or the group owner can do this",
    );
  }
}

export function proposeGroupPlan(group: Group, input: NewGroupPlan): GroupPlan {
  assertMember(group, input.accountId);
  const title = input.title.trim();
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    throw new GroupPlanError(
      "INVALID_TITLE",
      `title must be 1 to ${MAX_TITLE_LENGTH} characters`,
    );
  }
  let date: LocalDate;
  try {
    date = parseLocalDate(input.date);
  } catch {
    throw new GroupPlanError("INVALID_DATE", `${input.date} is not a date`);
  }
  if (
    !onGrid(input.start) ||
    input.start < 0 ||
    input.start >= MINUTES_PER_DAY
  ) {
    throw new GroupPlanError(
      "INVALID_TIME",
      "start must be within the day, in 15-minute steps",
    );
  }
  const duration = input.durationMinutes;
  if (
    !onGrid(duration) ||
    duration < GRID_MINUTES ||
    duration > MAX_DURATION_MINUTES
  ) {
    throw new GroupPlanError(
      "INVALID_DURATION",
      "duration must be 15 minutes to 12 hours, in 15-minute steps",
    );
  }
  return {
    id: input.id,
    groupId: group.id,
    title,
    proposedBy: input.accountId,
    date,
    start: input.start,
    end: input.start + duration,
    status: "proposed",
    createdAt: input.now,
    confirmedAt: null,
  };
}

export function confirmGroupPlan(
  plan: GroupPlan,
  group: Group,
  input: { accountId: string; now: number },
): GroupPlan {
  assertCanDecide(plan, group, input.accountId);
  if (plan.status !== "proposed") {
    throw new GroupPlanError("NOT_PROPOSED", `plan is ${plan.status}`);
  }
  return { ...plan, status: "confirmed", confirmedAt: input.now };
}

export function cancelGroupPlan(
  plan: GroupPlan,
  group: Group,
  input: { accountId: string },
): GroupPlan {
  assertCanDecide(plan, group, input.accountId);
  if (plan.status === "cancelled") {
    throw new GroupPlanError("ALREADY_CANCELLED", "plan is already cancelled");
  }
  return { ...plan, status: "cancelled" };
}

/** A plan as a calendar event, with UTC times from the group's timezone. */
export function groupPlanInvite(
  plan: GroupPlan,
  group: Group,
  url: string,
): CalendarInvite {
  return {
    uid: `${plan.id}@amigorganizador`,
    title: plan.title,
    start: zonedTimeToUtc(plan.date, plan.start, group.timezone),
    end: zonedTimeToUtc(plan.date, plan.end, group.timezone),
    url,
    description: `${group.name} · ${url}`,
  };
}

/**
 * The group's calendar feed (S4): its confirmed plans as invites, ready for
 * `buildIcsFeed`. Proposed and cancelled plans are left out, so a subscribed
 * calendar drops a plan once it is cancelled.
 */
export function groupFeed(
  group: Group,
  plans: readonly GroupPlan[],
  urlFor: (plan: GroupPlan) => string,
): { name: string; invites: CalendarInvite[] } {
  return {
    name: group.name,
    invites: plans
      .filter(
        (plan) => plan.groupId === group.id && plan.status === "confirmed",
      )
      .map((plan) => groupPlanInvite(plan, group, urlFor(plan))),
  };
}
