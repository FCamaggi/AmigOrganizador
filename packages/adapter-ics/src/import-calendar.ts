import type { ImportedCalendar } from "@amigo/core";
import { fetchIcs, type Transport } from "./fetch-ics";
import { parseIcsBusy } from "./parse-ics";

/** How far back and ahead an import reads, in days. */
const PAST_DAYS = 1;
const FUTURE_DAYS = 120;
const DAY_MS = 86_400_000;

/**
 * Downloads a calendar link and turns it into an imported calendar for the
 * person's profile: busy spans only, from yesterday to about four months
 * ahead. Re-running it with the same `id` is a re-sync.
 */
export async function importIcsCalendar(
  input: {
    id: string;
    name: string;
    url: string;
    timeZone: string;
    now: number;
  },
  transport?: Transport,
): Promise<ImportedCalendar> {
  const ics = await fetchIcs(input.url, {}, transport);
  const busy = parseIcsBusy(ics, {
    from: input.now - PAST_DAYS * DAY_MS,
    to: input.now + FUTURE_DAYS * DAY_MS,
    timeZone: input.timeZone,
  });
  return { id: input.id, name: input.name, busy, syncedAt: input.now };
}
