import type { Person } from "./person";

/** Port for the person behind an account: name and schedule choices. */
export interface PersonRepository {
  findByAccount(accountId: string): Promise<Person | null>;
  /** People of several accounts; missing ones are left out. */
  findByAccounts(accountIds: readonly string[]): Promise<Person[]>;
  save(person: Person): Promise<void>;
}
