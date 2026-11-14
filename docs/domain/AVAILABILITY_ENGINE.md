# Availability engine (spec to port)

Source of truth for v1 behaviour: `git show master:backend/src/controllers/availabilityController.js`
(`calculateGroupAvailabilityData`, line 376) and `master:backend/src/utils/timeSlots.js`.

v2 ports the **ideas**, as a pure TypeScript module with no I/O, framework or
database inside. Every rule below gets a test before its implementation.

Implementation: `packages/core/src/availability/find-windows.ts`
(`findWindows`), with tests next to it.

## Inputs

- A local date range (`from`, `to`, inclusive). The engine has **no timezone
  logic**: every time is minutes from local midnight on a `LocalDate`.
  Adapters convert calendar data (UTC) into the group's timezone before
  calling it.
- Members, each with per-date `coverage` (time they told us about) and
  `busy` (busy time inside the coverage). Covered and not busy is `free`;
  not covered is `unknown`, **never** `free`. Intervals may run past 1440
  minutes; the overflow applies to the next day (night shifts).
- Group settings:
  - `usefulStart` / `usefulEnd` (default 08:00–22:00; within one day)
  - `minimumBlockMinutes` (default 120)
  - `alternativeThreshold` (default 80, in percent of **respondents**)
  - `weights` for the score (defaults below)

## Respondents

A respondent is a member with any coverage inside the useful hours of the
range. The threshold counts free members against respondents, so a friend
who hasn't answered yet doesn't block every window; they show up in the
window's `unknownMemberIds` and a `MISSING_DATA` reason. A respondent's
uncovered time counts as not free.

## Algorithm (v1, kept)

1. **Normalize per member.** Merge overlapping busy intervals, including
   overnight spill-over into the next day. Clip to useful hours. Free time is
   only what the member marked free or what a connected calendar shows as not
   busy; everything else is unknown.
2. **Sweep.** Cut each day at every interval boundary. Each segment gets the
   set of members who are free in it.
3. **Filter.** Merge neighbours with the same free and unknown sets, keep
   segments with at least one free member and free / respondents ≥
   threshold, drop windows shorter than `minimumBlockMinutes`.
4. **Score (0–100).**
   - 45 · share of members free
   - 20 · duration (capped at 3 hours)
   - 20 · time of day (evening 1, afternoon 0.85, morning 0.65, late 0.45)
   - 10 · weekday (Fri/Sat 1, Sun 0.9, others 0.65)
   - 5 · share of members with known data
5. **Rank.** Windows where everyone can come first, then by score, then
   earliest date and start.
6. **Explain.** Each window carries typed reasons: `ALL_AVAILABLE` or
   `PARTIAL_AVAILABLE`, `LONG_BLOCK` (≥ 3 h) or `ENOUGH_DURATION` (≥ 2 h),
   `EVENING` or `LATE`, `GOOD_WEEKDAY` (Fri–Sun), and `MISSING_DATA` with
   member ids. The UI turns codes into copy.

## Changes from v1

- `unknown` replaces "no data = free". Windows that depend on unknown members
  are flagged, not hidden.
- Scoring weights are configuration, not constants, so we can tune them
  against real confirmed plans.
- Reactions (👍 / 🤷 / 👎) on proposed options can feed the ranking later.

## Earlier v1 modes (reference only)

- **Day by day:** a member counts only if completely free that day.
- **Hour by hour:** 24 hourly buckets; day score is the average bucket share.
- **Minimum hours X:** weight 1 if a member's longest free block is ≥ X,
  0.5 if ≥ X/2, else 0.
