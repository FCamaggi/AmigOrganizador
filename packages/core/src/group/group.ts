const MAX_NAME_LENGTH = 60;

export type GroupRole = "owner" | "member";

export interface GroupMember {
  readonly accountId: string;
  readonly displayName: string;
  readonly role: GroupRole;
  readonly joinedAt: number;
}

/**
 * A persistent friend group (ADR 0004). Each member's availability comes from
 * their own profile; the group compares them. `inviteCode` is the secret in
 * the invite link (ADR 0003): adapters generate it with at least 128 bits of
 * randomness, separate from `id` so it can be rotated later.
 */
export interface Group {
  readonly id: string;
  readonly inviteCode: string;
  readonly name: string;
  /** IANA timezone the group's days and times are computed in. */
  readonly timezone: string;
  readonly createdAt: number;
  /** In join order; exactly one `owner`. */
  readonly members: readonly GroupMember[];
}

export type GroupErrorCode =
  | "INVALID_NAME"
  | "INVALID_TIMEZONE"
  | "NOT_A_MEMBER"
  | "NOT_OWNER";

/** A rule of the group was broken. `code` is stable; the UI maps it to copy. */
export class GroupError extends Error {
  readonly code: GroupErrorCode;

  constructor(code: GroupErrorCode, message: string) {
    super(message);
    this.name = "GroupError";
    this.code = code;
  }
}

export interface NewGroup {
  readonly id: string;
  readonly inviteCode: string;
  readonly name: string;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly timezone: string;
  readonly now: number;
}

function cleanName(value: string): string {
  const name = value.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    throw new GroupError(
      "INVALID_NAME",
      `must be 1 to ${MAX_NAME_LENGTH} characters`,
    );
  }
  return name;
}

function checkTimezone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new GroupError("INVALID_TIMEZONE", `unknown timezone ${timeZone}`);
  }
  return timeZone;
}

function memberOf(group: Group, accountId: string): GroupMember {
  const member = group.members.find((m) => m.accountId === accountId);
  if (!member) {
    throw new GroupError("NOT_A_MEMBER", "not a member of this group");
  }
  return member;
}

export function createGroup(input: NewGroup): Group {
  const name = cleanName(input.name);
  const ownerName = cleanName(input.ownerName);
  return {
    id: input.id,
    inviteCode: input.inviteCode,
    name,
    timezone: checkTimezone(input.timezone),
    createdAt: input.now,
    members: [
      {
        accountId: input.ownerId,
        displayName: ownerName,
        role: "owner",
        joinedAt: input.now,
      },
    ],
  };
}

/** Adds an account through the invite link. Joining twice returns the same group. */
export function joinGroup(
  group: Group,
  input: { accountId: string; displayName: string; now: number },
): Group {
  if (group.members.some((m) => m.accountId === input.accountId)) {
    return group;
  }
  return {
    ...group,
    members: [
      ...group.members,
      {
        accountId: input.accountId,
        displayName: cleanName(input.displayName),
        role: "member",
        joinedAt: input.now,
      },
    ],
  };
}

/**
 * Removes a member. When the owner leaves, the longest-standing member
 * becomes owner. Returns `null` when nobody is left, so the adapter can
 * delete the group.
 */
export function leaveGroup(
  group: Group,
  input: { accountId: string },
): Group | null {
  const leaving = memberOf(group, input.accountId);
  const rest = group.members.filter((m) => m.accountId !== input.accountId);
  const [first, ...others] = rest;
  if (!first) return null;
  if (leaving.role !== "owner") return { ...group, members: rest };
  return {
    ...group,
    members: [{ ...first, role: "owner" }, ...others],
  };
}

/** The owner renames the group or changes its timezone. */
export function updateGroup(
  group: Group,
  input: { accountId: string; name?: string; timezone?: string },
): Group {
  if (memberOf(group, input.accountId).role !== "owner") {
    throw new GroupError("NOT_OWNER", "only the owner can do this");
  }
  return {
    ...group,
    name: input.name === undefined ? group.name : cleanName(input.name),
    timezone:
      input.timezone === undefined
        ? group.timezone
        : checkTimezone(input.timezone),
  };
}

/** Updates a member's display name in the group (S4 of profile-editor-v2). */
export function renameMember(
  group: Group,
  input: { accountId: string; displayName: string },
): Group {
  memberOf(group, input.accountId);
  const displayName = cleanName(input.displayName);
  return {
    ...group,
    members: group.members.map((member) =>
      member.accountId === input.accountId
        ? { ...member, displayName }
        : member,
    ),
  };
}
