import type { CalendarSource } from "./calendar-source-repository";
import { type ImportedCalendar, setImportedCalendar } from "./profile";
import type { ProfileRepository } from "./profile-repository";

export interface ResyncCalendarsInput {
  /** Every stored source (`CalendarSourceRepository.listAll`). */
  readonly sources: readonly CalendarSource[];
  readonly profiles: ProfileRepository;
  /** Drops a source whose calendar is no longer in the profile. */
  readonly deleteSource: (
    accountId: string,
    calendarId: string,
  ) => Promise<void>;
  /** Reads the calendar again; throws when it can't. */
  readonly fetchCalendar: (input: {
    id: string;
    name: string;
    url: string;
  }) => Promise<ImportedCalendar>;
  readonly now: () => number;
  /** Told about each failure; must not log the source (its URL is a secret). */
  readonly onFailure?: (error: unknown) => void;
  /** Accounts synced at the same time; one account's sources run one by one. */
  readonly concurrency?: number;
}

/** Counts only: never URLs or account ids. */
export interface ResyncReport {
  readonly synced: number;
  readonly failed: number;
  readonly orphaned: number;
}

/** Re-reads every imported calendar and stores its fresh busy time. */
export async function resyncCalendars(
  input: ResyncCalendarsInput,
): Promise<ResyncReport> {
  const counts = { synced: 0, failed: 0, orphaned: 0 };
  const byAccount = new Map<string, CalendarSource[]>();
  for (const source of input.sources) {
    const list = byAccount.get(source.accountId) ?? [];
    list.push(source);
    byAccount.set(source.accountId, list);
  }
  const queue = [...byAccount.values()];
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      // One account at a time per worker: two saves of the same profile
      // never interleave.
      for (const source of next) counts[await resyncOne(input, source)]++;
    }
  };
  const workers = Math.max(1, Math.min(input.concurrency ?? 4, queue.length));
  await Promise.all(Array.from({ length: workers }, worker));
  return counts;
}

async function resyncOne(
  input: ResyncCalendarsInput,
  source: CalendarSource,
): Promise<keyof ResyncReport> {
  try {
    return await resyncSource(input, source);
  } catch (error) {
    input.onFailure?.(error);
    return "failed";
  }
}

async function resyncSource(
  input: ResyncCalendarsInput,
  source: CalendarSource,
): Promise<keyof ResyncReport> {
  const before = await input.profiles.findByAccount(source.accountId);
  const known = before?.importedCalendars.find(
    (c) => c.id === source.calendarId,
  );
  if (!known) {
    await input.deleteSource(source.accountId, source.calendarId);
    return "orphaned";
  }
  const calendar = await input.fetchCalendar({
    id: known.id,
    name: known.name,
    url: source.url,
  });
  // Read again: the person may have edited or removed it meanwhile.
  const current = await input.profiles.findByAccount(source.accountId);
  const still = current?.importedCalendars.find((c) => c.id === known.id);
  if (!current || !still) {
    await input.deleteSource(source.accountId, source.calendarId);
    return "orphaned";
  }
  const now = input.now();
  await input.profiles.save(
    setImportedCalendar(current, {
      calendar: { ...calendar, id: still.id, name: still.name, syncedAt: now },
      now,
    }),
  );
  return "synced";
}
