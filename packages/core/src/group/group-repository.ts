import type { Group } from "./group";

/**
 * Port for storing groups. Adapters (in memory now, Postgres on Supabase
 * later) implement it; the domain never imports an adapter.
 */
export interface GroupRepository {
  findById(id: string): Promise<Group | null>;
  /** The group an invite link points to. */
  findByInviteCode(inviteCode: string): Promise<Group | null>;
  /** Groups the account belongs to, most recently joined first. */
  listForAccount(accountId: string): Promise<Group[]>;
  /** Inserts or replaces the group with the same id. */
  save(group: Group): Promise<void>;
  /** Removes a group (after its last member left). */
  delete(id: string): Promise<void>;
}
