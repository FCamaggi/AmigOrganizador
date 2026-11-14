# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mixed groups of friends in Chile who coordinate through WhatsApp on their
phones: students with changing class schedules, office workers on a Monday to
Friday week, shift workers (nursing), and people with families. The app
assumes no single profile. People describe their routine and their tastes
when they set up their profile.

Jobs:

- **Organizer:** turn "we should meet up" into a confirmed plan without a
  60-message thread.
- **Participant:** say when they can't make it in under a minute, then get
  the plan in their calendar.

## Product Purpose

The shortest path from "juntémonos" to a plan that sits in everyone's
calendar. Success is plans confirmed per week (a dated plan accepted by at
least 2 people). Full vision: `docs/product/VISION.md`.

## Positioning

AmigOrganizador does not compete with personal calendars; it reads them. Its
mechanism is a ranked list of meeting options, each with a human reason,
computed from busy time that people describe once through recurring profiles
(shifts, work week, classes). A friend who hasn't answered is shown as
unknown, never assumed free.

## Operating Context

- Entry point is a plan link shared in a WhatsApp group; the link preview
  matters as much as the first screen.
- Used on a phone, often in short bursts (in transit, between classes).
- Every participant signs in with one tap (Google or email magic link); the
  plan is visible before sign-in (ADR 0003, `docs/adr/0003-accounts-for-everyone.md`).
- The confirmed plan leaves the app as an `.ics` file or an "add to Google
  Calendar" link.

## Capabilities and Constraints

- Phase 1 (MVP): create a plan (title, date range up to 60 days, duration),
  join by link, mark availability, ranked options with reasons, organizer
  confirms, add to calendar. Rules: `docs/domain/PLAN.md`,
  `docs/domain/AVAILABILITY_ENGINE.md`.
- Availability is entered as **busy** time by default, helped by recurring
  profiles; a group can switch to marking free time instead.
- Three availability states: free, busy, unknown.
- Timezone is selectable per plan; default `America/Santiago`.
- Later phases: live calendar connection, push and reminders, activity
  suggestions (events, food, places), recurring plans. See
  `docs/product/ROADMAP.md`.
- Stack: Next.js 16 PWA, Tailwind CSS 4, pure TypeScript core; Supabase and
  Vercel (beta on the default `*.vercel.app` domain).
- Undecided: logo and visual identity; profile "tastes" fields.

## Brand Commitments

- Name: AmigOrganizador (beta).
- Voice: close, Chilean, like a friend in the group ("juntémonos",
  "¿quién se suma?", "lucas"), informal without overdoing slang. Copy is
  Spanish (Chile), behind i18n keys.

## Evidence on Hand

- v1 post-mortem with user-testing notes: `docs/product/LESSONS_V1.md`,
  `docs/legacy/`.
- No users, testimonials, partner venues or metrics exist yet; never invent
  them. Any venue promotion that the venue did not provide is labelled as an
  example.

## Product Principles

1. Value before sign-in, sign-in in one tap.
2. Read calendars, don't replace them.
3. Unknown is not free.
4. Live where the group lives: the chat link is the front door.
5. Every screen ends in a decision.

## Accessibility & Inclusion

WCAG 2.2 AA: text contrast at least 4.5:1 (v1 testers reported text colors
"se parece mucho al fondo"), touch targets at least 44 px, full screen-reader
labels, no information carried by color alone (free / busy / unknown need a
second cue).
