import type { Profile } from "./profile";

/** Port for storing availability profiles, one per account. */
export interface ProfileRepository {
  findByAccount(accountId: string): Promise<Profile | null>;
  /** Profiles of several accounts (a group's members); missing ones are left out. */
  findByAccounts(accountIds: readonly string[]): Promise<Profile[]>;
  /** Inserts or replaces the profile of `profile.accountId`. */
  save(profile: Profile): Promise<void>;
}
