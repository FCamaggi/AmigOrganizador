# Group (domain rules)

Implementation: `packages/core/src/group/group.ts`; storage port:
`packages/core/src/group/group-repository.ts`. Model: ADR 0004. All
functions are pure and return a new group; they throw `GroupError` with a
stable `code`.

| Action | Who | Rules | Error codes |
|--------|-----|-------|-------------|
| `createGroup` | any account | Name 1–60 chars (trimmed); owner name 1–60; timezone must be a valid IANA zone (default chosen by the UI: `America/Santiago`). The creator joins as `owner`. | `INVALID_NAME`, `INVALID_TIMEZONE` |
| `joinGroup` | any signed-in account with the invite link | Joining twice is a no-op. Display name 1–60. | `INVALID_NAME` |
| `leaveGroup` | member | When the owner leaves, the longest-standing member becomes owner. Returns `null` when the last member leaves; the adapter deletes the group. | `NOT_A_MEMBER` |
| `updateGroup` | owner | Rename and/or change the timezone; fields not given are kept. | `NOT_A_MEMBER`, `NOT_OWNER`, `INVALID_NAME`, `INVALID_TIMEZONE` |

Members are kept in join order with exactly one `owner`. A member's
availability is not stored in the group: it comes from their own profile,
shared by all their groups (T2).

The invite code is the secret in the invite link (ADR 0003). Adapters must
generate it with at least 128 bits of randomness; it is separate from the
group id so it can be rotated later.

## Group view (outlook)

Implementation: `packages/core/src/group/outlook.ts`.

- `outlookRange(timezone, now, days = 28)`: from today in the group's
  timezone, 4 weeks ahead by default (agent assumption, ADR 0004).
- `groupOutlook({ group, profiles, from, to, minimumMinutes? })`: compares
  every member's profile with `findWindows` in the group's timezone. Returns
  the members (with `hasProfile`), the ranked windows, and every date with its
  best window or `null`. A member without a profile is unknown, never free, and
  shows up in `MISSING_DATA`. Profiles of people outside the group are ignored.
- `groupDayLines({ group, profiles, date, span })`: each member's free / busy /
  unknown segments for the line diagram.
