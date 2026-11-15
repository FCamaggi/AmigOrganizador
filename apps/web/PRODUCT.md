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

- **Member:** keep my busy time (work, classes, shifts, one-off plans) in one
  place, set up once in a couple of minutes, so all my groups know when I can.
- **Group:** see at any moment which upcoming days the whole group can meet,
  pick one, and get it into everyone's calendar.

## Product Purpose

Friend groups that always know which days they can meet. Each person keeps a
profile of their busy time; every group compares its members' profiles and
ranks the days that work. Success is plans confirmed per week (a dated plan
accepted by at least 2 people). Model: `docs/adr/0004-groups-and-profiles-first.md`.
Full vision: `docs/product/VISION.md`.

## Positioning

AmigOrganizador does not compete with personal calendars; it reads them and
writes back to them. Its mechanism is a live, ranked view of the days a group
can meet, each with a human reason, computed from busy time that each person
describes once: optional templates (student classes, office week, nurse
shifts), one-off busy days, and imports from other calendars. A member without
a profile is shown as unknown, never assumed free.

## Operating Context

- Entry point is a group invite link shared in a WhatsApp group; the link
  preview matters as much as the first screen.
- Used on a phone, often in short bursts (in transit, between classes).
- Every member signs in with one tap (Google or email magic link); the group
  is visible before sign-in (ADR 0003).
- Profiles are set up once and touched up later (a new shift roster, exams
  week); groups are opened often to check "when can we meet".
- A confirmed plan leaves the app as an `.ics` file, an "add to Google
  Calendar" link, or a subscribable calendar feed.

## Capabilities and Constraints

- Phase 1 (MVP): create and join groups by link; one availability profile per
  person (busy calendar, optional templates, one-off busy days, ICS import);
  live group view with ranked days and reasons; propose and confirm a plan;
  export to calendars. Rules: `docs/domain/AVAILABILITY_ENGINE.md`.
- Three availability states: free, busy, unknown.
- Timezone per group; default `America/Santiago`.
- Later phases: live Google / Microsoft calendar connection, push and
  reminders, activity suggestions (events, food, places), recurring plans.
  See `docs/product/ROADMAP.md`.
- Stack: Next.js 16 PWA, Tailwind CSS 4, pure TypeScript core; Supabase and
  Vercel (beta on the default `*.vercel.app` domain).
- Undecided: logo; profile "tastes" fields.

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
