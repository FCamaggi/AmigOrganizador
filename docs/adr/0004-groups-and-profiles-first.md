# ADR 0004 — Groups and saved profiles first, not one-off plans

- **Status:** accepted (owner, 2026-11-15)
- **Date:** 2026-11-15
- **Supersedes:** the plan-first framing of `VISION.md` and Phase 1 in
  `ROADMAP.md` written in Phase 0 ("one link, one plan").

## Context

The owner's original request (Phase 0, L1): "la idea es que todos pudieran
colocar sus horarios y así se calcula de diferentes formas los días ideales".

The Phase 0 vision, written by the agent, reframed the product as event-first:
someone creates a plan, shares a link, and everyone answers for that plan.
Persistent groups and saved patterns were pushed to Phase 2. The owner never
confirmed that reframe, and on 2026-11-15 rejected the resulting build:

> "te fuiste completamente a la idea de hacer algo tipo when to meet, no es lo
> que hablamos, la base de lo que teníamos eran grupos de personas que al
> comparar su disponibilidad pudieran saber qué días pueden verse"

and confirmed the model:

> "sí, ese es el modelo, sobre los perfiles de estudiante, enfermera, etc,
> efectivamente son ayudas, no es necesario que se elijan, pero si, la idea es
> que lo usen como calendario de sus trabajos, clases, días ocupados, y así el
> resto del grupo en su totalidad puede saber si pueden juntarse o no, la idea
> de todo esto era hacer lo más fácil posible para las personas el mostrar esa
> disponibilidad y configurarla, importando y exportando de otros calendarios,
> etc."

## Decision

- **Groups are persistent.** A group has members and an invite link. It is the
  main screen of the product.
- **Each person keeps one availability profile**, set up once and shared by all
  their groups: a calendar of their busy time (work, classes, shifts, one-off
  busy days). Profile templates (student, office, nurse shifts) are optional
  helpers to fill it faster, never a required choice.
- **The group view is always live:** it compares every member's profile and
  shows which upcoming days the whole group (or most of it) can meet, with
  reasons. A member with no profile yet is unknown, never free.
- **Making it easy is the product:** import from other calendars (ICS URL now,
  Google and Microsoft accounts when auth exists) and export back (confirmed
  plans as calendar invites or a subscribable feed).
- **A plan is an output, not the entry point:** from a good day in the group
  view, someone proposes "juntémonos este día" and confirms it; it leaves as an
  `.ics` / Google Calendar link.

## Consequences

- Reused from the plan-first build: the availability engine (`findWindows`),
  free / busy / unknown, busy templates and overnight shifts, `dayLines`,
  timezone helpers, invite builders, the in-memory adapter pattern, the
  Línea de Metro design system (`apps/web/DESIGN.md`).
- Replaced: the plan-centred domain (participants answering per plan) and its
  screens. The `Plan` aggregate is reworked into a group plan.
- ADR 0003 still holds (accounts for everyone, one-tap sign-in); the invite
  link of a group takes the place of the plan link as the access control.
- The north star stays: plans confirmed per week, now coming out of groups.

## Amendment (owner, 2026-11-17): several named schedules

After using the app, the owner asked for "más de una configuracion de horario,
quizas quieres que ciertos horarios lo vean ciertos grupos solamente" and chose
"varios perfiles completos con nombre ("Semana normal", "Vacaciones") y cada
grupo usa uno" (`odd/tasks/profile-editor-v2.md`, L3).

- A person keeps **one or more named schedules**. Each one is a complete
  profile (routines, one-off days, imported calendars, timezone).
- One schedule is the **default**. A group reads the schedule the person chose
  for it, else the default. The default cannot be deleted.
- The person's **name lives on the account**, not on each group.
- Unchanged: one schedule per person per group, unknown is never free, and
  setting up the default schedule must stay under 2 minutes; extra schedules
  are optional.
