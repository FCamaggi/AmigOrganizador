# Phase 1 — One link, one plan

Objective: a real friend group goes from a shared link to a confirmed plan without help.
Branch: `rebuild`. Delivery: ask-on-risk. Test runner: Vitest (core, adapters), Playwright (e2e).

## Specs

Source: `docs/product/ROADMAP.md`, Phase 1 (written by the agent from the owner's
request in `phase0-foundation.md` L1; not yet confirmed item by item by the owner).

- S1: Create a plan in one screen: title, rough range ("next 2 weeks"), duration.
- S2: Guest participation by link: name + availability, no account.
- S3: Availability input: tap/drag days and times; reusable weekly pattern.
- S4: Engine: ranked options with reasons; free / busy / unknown states (`findWindows`).
- S5: Confirm a plan; `.ics` download and "add to Google Calendar" link.
- S6: Shareable link preview (Open Graph) made for WhatsApp.
- S7 (exit test): 3 real friend groups confirm a plan; median time to fill availability under 60 seconds.

Assumptions (to confirm): the organizer is also a guest (no account in Phase 1);
an unguessable plan URL is the only access control; guests edit their own answer
from the same device via a stored token.

## Tasks

- [ ] T1 (S1, S2) inline: core `Plan` domain (create, join, answer, confirm) + repository port.
- [ ] T2 (S5) inline: core `.ics` and Google Calendar link builders.
- [ ] T3 (S1, S2) inline: Postgres schema (Drizzle) + Supabase adapter. Blocked: Supabase project.
- [ ] T4 (S1, S3) inline: create-plan and availability screens (mobile first).
- [ ] T5 (S4, S5) inline: results and confirm screen.
- [ ] T6 (S6): Open Graph image and metadata per plan.
- [ ] T7 (S7): Vercel deploy + Playwright e2e of the full flow. Blocked: Vercel project.

## Log

- L1 (2026-11-13): created from roadmap Phase 1 after Phase 0 closed (`4aa2789`).
- L2 (2026-11-13): native review of `92a758f..ca921c2` (risk + reliability) approved and acknowledged (`review-83895a432fb062d7`). Advisory findings fixed in a follow-up commit: CI token `contents: read`; engine rejects non-finite settings, invalid weights, duplicate member ids and intervals outside 0–2880; tests pin coverage spill, `PARTIAL_AVAILABLE` and `LATE` (39 tests).
