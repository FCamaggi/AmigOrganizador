import {
  type AvailabilityWindow,
  type DayAvailability,
  DEFAULT_SETTINGS,
  findWindows,
  type WindowSettings,
} from "../availability/find-windows";
import {
  addDays,
  dateRange,
  type LocalDate,
  parseLocalDate,
} from "../availability/local-date";

const MAX_TITLE_LENGTH = 80;
const MAX_NAME_LENGTH = 60;
const MAX_RANGE_DAYS = 60;
const GRID_MINUTES = 15;
const MAX_DURATION_MINUTES = 12 * 60;
const MINUTES_PER_DAY = 24 * 60;

export type PlanStatus = "open" | "confirmed" | "cancelled";

/** How participants answer (S3): mark busy time (default) or free time. */
export type PlanInputMode = "busy" | "free";
const INPUT_MODES: readonly PlanInputMode[] = ["busy", "free"];

export interface ParticipantAnswer {
  /** Keyed by local date; may include the day before `from` (overnight spill). */
  readonly days: Readonly<Record<string, DayAvailability>>;
  readonly answeredAt: number;
}

export interface Participant {
  readonly accountId: string;
  readonly displayName: string;
  readonly joinedAt: number;
  /** `null` until they answer: their availability is unknown, never free. */
  readonly answer: ParticipantAnswer | null;
}

export interface ConfirmedSlot {
  readonly date: LocalDate;
  /** Minutes from local midnight; `end` may pass 1440 (after midnight). */
  readonly start: number;
  readonly end: number;
  readonly confirmedAt: number;
}

/**
 * A proposal to meet. Its id doubles as the secret in the share link, so the
 * adapter that creates it must use an unguessable value (ADR 0003).
 */
export interface Plan {
  readonly id: string;
  readonly title: string;
  readonly organizerId: string;
  readonly from: LocalDate;
  readonly to: LocalDate;
  readonly durationMinutes: number;
  /** IANA timezone the local dates and minutes refer to. */
  readonly timezone: string;
  readonly inputMode: PlanInputMode;
  readonly status: PlanStatus;
  readonly createdAt: number;
  readonly participants: readonly Participant[];
  readonly confirmed: ConfirmedSlot | null;
}

export type PlanErrorCode =
  | "INVALID_TITLE"
  | "INVALID_NAME"
  | "INVALID_RANGE"
  | "INVALID_DURATION"
  | "INVALID_INPUT_MODE"
  | "INVALID_TIME"
  | "DATE_OUT_OF_RANGE"
  | "PLAN_NOT_OPEN"
  | "NOT_A_PARTICIPANT"
  | "NOT_ORGANIZER";

/** A rule of the plan was broken. `code` is stable; the UI maps it to copy. */
export class PlanError extends Error {
  readonly code: PlanErrorCode;

  constructor(code: PlanErrorCode, message: string) {
    super(message);
    this.name = "PlanError";
    this.code = code;
  }
}

export interface NewPlan {
  readonly id: string;
  readonly title: string;
  readonly organizerId: string;
  readonly organizerName: string;
  readonly from: LocalDate;
  readonly to: LocalDate;
  readonly durationMinutes: number;
  readonly timezone: string;
  /** Defaults to `busy`. */
  readonly inputMode?: PlanInputMode;
  readonly now: number;
}

function cleanText(value: string, max: number, code: PlanErrorCode): string {
  const text = value.trim();
  if (text.length === 0 || text.length > max) {
    throw new PlanError(code, `must be 1 to ${max} characters`);
  }
  return text;
}

const onGrid = (minutes: number) =>
  Number.isInteger(minutes) && minutes % GRID_MINUTES === 0;

function assertOpen(plan: Plan): void {
  if (plan.status !== "open") {
    throw new PlanError("PLAN_NOT_OPEN", `plan is ${plan.status}`);
  }
}

function assertOrganizer(plan: Plan, accountId: string): void {
  if (plan.organizerId !== accountId) {
    throw new PlanError("NOT_ORGANIZER", "only the organizer can do this");
  }
}

function inRange(plan: Plan, date: string, allowSpillDay: boolean): boolean {
  let parsed: LocalDate;
  try {
    parsed = parseLocalDate(date);
  } catch {
    return false;
  }
  const first = allowSpillDay ? addDays(plan.from, -1) : plan.from;
  return parsed >= first && parsed <= plan.to;
}

