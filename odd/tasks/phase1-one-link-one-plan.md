# Phase 1 — One link, one plan

Objective: a real friend group goes from a shared link to a confirmed plan without help.
Branch: `rebuild`. Delivery: ask-on-risk. Test runner: Vitest (core, adapters), Playwright (e2e).

## Specs

Source: `docs/product/ROADMAP.md`, Phase 1 (written by the agent from the owner's
request in `phase0-foundation.md` L1; not yet confirmed item by item by the owner).

- S1: Create a plan in one screen: title, rough range ("next 2 weeks"), duration.
- S2: Join by link. Owner (2026-11-13): "Todo usuario tiene que tener cuenta"; "na yo creo que link esta bien". The link is the access control; every participant signs in (Google or magic link) before answering; the plan is visible before sign-in.
- S3: Availability input. Owner (2026-11-13): "habia puesto como marcar ocupado porque es muco menos subjetivo [...] los ocupados pueden tener cierta logica, el perfil de enfermera tiene los turnos, un perfil normal trabaja de lunes a viernes, perfil estudiante tiene clases, etc. es mas facil armar los dias ocupados que los libres [...] igualmente puede ser compatible con ambas formas, segun como se quiera configurar ese grupo". Default: mark busy time, helped by recurring profiles/templates (shifts, workweek, classes); a plan can switch to marking free time.
- S8: Timezone selectable per plan, default `America/Santiago` (owner: "Que se pueda elegir, pero el default Santiago").
- S9: Screens use the environment's design capabilities (owner: "deberias de ocupar las capacidades de diseño de esteambiente, tenemos mucho por donde mejorar las vistas").
- S4: Engine: ranked options with reasons; free / busy / unknown states (`findWindows`).
- S5: Confirm a plan; `.ics` download and "add to Google Calendar" link.
- S6: Shareable link preview (Open Graph) made for WhatsApp.
- S7 (exit test): 3 real friend groups confirm a plan; median time to fill availability under 60 seconds.

Decided (ADR 0003): accounts for everyone, including the organizer; an
unguessable plan URL is the only access control; answers belong to the account,
so they can be edited from any device.

## Tasks

- [x] T1 (S1, S2) inline: core `Plan` domain (create, join, answer, suggest, confirm, cancel) + `PlanRepository` port; participants are account ids. RED (29 failing on stub) then GREEN (79 tests). Rules in `docs/domain/PLAN.md`.
- [x] T2 (S5) inline: core `buildIcs` (RFC 5545 escaping and 75-octet folding) and `buildGoogleCalendarUrl`; RED then GREEN (49 tests). Times in UTC ms; adapters convert from local.
- [ ] T3 (S1, S2) inline: Postgres schema (Drizzle) + Supabase adapter. Blocked: Supabase project.
- [x] T3b (S2) inline: in-memory `PlanRepository` adapter so screens can be built before Supabase (owner: "si"). Package `@amigo/adapter-memory` (`InMemoryPlanRepository`, `newPlanId` with 128 random bits); RED (8 failing on stub) then GREEN (8 tests).
- [x] T3c (S3) inline: core busy templates (shifts, workweek, classes) + plan `inputMode` (`busy` default, `free`). `expandBusyTemplates`, `buildAnswerDays`, `workweek`, `shiftCycle`; RED (22 failing on stub) then GREEN (101 core tests). Rules in `docs/domain/PLAN.md`.
- [x] T4a (S9) inline: design direction (impeccable) "Línea de Metro"; finish review `ship` (L13); `apps/web/DESIGN.md` + `.impeccable/design.json` written.
- [x] T4 (S1, S3, S8) inline: create-plan and availability screens (mobile first). `e556ff0`, `39c6d92`, `068efba`.
- [x] T5 (S4, S5) inline: results and confirm screen. `e556ff0`, `878781d`, `39c6d92`, `068efba`.
- [ ] T6 (S6): Open Graph image and metadata per plan.
- [ ] T7 (S7): Vercel deploy + Playwright e2e of the full flow. Blocked: Vercel project. Domain: Vercel default (`*.vercel.app`, owner: "usemos lo que mande el deploy, es beta").

## Log

