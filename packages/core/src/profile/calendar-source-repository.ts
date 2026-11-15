/**
 * Where an imported calendar comes from, kept apart from the profile because
 * the link is a secret (e.g. Google's "secret address"): profiles are read by
 * every group a person belongs to; sources are read only to re-sync.
 */
export interface CalendarSource {
  readonly accountId: string;
  /** The `ImportedCalendar.id` it fills. */
  readonly calendarId: string;
  readonly url: string;
  readonly createdAt: number;
}

/** Port for storing calendar sources. Adapters must never log `url`. */
export interface CalendarSourceRepository {
  listForAccount(accountId: string): Promise<CalendarSource[]>;
  /** Every account's sources, oldest first (the periodic re-sync). */
  listAll(): Promise<CalendarSource[]>;
  /** Inserts or replaces the source with the same account and calendar id. */
  save(source: CalendarSource): Promise<void>;
  delete(accountId: string, calendarId: string): Promise<void>;
}