export function createPlan(input: NewPlan): Plan {
  const title = cleanText(input.title, MAX_TITLE_LENGTH, "INVALID_TITLE");
  const organizerName = cleanText(
    input.organizerName,
    MAX_NAME_LENGTH,
    "INVALID_NAME",
  );
  const days = dateRange(input.from, input.to).length;
  if (days === 0 || days > MAX_RANGE_DAYS) {
    throw new PlanError(
      "INVALID_RANGE",
      `range must cover 1 to ${MAX_RANGE_DAYS} days`,
    );
  }
  const { durationMinutes } = input;
  if (
    !onGrid(durationMinutes) ||
    durationMinutes < GRID_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    throw new PlanError(
      "INVALID_DURATION",
      "duration must be 15 minutes to 12 hours, in 15-minute steps",
    );
  }

  const inputMode = input.inputMode ?? "busy";
  if (!INPUT_MODES.includes(inputMode)) {
    throw new PlanError(
      "INVALID_INPUT_MODE",
      "input mode must be busy or free",
    );
  }

  return {
    id: input.id,
    title,
    organizerId: input.organizerId,
    from: input.from,
    to: input.to,
    durationMinutes,
    timezone: input.timezone,
    inputMode,
    status: "open",
    createdAt: input.now,
    participants: [
      {
        accountId: input.organizerId,
        displayName: organizerName,
        joinedAt: input.now,
        answer: null,
      },
    ],
    confirmed: null,
  };
}

/** Adds an account to an open plan. Joining twice returns the same plan. */
export function joinPlan(
  plan: Plan,
  input: { accountId: string; displayName: string; now: number },
): Plan {
  assertOpen(plan);
  if (plan.participants.some((p) => p.accountId === input.accountId)) {
    return plan;
  }
  const displayName = cleanText(
    input.displayName,
    MAX_NAME_LENGTH,
    "INVALID_NAME",
  );
  return {
    ...plan,
    participants: [
      ...plan.participants,
      {
        accountId: input.accountId,
        displayName,
        joinedAt: input.now,
        answer: null,
      },
    ],
  };
}

function assertValidDays(
  plan: Plan,
  days: Readonly<Record<string, DayAvailability>>,
): void {
  for (const [date, day] of Object.entries(days)) {
    if (!inRange(plan, date, true)) {
      throw new PlanError("DATE_OUT_OF_RANGE", `${date} is outside the plan`);
    }
    for (const interval of [...day.coverage, ...day.busy]) {
      const valid =
        Number.isFinite(interval.start) &&
        Number.isFinite(interval.end) &&
        interval.start >= 0 &&
        interval.start <= interval.end &&
        interval.end <= 2 * MINUTES_PER_DAY;
      if (!valid) {
        throw new PlanError(
          "INVALID_TIME",
          "intervals must be between 0 and 2880 minutes, with start before end",
        );
      }
    }
  }
}

/** Stores (or replaces) a participant's availability. */
export function answerPlan(
  plan: Plan,
  input: {
    accountId: string;
    days: Readonly<Record<string, DayAvailability>>;
    now: number;
  },
): Plan {
  assertOpen(plan);
  if (!plan.participants.some((p) => p.accountId === input.accountId)) {
    throw new PlanError("NOT_A_PARTICIPANT", "join the plan before answering");
  }
  assertValidDays(plan, input.days);
  return {
    ...plan,
    participants: plan.participants.map((participant) =>
      participant.accountId === input.accountId
        ? {
            ...participant,
            answer: { days: input.days, answeredAt: input.now },
          }
        : participant,
    ),
  };
}

/** Ranked options at least as long as the plan. See AVAILABILITY_ENGINE.md. */
export function suggestOptions(
  plan: Plan,
  settings: WindowSettings = DEFAULT_SETTINGS,
): AvailabilityWindow[] {
  return findWindows({
    from: plan.from,
    to: plan.to,
    members: plan.participants.map((participant) => ({
      memberId: participant.accountId,
      days: participant.answer?.days ?? {},
    })),
    settings: { ...settings, minimumBlockMinutes: plan.durationMinutes },
  });
}

/** The organizer picks the final date and start time. */
export function confirmPlan(
  plan: Plan,
  input: { accountId: string; date: LocalDate; start: number; now: number },
): Plan {
  assertOrganizer(plan, input.accountId);
  assertOpen(plan);
  if (!inRange(plan, input.date, false)) {
    throw new PlanError(
      "DATE_OUT_OF_RANGE",
      `${input.date} is outside the plan`,
    );
  }
  if (
    !onGrid(input.start) ||
    input.start < 0 ||
    input.start >= MINUTES_PER_DAY
  ) {
    throw new PlanError(
      "INVALID_TIME",
      "start must be within the day, in 15-minute steps",
    );
  }
  return {
    ...plan,
    status: "confirmed",
    confirmed: {
      date: input.date,
      start: input.start,
      end: input.start + plan.durationMinutes,
      confirmedAt: input.now,
    },
  };
}

export function cancelPlan(plan: Plan, input: { accountId: string }): Plan {
  assertOrganizer(plan, input.accountId);
  assertOpen(plan);
  return { ...plan, status: "cancelled" };
}
