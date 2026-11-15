# Phase 1 — Groups that know when they can meet

Objective: a real friend group sets up their profiles and finds a day to meet without help (ADR 0004).
Branch: `rebuild`. Delivery: ask-on-risk. Test runner: Vitest (core, adapters), Playwright (e2e).
Replaces `odd/tasks/phase1-one-link-one-plan.md` (plan-first, rejected by the owner on 2026-11-15).

## Specs

- S1 (groups): "la base de lo que teníamos eran grupos de personas que al comparar su disponibilidad pudieran saber qué días pueden verse". A group is persistent: name, members, invite link. Create, share the link, join with one-tap sign-in; the group is visible before sign-in (ADR 0003: "Todo usuario tiene que tener cuenta"; "na yo creo que link está bien").
- S2 (profile): "la idea es que lo usen como calendario de sus trabajos, clases, días ocupados". One profile per person, shared by all their groups. Templates: "sobre los perfiles de estudiante, enfermera, etc, efectivamente son ayudas, no es necesario que se elijan". Earlier (2026-11-13): "es más fácil armar los días ocupados que los libres". Profile = busy time from optional templates (classes, office week, nurse shifts) + one-off busy days + exceptions (a day off).
- S3 (group view): "y así el resto del grupo en su totalidad puede saber si pueden juntarse o no". Live ranked upcoming days for the group, with reasons and the line diagram; a member without a profile is unknown, never free.
- S4 (import / export): "la idea de todo esto era hacer lo más fácil posible para las personas el mostrar esa disponibilidad y configurarla, importando y exportando de otros calendarios, etc." Import busy time from an ICS URL (busy only, never titles); export confirmed plans (`.ics`, Google Calendar link, subscribable ICS feed per group).
- S5 (plan from a day): from a good day in the group view, propose and confirm a plan; it leaves as `.ics` / Google Calendar link.
- S6 (link preview): Open Graph preview for the group invite link, made for WhatsApp.
- S7 (timezone): per group, default `America/Santiago` (owner: "Que se pueda elegir, pero el default Santiago").
- S8 (design): reuse the Línea de Metro system (`apps/web/DESIGN.md`) built with the impeccable skill.
- S9 (exit test): 3 real friend groups confirm a plan; median time to set up a profile under 2 minutes.

Assumptions (agent, to confirm): the group view looks 4 weeks ahead; "mark free time instead" (2026-11-13: "puede ser compatible con ambas formas") is left out of this phase, because a shared profile is a busy calendar.

## Tasks

- [x] T1 (S1, S7) inline: core `Group` domain (create, join, leave, update) + `GroupRepository` port. RED (19 failing on stub) then GREEN (134 core tests). Rules in `docs/domain/GROUP.md`.
- [x] T2 (S2) inline: core availability `Profile` (templates, one-off busy days, exceptions, imported busy) expanded over a date range + `ProfileRepository` port. Reuses `expandBusyTemplates` (+ new `validateTemplates`). RED (16 failing on stub) then GREEN (150 core tests). Rules in `docs/domain/PROFILE.md`.
- [x] T3 (S3) inline: core group outlook (`outlookRange`, `groupOutlook`, `groupDayLines`): members' profiles -> ranked windows, best window per date, and day lines; no profile = unknown. RED (8 + 8 failing) then GREEN (162 core tests).
- [x] T4 (S4, S5) inline: core group plan (`proposeGroupPlan`, `confirmGroupPlan`, `cancelGroupPlan`, `groupPlanInvite`, `groupFeed`) + `GroupPlanRepository` port + `buildIcsFeed`. RED (24 failing on stubs) then GREEN (186 core tests).
- [ ] T5 (S4): ICS import adapter (VEVENT + RRULE -> busy intervals; titles dropped). Needs a parsing dependency: decide before writing (Risk item 5).
- [ ] T6 (S1, S2): in-memory adapters for groups, profiles and plans; dev seed groups.
- [ ] T7 (S1-S5, S8): screens: my groups, create / join group, profile editor (weekly routine + busy days + import), group view (ranked days + diagram), confirm plan, feed route. Impeccable review + DESIGN.md update.
- [ ] T8 (S6): Open Graph for the group invite link.
- [ ] T9: remove the plan-first domain and screens once T7 replaces them.
- [ ] T10: Supabase adapters + auth (blocked: Supabase project). T11: Vercel deploy + e2e (blocked: Vercel project).

## Log

- L1 (2026-11-15): owner: "Viendo lo que realizaste me di cuenta que te fuiste completamente a la idea de hacer algo tipo when to meet, no es lo que hablamos, la base de lo que teniamos eran grupos de personas que al comparar su disponibilidad pudieran saber que dias pueden verse, no entiendo cuando se cambio tanto la idea para ser algo tan basico como decir que quiero hacer algo y que todos pongan los dias que pueden, o entendi mal? la idea era esa, en que lo convertiste ahora? que pasa con lo que dije de los perfiles, la verdad no se que pasó"
- L2 (2026-11-15): agent found the cause: the plan-first framing came from the agent's Phase 0 VISION/ROADMAP and was never confirmed (Phase 1 Specs said so). Owner confirmed the model: "sí, ese es el modelo, sobre los perfiles de estudiante, enfermera, etc, efectivamente son ayudas, no es necesario que se elijan, pero si, la idea es que lo usen como calendario de sus trabajos, clases, dias ocupados, y asi el resto del grupo en su totalidad puede saber si pueden juntarse o no, la idea de todo esto era hacer lo mas facil posible para las personas el mostrar esa disponibilidad y configurarla, importando y exportando de otros calendarios, etc."
- L3 (2026-11-15): ADR 0004 written; VISION, ROADMAP, PRODUCT.md and CLAUDE.md aligned. Plan below awaits the owner's approval before T1. Engram mirror pending (Engram fails with "getwd").
- L4 (2026-11-15): owner approved the plan: "sí, dale con el punto 1". T1 done. Decisions (agent, reversible): only the owner renames or changes the timezone; when the owner leaves, the longest-standing member becomes owner; the invite code is separate from the group id so it can be rotated.
- L5 (2026-11-15): owner: "sí, dale con el punto 2". T2 done. Decisions (agent, reversible): an exception frees template time only, never one-off or imported busy time; an imported calendar keeps busy intervals per date plus a label the person gives it, never event titles; the ICS URL itself is not part of the core profile (adapter concern, T5).
- L6 (2026-11-15): owner: "sí, dale con el punto 3". T3 done. Fix to T2 found while designing T3: imported calendars now store busy spans as UTC instants (`UtcSpan`) and `availabilityFor` takes the group's timezone, because an ICS event is an instant and a person can be in groups with different timezones; templates and one-off days stay wall time. Line helpers moved to `availability/day-lines.ts` (shared by plan and group). Engine check: Friday 18:00-22:00 outranks a whole free Saturday (evening scores 1, afternoon-centred 0.85), as specified.
- L7 (2026-11-15): owner: "sí, dale con el punto 4". T4 done. Decisions (agent, reversible): any member proposes; the proposer or the group owner confirms or cancels; any slot is allowed, not only suggested ones (open question Q7 still applies); the feed lists only confirmed plans, so a cancelled plan drops out of subscribed calendars.
