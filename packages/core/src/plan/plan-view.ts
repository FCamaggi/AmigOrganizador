import { type DayLine, lineSegments } from "../availability/day-lines";
import type { AvailabilityWindow } from "../availability/find-windows";
import type { Interval } from "../availability/interval";
import type { LocalDate } from "../availability/local-date";
import type { CalendarInvite } from "../calendar/invite";
import { zonedTimeToUtc } from "../time/zoned";
import type { Plan } from "./plan";

const GRID_MINUTES = 15;

export type {
  DayLine,
  LineSegment,
  LineState,
} from "../availability/day-lines";

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
      ? lineSegments(
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
