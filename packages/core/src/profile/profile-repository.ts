import type { Profile } from "./profile";

/**
 * Port for storing schedules (`Profile`s), several per account, keyed by
 * account and `scheduleId(profile)` (ADR 0004 amendment).
 */
export interface ProfileRepository {
  /** Every schedule of the account, oldest first; empty when none. */
  listForAccount(accountId: string): Promise<Profile[]>;
  /** Every schedule of several accounts (a group's members). */
  listForAccounts(accountIds: readonly string[]): Promise<Profile[]>;
  /** Inserts or replaces the schedule with the same account and id. */
  save(profile: Profile): Promise<void>;
  delete(accountId: string, scheduleId: string): Promise<void>;
}
