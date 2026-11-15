# Calendar import (ICS URL)

Implementation: `packages/adapter-ics` (adapter; `core` stays pure). Feeds a
profile's `ImportedCalendar` (`docs/domain/PROFILE.md`).

## Flow

`importIcsCalendar({ id, name, url, timeZone, now })` downloads the link with
`fetchIcs`, reads it with `parseIcsBusy` from yesterday to 120 days ahead, and
returns `{ id, name, busy: UtcSpan[], syncedAt }`. Running it again with the
same id is a re-sync.

## Parsing (`parseIcsBusy`)

- Library: `ical.js` 2.2.1 (Mozilla, MPL-2.0, no dependencies).
- Only start and end instants leave the parser; titles, descriptions and
  locations are never read into the result (product rule: free/busy only).
- Recurrences (RRULE, EXDATE) are expanded inside the window; moved
  occurrences (RECURRENCE-ID) replace the original one, only within the same
  UID. Expansion stops on the rule's own tick, so an occurrence moved past the
  window never cuts the series short, and one moved into the window from
  later is still read. At most 5,000 occurrences per event.
- A UTC `UNTIL` on a floating or unresolved-TZID start is applied to the real
  instants (ical.js would compare it as if the start were UTC).
- Busy overrides of a series marked free still count; events without
  `DTSTART` are skipped.
- Free events (`TRANSP:TRANSPARENT`) and cancelled ones do not count as busy.
  All-day busy events block the whole local day in the person's timezone.
- Times: UTC or a `VTIMEZONE` in the file are exact; an unresolved `TZID` that
  is an IANA name is used as is; floating times use the person's timezone.
  `VTIMEZONE` blocks are resolved inside the parsed file and never registered
  in ical.js's process-wide service, so one calendar can't change another's.
- Text that is not an iCalendar throws `IcsError`.

## Downloading safely (`fetchIcs`)

The server downloads a URL the person typed, so it guards against SSRF:

- Only `https` (or `webcal://`, rewritten to https), default port, no
  credentials in the URL.
- The DNS lookup used for the connection itself refuses private, loopback,
  link-local, shared, multicast and reserved addresses (IPv4, IPv6,
  IPv4-mapped, NAT64, 6to4, Teredo, IPv4-compatible). Checking at connect
  time also stops DNS rebinding.
- Redirects are followed manually (at most 3), each re-validated; a malformed
  target is `INVALID_URL`; unread redirect bodies are drained.
- 10 s timeout and a 2 MB size limit.
- Errors carry a stable code: `INVALID_URL`, `BLOCKED_ADDRESS`, `HTTP_ERROR`,
  `TOO_LARGE`, `TIMEOUT`, `TOO_MANY_REDIRECTS`, `NETWORK`.

The link is often private (Google's "secret address"): never log it or put it
in error messages. It is stored apart from the profile, as a
`CalendarSource { accountId, calendarId, url }` behind the
`CalendarSourceRepository` port (`core/src/profile/calendar-source-repository.ts`):
profiles are read by every group a person belongs to, sources only to re-sync.
The Supabase adapter (T10) should encrypt `url` at rest.
