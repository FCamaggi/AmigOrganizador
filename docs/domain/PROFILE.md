# Profile (domain rules)

Implementation: `packages/core/src/profile/profile.ts`; storage port:
`packages/core/src/profile/profile-repository.ts`. Model: ADR 0004.

Each person keeps one profile: a calendar of their busy time, shared by all
their groups. All functions are pure and return a new profile; they throw
`ProfileError` with a stable `code`.

## What a profile holds

- **Templates** (optional helpers): `workweek()`, weekly `classes`,
  `shiftCycle()` (e.g. "4º turno"). See `busy-templates.ts`.
- **One-off busy days**: busy time on a local date (a dentist, an exam).
- **Exceptions**: template time freed on a date (a day off, holidays). An
  exception never frees one-off or imported busy time.
- **Timezone**: the IANA zone the person writes their templates and one-off
  days in (`setTimezone`, error `INVALID_TIMEZONE`; stored in its canonical
  spelling; setting the same zone changes nothing). Profiles saved before it
  existed have none and read as `America/Santiago`
  (`DEFAULT_PROFILE_TIMEZONE`, through `profileTimezone`). An ICS import reads
  floating times and all-day events in this zone.
- **Imported calendars**: busy spans read from another calendar (ICS URL in
  this phase), stored as UTC instants so each group reads them in its own
  timezone. Only busy spans are kept, never event titles. A re-sync replaces
  the calendar with the same id.

## Actions

| Action | Rules | Error codes |
|--------|-------|-------------|
| `createProfile` | Starts empty (nothing busy). | — |
| `setTemplates` | Replaces all templates; each must be valid. | `INVALID_TEMPLATE` |
| `setDay` | Replaces one date's one-off busy time and exceptions; a date with nothing left is removed. | `INVALID_DATE`, `INVALID_TIME` |
| `setImportedCalendar` | Adds or replaces (same id) an imported calendar; every span must end after it starts. | `INVALID_TIME` |
| `removeImportedCalendar` | Removes an imported calendar by id. | — |
| `setTimezone` | Sets the person's zone; an IANA name with a region, or `UTC`. | `INVALID_TIMEZONE` |

Intervals are minutes from local midnight, non-empty, within 0–2880 (an
interval past 1440 runs into the next day).

## Reading a profile

`availabilityFor(profile, from, to, timezone)` returns what the engine needs
per date, in the reading group's timezone: busy = (templates − exceptions) +
one-off busy + imported busy (converted from UTC and split at local midnight).
Templates and one-off days are wall time in the person's zone: read as is
when it is the group's zone (the same result as before zones existed), else
converted through UTC to the group's zone, so "work 9 to 18" in Madrid is
05:00 to 14:00 for a Santiago group in November. Known gap: busy time that
ends inside the group's repeated hour (clocks falling back) loses the first
occurrence of that hour, because local minutes can't name a repeated hour;
imported calendars have the same gap. One night hour a year, never extra
busy time. Having a
profile covers the whole range, so time not busy is free. The day before
`from` is included without coverage, only with busy time that runs past
midnight into `from`. A group member **without** a profile has no entry at
all: unknown, never free.

## Schedules and the person

Rules in `packages/core/src/profile/person.ts` (ADR 0004 amendment).

- A person (`Person`) has a name (1 to 60 characters, trimmed), a default
  schedule and an optional choice of schedule per group.
- A schedule is a `Profile` with an `id` and a `name` (1 to 40 characters).
  Profiles saved before schedules read as id `default`, name "Mi horario".
- A group reads the schedule chosen for it, else the default; no schedule
  means unknown. If the chosen schedule is gone, the group reads the default.
- The default schedule cannot be removed; removing another one sends the
  groups that read it back to the default.
- Duplicating a schedule copies every busy rule under a new id and name.
