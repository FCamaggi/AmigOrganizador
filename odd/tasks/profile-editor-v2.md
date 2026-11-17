# Profile editor v2 — flexible, legible availability

Objective: make the availability profile flexible (hours, not only morning/afternoon/evening), legible (you know what you are marking) and personal (name, several schedules). Branch `rebuild`. Delivery: ask-on-risk. Test runner: Vitest (`pnpm check`), Playwright e2e.

## Specs

- S1 Granularity is a choice. Owner: "no me gusta que sea tan poco flexible, solo deja elegir mañana tarde o noche [...] deberia ser configurable, si quieres usarlo como ahora o si quieres usarlo por horas".
- S2 Say what will be marked before marking it. Owner: "al elegir clases nisiquier sabes que estas haciendo hasta que clickeas algo, no sale que vas a marcar la mañana como ocupada".
- S3 Exact times. Owner: "las horas de trabajo saltan hora por hora, tambien dedberia de ser elegible por hora especifica".
- S4 The profile is more than a schedule. Owner: "tu perfil no deberia de ser solo tu horario, que pasa con tu nombre?".
- S5 Several schedules, chosen per group. Owner: "ademas deberias de poder tener mas de una configuracion de horario, quizas quieres que ciertos horarios lo vean ciertos grupos solamente". Owner chose (L3) "Varios perfiles completos con nombre ("Semana normal", "Vacaciones") y cada grupo usa uno": several full named schedules; each group reads the one the person assigned to it, else their default. Amends ADR 0004.
- S6 Clear separation between routines. Owner: "si elijo mas de una configuracion no tienee separaciones claras, cual es para trabajo, cual es para turnos, cual es para clases? porque trabajo y turnos es distinto?".
- S7 Shift hours are configurable. Owner: "otra vez no deja configurar la hora de los turnos, solo los aplica".
- S8 Repeating patterns. Owner: "como configuro que se repita cierto patron?".
- S9 Seed the owner's test group. Owner: "quiero que seedeees mi grupo de TEST https://amigorganizador.vercel.app/g/6uReZ0ds3QZ9jRq3iWZoWA para ver que pasa con otros usuarios".

## Tasks

- [x] T1 (S9) inline: `packages/db/scripts/seed-group.ts` adds 6 synthetic members (`acc_seed_*`, names end in "(seed)"): office week, classes, no profile (unknown), 4x4 shifts, late office with two one-off busy evenings, and one in Buenos Aires. `--remove` takes them out. Run against production on 2026-11-17: group has 7 members.
- [ ] T2 (S4, S5) inline: core `Person` (account name, schedules, default, per-group choice) and named schedules (`Profile` gains `id`, `name`); group outlook reads each member's schedule for that group. ADR 0004 amended. Risk: item 3 (outlook contract).
- [ ] T3 (S1, S3, S6, S7, S8) inline: core routines with exact minutes and a label: weekly (by weekday) or repeating cycle of N days with its own hours per step (custom shifts, any pattern). Old `workweek`/`classes`/`shifts` keep reading.
- [ ] T4 (S4, S5) inline: db migration: `app.people` + schedules keyed by (account, schedule id); existing profiles become schedule "Mi horario" and the default. Risk: item 1 (stored data). Independent verifier.
- [ ] T5 (S1-S4, S6-S8) web: profile page: your name, list of schedules (create, rename, duplicate, delete, default), editor with "Por bloques / Por hora" granularity, exact time inputs, a sentence saying what will be marked before saving, one card per routine with its label, cycle builder for shifts and patterns.
- [ ] T6 (S5) web: in the group page, choose which of my schedules this group sees.
- [ ] T7 e2e for T5-T6, DESIGN.md update, deploy (owner's go).

## Log

- L1 (2026-11-17): owner's request, verbatim: "Tengo mejoras propias al ver la app, no me gusta que sea tan poco flexible, solo deja elegir mañana tarde o noche, al elegir clases nisiquier sabes que estas haciendo hasta que clickeas algo, no sale que vas a marcar la mañana como ocupada, deberia ser configurable, si quieres usarlo como ahora o si quieres usarlo por horas, las horas de trabajo saltan hora por hora, tambien dedberia de ser elegible por hora especifica. tu perfil no deberia de ser solo tu horario, que pasa con tu nombre? ademas deberias de poder tener mas de una configuracion de horario, quizas quieres que ciertos horarios lo vean ciertos grupos solamente / si elijo mas de una configuracion no tienee separaciones claras, cual es para trabajo, cual es para turnos, cual es para clases? porque trabajo y turnos es distinto? otra vez no deja configurar la hora de los turnos, solo los aplica / como configuro que se repita cierto patron? / hay MUCHO por trabajar, además quiero que seedeees mi grupo de TEST https://amigorganizador.vercel.app/g/6uReZ0ds3QZ9jRq3iWZoWA para ver que pasa con otros usuarios".
- L2 (2026-11-17): S5 changes ADR 0004. Asked the owner how per-group visibility should work before planning T2+. Seeded members have no auth user (members and profiles carry no FK to `auth.users`).
- L3 (2026-11-17): owner: "2" (several full named profiles, each group uses one). Decisions (agent, reversible): the name lives on the account (`Person.displayName`) and renaming updates the person's memberships; a group without an explicit choice reads the default schedule; timezone and imported calendars stay per schedule, so a schedule is a complete profile; deleting the default schedule is refused, deleting one a group uses moves that group to the default. Why weekly vs cycle (S6): office and classes repeat by weekday, shifts repeat every N days regardless of weekday; the editor will show that difference instead of three unexplained buttons.
