import { importIcsCalendar } from "@amigo/adapter-ics";
import type { ImportedCalendar } from "@amigo/core";
import { DEFAULT_TIMEZONE } from "@/lib/plan-options";

/** Reads an ICS link into an imported calendar (busy time only). */
export function fetchImportedCalendar(input: {
  id: string;
  name: string;
  url: string;
}): Promise<ImportedCalendar> {
  return importIcsCalendar({
    ...input,
    // Floating times and all-day events: the person's zone (Chile for now).
    timeZone: DEFAULT_TIMEZONE,
    now: Date.now(),
  });
}
