# Availability engine (spec to port)

Source of truth for v1 behaviour: `git show master:backend/src/controllers/availabilityController.js`
(`calculateGroupAvailabilityData`, line 376) and `master:backend/src/utils/timeSlots.js`.

v2 ports the **ideas**, as a pure TypeScript module with no I/O, framework or
database inside. Every rule below gets a test before its implementation.

## Inputs

- Members, each with a list of intervals in one of three states: `free`,
  `busy`, or nothing known (`unknown` is the default, **never** `free`).
- A date range and a timezone (`America/Santiago` by default; DST-safe).
- Group settings:
  - `usefulStart` / `usefulEnd` (default 08:00–22:00; may cross midnight)
  - `minimumBlockMinutes` (default 120)
  - `alternativeThreshold` (default 80% of members)

## Algorithm (v1, kept)

1. **Normalize per member.** Merge overlapping busy intervals, including
   overnight spill-over into the next day. Clip to useful hours. Free time is
   only what the member marked free or what a connected calendar shows as not
   busy; everything else is unknown.
2. **Sweep.** Cut each day at every interval boundary. Each segment gets the
   set of members who are free in it.
3. **Filter.** Drop segments below the threshold, merge neighbours with the
   same member set, drop windows shorter than `minimumBlockMinutes`.
4. **Score (0–100).**
   - 45 · share of members free
   - 20 · duration (capped at 3 hours)
   - 20 · time of day (evening 1, afternoon 0.85, morning 0.65, late 0.45)
   - 10 · weekday (Fri/Sat 1, Sun 0.9, others 0.65)
   - 5 · share of members with known data
5. **Rank.** Windows where everyone can come first, then by score.
6. **Explain.** Each window carries reasons, such as `ALL_AVAILABLE`,
   `LONG_BLOCK`, `MISSING_DATA:<names>`. The UI turns codes into copy.

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
