# ADR 0003 — Accounts for everyone, one-tap sign-in

- **Status:** accepted (owner: "Todo usuario tiene que tener cuenta", 2026-11-13)
- **Date:** 2026-11-13

## Context

The first v2 draft let guests answer a plan without an account, because v1's
account wall was its biggest adoption problem (`LESSONS_V1.md` #1). The owner
decided that every participant, organizer included, must have an account.

## Decision

- Every participant has an account. Answers, plans and groups belong to it.
- A plan's unguessable link is the access control: anyone signed in who has
  the link can join.
- To keep the cost of the account low:
  1. Opening a plan link shows the plan (title, organizer, who answered)
     before asking to sign in. Sign-in is requested on "Responder".
  2. Sign-in is one tap: Google OAuth or an email magic link. No passwords,
     no usernames.
  3. After sign-in the person lands back on the plan, with no onboarding.

## Consequences

- Answers can be edited from any device; identity is verified.
- Google sign-in can later request calendar free/busy scope (Phase 2).
- Risk: lower response rate than guest mode. Track the share of link
  visitors who sign in and answer; revisit this ADR if it falls below 60%.

## Amendment (2026-11-25)

The magic link was replaced by a one-time code sent by email, typed into the
sign-in screen, because the emailed link did not work reliably.
Google sign-in is turned off until it works reliably. No passwords still holds.
