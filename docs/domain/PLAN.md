# Plan (domain rules)

Implementation: `packages/core/src/plan/plan.ts`; storage port:
`packages/core/src/plan/plan-repository.ts`. All functions are pure and
return a new plan; they throw `PlanError` with a stable `code`.

| Action | Who | Rules | Error codes |
|--------|-----|-------|-------------|
| `createPlan` | any account | Title 1–80 chars (trimmed); organizer name 1–60; range 1–60 days; duration 15 min–12 h in 15-min steps; `inputMode` `busy` (default) or `free`. The organizer joins automatically. | `INVALID_TITLE`, `INVALID_NAME`, `INVALID_RANGE`, `INVALID_DURATION`, `INVALID_INPUT_MODE` |
| `joinPlan` | any signed-in account with the link | Plan must be open. Joining twice is a no-op. | `PLAN_NOT_OPEN`, `INVALID_NAME` |
| `answerPlan` | participant | Plan open. Replaces the previous answer. Dates within the range, plus the day before it (overnight spill). Intervals within 0–2880 min, start ≤ end. | `PLAN_NOT_OPEN`, `NOT_A_PARTICIPANT`, `DATE_OUT_OF_RANGE`, `INVALID_TIME` |
| `suggestOptions` | anyone in the plan | `findWindows` over all participants; no answer = unknown; minimum block = plan duration. | — |
| `confirmPlan` | organizer | Plan open; date in range; start within the day on the 15-min grid; end = start + duration (may pass midnight). | `NOT_ORGANIZER`, `PLAN_NOT_OPEN`, `DATE_OUT_OF_RANGE`, `INVALID_TIME` |
| `cancelPlan` | organizer | Plan open. | `NOT_ORGANIZER`, `PLAN_NOT_OPEN` |

The plan id is also the secret in the share link (ADR 0003): adapters must
generate it with at least 128 bits of randomness.

## Answering: busy templates and input mode

Implementation: `packages/core/src/availability/busy-templates.ts`.

People describe recurring busy time once with templates: `workweek()`
(Monday–Friday 09:00–18:00 by default), `classes` (weekly blocks) and
`shiftCycle()` (a rotating pattern such as `["day", "night", "off", "off"]`
from an anchor date; night 20:00–08:00 spills into the next day).
`expandBusyTemplates` turns them into busy intervals per date.

`buildAnswerDays` builds what `answerPlan` stores, following the plan's
`inputMode`:

- `busy`: every date in the range is covered; busy = templates + one-off
  marks − `cleared` time (e.g. a day off). A night shift on the day before
  the range is kept with no coverage, so only its spill counts.
- `free`: every date in the range is covered; busy = everything not marked
  free. Free marks stay within the day.

Answering means "I covered the whole range", so nothing in an answer is
unknown; only people who have not answered are unknown.
