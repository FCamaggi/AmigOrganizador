# Plan (domain rules)

Implementation: `packages/core/src/plan/plan.ts`; storage port:
`packages/core/src/plan/plan-repository.ts`. All functions are pure and
return a new plan; they throw `PlanError` with a stable `code`.

| Action | Who | Rules | Error codes |
|--------|-----|-------|-------------|
| `createPlan` | any account | Title 1–80 chars (trimmed); organizer name 1–60; range 1–60 days; duration 15 min–12 h in 15-min steps. The organizer joins automatically. | `INVALID_TITLE`, `INVALID_NAME`, `INVALID_RANGE`, `INVALID_DURATION` |
| `joinPlan` | any signed-in account with the link | Plan must be open. Joining twice is a no-op. | `PLAN_NOT_OPEN`, `INVALID_NAME` |
| `answerPlan` | participant | Plan open. Replaces the previous answer. Dates within the range, plus the day before it (overnight spill). Intervals within 0–2880 min, start ≤ end. | `PLAN_NOT_OPEN`, `NOT_A_PARTICIPANT`, `DATE_OUT_OF_RANGE`, `INVALID_TIME` |
| `suggestOptions` | anyone in the plan | `findWindows` over all participants; no answer = unknown; minimum block = plan duration. | — |
| `confirmPlan` | organizer | Plan open; date in range; start within the day on the 15-min grid; end = start + duration (may pass midnight). | `NOT_ORGANIZER`, `PLAN_NOT_OPEN`, `DATE_OUT_OF_RANGE`, `INVALID_TIME` |
| `cancelPlan` | organizer | Plan open. | `NOT_ORGANIZER`, `PLAN_NOT_OPEN` |

The plan id is also the secret in the share link (ADR 0003): adapters must
generate it with at least 128 bits of randomness.
