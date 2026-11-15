# Product metrics

We measure the roadmap exit tests with events in our own database, never a
third-party analytics tool. Events carry ids and times only: no names, plan
titles or calendar content (see the privacy page, `/privacidad`).

## Events (`app.product_events`)

| `kind`            | When                                        | Extra columns                |
| ----------------- | ------------------------------------------- | ---------------------------- |
| `profile_created` | A person's profile is saved the first time  | `setup_seconds` (may be null) |
| `plan_proposed`   | A member proposes a plan                    | `group_id`, `plan_id`        |
| `plan_confirmed`  | The proposer or the owner confirms it       | `group_id`, `plan_id`        |

`setup_seconds` runs from the first edit in the profile editor to the save
that creates the profile. It is null when the profile was created by an ICS
import, or when nothing was edited, or when the value is outside 0 to 86 400
seconds (a tab left open is not a setup session). Someone who imports a
calendar before their first editor save has no setup time, which leans the
median toward people who don't import. Two first saves at the same moment
(two tabs) can record the event twice, hence `count(DISTINCT account_id)`. Rules live in
`core/src/metrics/product-event.ts`; recording never blocks what the person
was doing.

## Phase 1 exit test

"3 real friend groups confirm a plan; median time to set up a profile under
2 minutes." Run in the Supabase SQL editor:

```sql
SELECT
  (SELECT count(DISTINCT group_id)
     FROM app.product_events
    WHERE kind = 'plan_confirmed') AS groups_with_confirmed_plan,
  (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY setup_seconds)
     FROM app.product_events
    WHERE kind = 'profile_created' AND setup_seconds IS NOT NULL)
    AS median_setup_seconds,
  (SELECT count(DISTINCT account_id)
     FROM app.product_events
    WHERE kind = 'profile_created') AS profiles_created;
```

Passes when `groups_with_confirmed_plan >= 3` and `median_setup_seconds < 120`.
Exclude the team's own accounts and test groups by `account_id` / `group_id`
before judging.
