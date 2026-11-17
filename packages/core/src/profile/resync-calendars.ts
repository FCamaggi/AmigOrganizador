import type { CalendarSource } from "./calendar-source-repository";
import {
  type ImportedCalendar,
  type Profile,
  profileTimezone,
  setImportedCalendar,
} from "./profile";
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
    /** The person's zone, for floating times and all-day events. */
    timeZone: string;
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
  const carrying = (schedules: readonly Profile[]) =>
    schedules.flatMap((schedule) => {
      const calendar = schedule.importedCalendars.find(
        (c) => c.id === source.calendarId,
      );
      return calendar ? [{ schedule, calendar }] : [];
    });
  // A duplicated schedule keeps the calendar id, so one link can feed several.
  const initial = carrying(
    await input.profiles.listForAccount(source.accountId),
  );
  if (initial.length === 0) {
    await input.deleteSource(source.accountId, source.calendarId);
    return "orphaned";
  }
  const byZone = new Map<string, ImportedCalendar>();
  const readInZone = async (
    calendar: ImportedCalendar,
    timeZone: string,
  ): Promise<ImportedCalendar> => {
    const cached = byZone.get(timeZone);
    if (cached) return cached;
    const fetched = await input.fetchCalendar({
      id: calendar.id,
      name: calendar.name,
      url: source.url,
      timeZone,
    });
    byZone.set(timeZone, fetched);
    return fetched;
  };
  for (const { schedule, calendar } of initial) {
    await readInZone(calendar, profileTimezone(schedule));
  }
  // Read again: the person may have edited or removed it meanwhile.
  const current = carrying(
    await input.profiles.listForAccount(source.accountId),
  );
  if (current.length === 0) {
    await input.deleteSource(source.accountId, source.calendarId);
    return "orphaned";
  }
  const now = input.now();
  for (const { schedule, calendar: still } of current) {
    const calendar = await readInZone(still, profileTimezone(schedule));
    await input.profiles.save(
      setImportedCalendar(schedule, {
        calendar: {
          ...calendar,
          id: still.id,
          name: still.name,
          syncedAt: now,
        },
        now,
      }),
    );
  }
  return "synced";
}
