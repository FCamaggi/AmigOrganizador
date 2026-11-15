import { importIcsCalendar } from "@amigo/adapter-ics";
import type { ImportedCalendar } from "@amigo/core";

/** Reads an ICS link into an imported calendar (busy time only). */
export function fetchImportedCalendar(input: {
  id: string;
  name: string;
  url: string;
  /** The person's zone: floating times and all-day events are read in it. */
  timeZone: string;
}): Promise<ImportedCalendar> {
  return importIcsCalendar({ ...input, now: Date.now() });
}
