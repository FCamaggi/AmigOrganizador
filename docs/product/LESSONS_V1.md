# Lessons from v1

v1 lives on `master` (60 commits, Dec 2025 – May 2026) and in the private repo
`AmigOrganizadorEventos`. Its original docs are in `docs/legacy/`.

**One-line verdict:** the scoring engine was good; the input it depended on
(busy slots typed by hand, month by month, behind a required account) is what
killed adoption.

## What went wrong

| # | Problem | Evidence in v1 | Rule for v2 |
|---|---------|----------------|-------------|
| 1 | Every friend needed a full account (email, username, password) before getting any value. Joining meant typing an 8-character code inside the app. | `backend/src/models/User.js`, `JoinGroupModal.tsx` | Everyone has an account (ADR 0003), but the link shows the plan first and sign-in is one tap (Google or magic link), right when you answer. No passwords, no codes. |
| 2 | Availability was entered by hand, as **busy** slots, for **each month**. A work week took "15+ pasos, ~5 minutos", and still 2–3 clicks per day after the refactor. | `docs/legacy/REFACTORING_COMPLETE.md` | Weekly pattern + exceptions. Calendar connection as a live feed, never a monthly copy. |
| 3 | The app competed with people's own calendars instead of reading them. The import was a one-time snapshot. | `CalendarImportModal.tsx` | We never replace a calendar. We read free/busy continuously and write the confirmed plan back as an invite. |
| 4 | Missing data counted as "free". A member who entered nothing looked available all day. | `availabilityController.js:107-123` | Three states: free, busy, **unknown**. Unknown is never shown as free. |
| 5 | Two overlapping concepts ("Mi Horario" and "Calendario"); only one fed the analysis. | `Schedule` vs `Event` models | One availability model. |
| 6 | The flow ended at "here are good days". Nothing turned that into an actual plan. | Vision doc §4.2: "confirmar plan" out of scope | The product ends at a confirmed plan that sits in everyone's calendar. |
| 7 | No notifications outside the app; email invites were never sent. | No mail library in the code | Reach people where they already are: WhatsApp share links, push, calendar invites. |
| 8 | Free-tier servers that sleep (Render) on both services: "Si el servidor estaba dormido, espera unos segundos". | `services/api.ts:26` | Serverless or edge hosting with no cold-start UX. |
| 9 | Almost no tests: one smoke script. A 1,729-line manual checklist, mostly unticked. Logic bugs (availability inverted, imports not persisting) got through. | `docs/legacy/TESTEO_SCHEDULE_PAGE.md`, `CHANGELOG_V1.md` | The domain engine is pure and test-first; CI runs tests from day one. |
| 10 | Event suggestions came from one HTML scraper (PuntoTicket), run by hand. | `eventos/scrapers/puntoticket.py` | Pluggable sources behind one port; scheduled ingestion; scraping only as a last resort. |

## What we keep (as ideas, not code)

- The ranked-window algorithm and per-group settings. Spec: [`../domain/AVAILABILITY_ENGINE.md`](../domain/AVAILABILITY_ENGINE.md).
- Overnight slot handling (night shifts must work; v1 broke them once).
- Human-readable reasons next to every suggestion ("Todos pueden", "Bloque largo").
- Matching events to a window: inside it, outside it, or time unknown.
- Google and Microsoft OAuth with encrypted refresh tokens.