- L1 (2026-11-13): created from roadmap Phase 1 after Phase 0 closed (`4aa2789`).
- L2 (2026-11-13): native review of `92a758f..ca921c2` (risk + reliability) approved and acknowledged (`review-83895a432fb062d7`). Advisory findings fixed in a follow-up commit: CI token `contents: read`; engine rejects non-finite settings, invalid weights, duplicate member ids and intervals outside 0–2880; tests pin coverage spill, `PARTIAL_AVAILABLE` and `LATE` (39 tests).
- L3 (2026-11-13): owner on access rules: "1. Todo usuario tiene que tener cuenta 2. na yo creo que link esta bien 3. TIENE CUENTA". Agent flagged the tension with LESSONS_V1 #1 and applied mitigations: plan preview before sign-in, one-tap sign-in (Google or magic link), return straight to the plan. Recorded in ADR 0003.
- L4 (2026-11-13): owner decisions: Supabase can wait; build screens on an in-memory adapter; busy-first input with profiles, both modes configurable per group; use design capabilities; stay local (no push yet); Vercel default domain; timezone selectable, default Santiago; `rebuild` replaces `master` after Phase 1; monetization waits ("quiero promocionar cosas mock, pero locales reales, no me importa que no me paguen"); Engram project is `amigorganizador` ("esto no tiene nada que ver con mi2ente"). Pending: Q7 (may the organizer confirm a time the app did not suggest?) re-explained.
- L5 (2026-11-13): owner chose the visual direction "Línea de Metro" (each friend a metro line, shared free span = station) over the assigned "Letrero de feria". Owner asked why 4 challengers were declined (explained: they lost on audience identification and clarity; each donated one discipline).
- L6 (2026-11-13): owner: "el hook esta causando problemas de continuidad, rompe la lectura integral del chat" -> "si, aplica la 1". Ran `gentle-ai review mode disable --scope clone`; status: off (clone_local). Re-enable with `gentle-ai review mode enable --scope clone` once `rebuild` replaces `master`; ad hoc reviews via /code-review when a change warrants it.
- L7 (2026-11-13): T3b done. `pnpm check` was already failing on the base: Biome linted the design mocks in `apps/web/.impeccable/`; excluded them (`!**/.impeccable`), they are design artifacts, not shipped code.
- L8 (2026-11-13): T3c done. Decision (agent, reversible): an answer covers the whole range in both modes, so unmarked time is free in `busy` mode and busy in `free` mode; templates apply only in `busy` mode, with per-date `cleared` overrides for days off.
- L9 (2026-11-13): owner approved both open points: "Me parece bien, vamos". Diagram: one line per person up to 6; 7+ collapse free people into an ink trunk line with counts, keeping up to 3 blockers (busy/unknown) as their own lines plus "+N más". Busy entry: own line per day with out-of-service segments; routine chips (Trabajo L-V, Turnos 4º turno, Clases, Nada fijo) prefill from templates; three tap segments (mañana 8–13, tarde 13–19, noche 19–24) with exact busy portions drawn; tapping a template segment clears it for that date; "Ajustar" sheet in 30-min steps optional; free mode is the inverse.
- L10 (2026-11-13): core helpers for screens committed (`ce7eaed`: `dayLines`, `slotFromOption`, `inviteFor`, `zonedTimeToUtc`, `todayIn`; 113 core tests). Web T4/T5 in progress, UNCOMMITTED: `apps/web/src/i18n/` (es-CL copy + `t()`), `src/lib/format.ts`, `src/lib/lines.ts`, `src/server/session.ts` (local-mode cookie session), `src/server/repository.ts` (imports a missing `./demo-plans`). Next: demo-plans, server actions, routes `/`, `/nuevo`, `/entrar`, `/p/[id]`, `/p/[id]/disponibilidad`, `/p/[id]/calendario.ics`; add `@amigo/adapter-memory` to web deps and `transpilePackages`; Roboto Condensed via next/font; then impeccable detect, screenshots, finish reviewer, DESIGN.md.
- L11 (2026-11-14): screens built (`e556ff0`): `/` (home, plans list), `/nuevo` (create: title, range preset, duration, input mode, timezone default Santiago), `/entrar` (Google and magic link shown disabled + labelled local-mode name form), `/p/[id]` (plan before sign-in, line diagram with trunk for 7+, ranked options as radios that redraw the diagram, role-based actions, confirmed state with Google Calendar link and `.ics`), `/p/[id]/disponibilidad` (busy editor), `/p/[id]/calendario.ics`. Dev seeds two synthetic plans (`demo-asado`, 6 people; `demo-grande`, 10). Verified: `pnpm check` (115 core + 8 adapter tests), `pnpm build`, Playwright walk of every flow with zero console errors, `.ics` at 19:00 Santiago.
- L12 (2026-11-14): decision (agent, reversible, related to Q7): the confirmed slot leans to 19:00 inside the option window (`878781d`), because confirming at the window start turned a whole free Saturday into an 08:00 asado. Not built yet: the optional 30-min "Ajustar" sheet; real auth (local cookie session stands in until Supabase).
- L13 (2026-11-14): finish review (impeccable reviewer guide, run by a fresh general-purpose subagent because the dedicated agent type is not installed). Round 1: `fix`, 8 material fixes (station must be the confirmable slot, rows must explain ranking, busy hatched in the diagram, kicker on confirmed screen, confirmed screen without the world, trunk count placement, axis end tick, station capsules + purple citation). Round 2: 5 resolved, 3 partial + 1 regression (lost day context); owner: "dale, tercera ronda y después el DESIGN.md". Round 3 (`068efba`): all resolved; verdict `ship` (scoped to the 8 scored fixes). Commits: `39c6d92`, `068efba`.
- L14 (2026-11-14): DESIGN.md and design.json written (documenter guide, fresh subagent). Open notes: the 6th person's line is ink, the same colour as the busy hatch and the trunk (told apart only by pattern and thickness); pressed blue `#00539c` is hard-coded in `src/lib/ui.ts`. Next: T6 (Open Graph), then T3/T7 when Supabase and Vercel exist.
