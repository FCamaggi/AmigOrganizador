import type { AvailabilityWindow } from "./find-windows";
import type { LocalDate } from "./local-date";

const GRID_MINUTES = 15;

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
