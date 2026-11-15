import {
  type AvailabilityWindow,
  intervalsFor,
  type MemberAvailability,
} from "../availability/find-windows";
import {
  clipIntervals,
  type Interval,
  intersectIntervals,
  subtractIntervals,
} from "../availability/interval";
import type { LocalDate } from "../availability/local-date";
import type { CalendarInvite } from "../calendar/invite";
import { zonedTimeToUtc } from "../time/zoned";
import type { Plan } from "./plan";

const GRID_MINUTES = 15;

export type LineState = "free" | "busy" | "unknown";

export interface LineSegment {
  readonly start: number;
  readonly end: number;
  readonly state: LineState;
}

/** One participant's day, drawn as a line: what we know, minute by minute. */
export interface DayLine {
  readonly accountId: string;
  readonly displayName: string;
  readonly answered: boolean;
  /** Ordered, contiguous segments covering the requested span. */
  readonly segments: readonly LineSegment[];
}

function segmentsFor(
  member: MemberAvailability,
  date: LocalDate,
  span: Interval,
): LineSegment[] {
  const known = clipIntervals(
    intervalsFor(member, date, (day) => day.coverage),
    span,
  );
  const busy = intersectIntervals(
    clipIntervals(
      intervalsFor(member, date, (day) => day.busy),
      span,
    ),
    known,
  );
  const tagged: LineSegment[] = [
    ...subtractIntervals(known, busy).map((i) => ({
      ...i,
      state: "free" as const,
    })),
    ...busy.map((i) => ({ ...i, state: "busy" as const })),
    ...subtractIntervals([span], known).map((i) => ({
      ...i,
      state: "unknown" as const,
    })),
  ].toSorted((a, b) => a.start - b.start);

  const merged: LineSegment[] = [];
  for (const segment of tagged) {
    const last = merged.at(-1);
    if (last && last.state === segment.state && last.end === segment.start) {
      merged[merged.length - 1] = { ...last, end: segment.end };
    } else {
      merged.push(segment);
    }
  }
  return merged;
}

/**
 * Each participant's availability on `date` within `span`, in join order.
 * Someone who has not answered is one unknown segment: never free.
 */
export function dayLines(
  plan: Plan,
  date: LocalDate,
  span: Interval,
): DayLine[] {
  return plan.participants.map((participant) => ({
    accountId: participant.accountId,
    displayName: participant.displayName,
    answered: participant.answer !== null,
    segments: participant.answer
      ? segmentsFor(
          { memberId: participant.accountId, days: participant.answer.days },
          date,
          span,
        )
      : [{ ...span, state: "unknown" }],
  }));
}

/** Evenings rank best in the engine, so a confirmed slot leans to 19:00. */
const PREFERRED_START = 19 * 60;

/**
 * The slot the organizer confirms for an option: as close to 19:00 as the
 * window allows, on the 15-minute grid, fitting `durationMinutes`.
 */
export function slotFromOption(
  window: AvailabilityWindow,
  durationMinutes: number,
): { date: LocalDate; start: number } {
  const earliest = Math.ceil(window.start / GRID_MINUTES) * GRID_MINUTES;
  const latest = Math.max(
    earliest,
    Math.floor((window.end - durationMinutes) / GRID_MINUTES) * GRID_MINUTES,
  );
  return {
    date: window.date,
    start: Math.min(Math.max(PREFERRED_START, earliest), latest),
  };
}

/** Calendar invite for a confirmed plan, or `null` while it is not confirmed. */
export function inviteFor(plan: Plan, url: string): CalendarInvite | null {
  const slot = plan.confirmed;
  if (plan.status !== "confirmed" || !slot) return null;
  return {
    uid: `${plan.id}@amigorganizador`,
    title: plan.title,
    start: zonedTimeToUtc(slot.date, slot.start, plan.timezone),
    end: zonedTimeToUtc(slot.date, slot.end, plan.timezone),
    url,
    description: url,
  };
}
