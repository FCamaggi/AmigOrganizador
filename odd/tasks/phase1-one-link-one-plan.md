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
- [ ] T3b (S2) inline: in-memory `PlanRepository` adapter so screens can be built before Supabase (owner: "si").
- [ ] T3c (S3) inline: core busy templates (shifts, workweek, classes) + plan `inputMode` (`busy` default, `free`).
- [~] T4a (S9) inline: design direction (impeccable). PRODUCT.md written; direction chosen by owner on the decision page: "Línea de Metro" (seed:36a938293246d30e); contract in `apps/web/.impeccable/surfaces/src-app-page-tsx.md`. Pending: build, finish review, DESIGN.md.
- [ ] T4 (S1, S3, S8) inline: create-plan and availability screens (mobile first).
- [ ] T5 (S4, S5) inline: results and confirm screen.
- [ ] T6 (S6): Open Graph image and metadata per plan.
- [ ] T7 (S7): Vercel deploy + Playwright e2e of the full flow. Blocked: Vercel project. Domain: Vercel default (`*.vercel.app`, owner: "usemos lo que mande el deploy, es beta").

## Log

- L1 (2026-11-13): created from roadmap Phase 1 after Phase 0 closed (`4aa2789`).
- L2 (2026-11-13): native review of `92a758f..ca921c2` (risk + reliability) approved and acknowledged (`review-83895a432fb062d7`). Advisory findings fixed in a follow-up commit: CI token `contents: read`; engine rejects non-finite settings, invalid weights, duplicate member ids and intervals outside 0–2880; tests pin coverage spill, `PARTIAL_AVAILABLE` and `LATE` (39 tests).
- L3 (2026-11-13): owner on access rules: "1. Todo usuario tiene que tener cuenta 2. na yo creo que link esta bien 3. TIENE CUENTA". Agent flagged the tension with LESSONS_V1 #1 and applied mitigations: plan preview before sign-in, one-tap sign-in (Google or magic link), return straight to the plan. Recorded in ADR 0003.
- L4 (2026-11-13): owner decisions: Supabase can wait; build screens on an in-memory adapter; busy-first input with profiles, both modes configurable per group; use design capabilities; stay local (no push yet); Vercel default domain; timezone selectable, default Santiago; `rebuild` replaces `master` after Phase 1; monetization waits ("quiero promocionar cosas mock, pero locales reales, no me importa que no me paguen"); Engram project is `amigorganizador` ("esto no tiene nada que ver con mi2ente"). Pending: Q7 (may the organizer confirm a time the app did not suggest?) re-explained.
- L5 (2026-11-13): owner chose the visual direction "Línea de Metro" (each friend a metro line, shared free span = station) over the assigned "Letrero de feria". Owner asked why 4 challengers were declined (explained: they lost on audience identification and clarity; each donated one discipline).
