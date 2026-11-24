# Effortless availability: research for later phases

Research date: 2026-11-24. Question from the owner: how to make adding one's
schedule as easy as possible, thinking about potential rather than the next
sprint. Facts marked **[V]** were checked against the linked source on that
date; **[A]** are assumptions to confirm before building.

Why it matters: v1 died because availability was typed by hand
(`LESSONS_V1.md`). Phase 2's exit test is "50% of active members have a
calendar connected or imported"; the Phase 1 rule is profile setup under two
minutes.

## Ranked bets

1. **Live Google Calendar with `calendar.events.freebusy`** (freeBusy query +
   `events.watch` push). The narrowest scope that allows both free/busy reads
   and change notifications; `calendar.freebusy` alone cannot be watched
   **[V]** ([scopes](https://developers.google.com/workspace/calendar/api/auth),
   [events.watch](https://developers.google.com/workspace/calendar/v3/reference/events/watch)).
   Google sign-in already exists, so it is one incremental consent. Start the
   OAuth verification early (up to ~10 business days for sensitive scopes
   **[V]**); whether these scopes count as sensitive is **[A]**. Watch
   channels expire and need a renewal job. Effort M, friction reduction high.
   Phase 2.
2. **Photo / screenshot / PDF of a timetable or shift roster → routines.** A
   vision model returns structured JSON in the core's template shapes; the
   person confirms on the 14-day preview before saving. Reaches students and
   nurses, who rarely have a synced calendar **[A]**. Cost well under one cent
   per parse on a small model **[A]**. Needs a 20-30 sample accuracy eval and
   a legend step for shift codes ("¿qué significa N?"). Keep the image in
   memory only, store busy intervals only, never log model output. The model
   sits behind a core port (`ScheduleExtractor`); rules stay in core. Effort
   M. Can ship before OAuth.
3. **Weekly check-in + mark only exceptions.** A Sunday push: "¿esta semana
   igual que siempre?" [Igual] [Tengo cambios] [No sé]. One tap keeps profiles
   fresh; unconfirmed profiles show as stale instead of silently fresh, and
   "No sé" reads as unknown, never free. Needs Web Push, which on iOS works
   only for installed web apps, from a user tap **[V]**
   ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
   This is why the PWA install hint exists. Effort M.
4. **Natural-language entry** ("trabajo de lunes a viernes de 9 a 6, los
   jueves salgo tarde"), typed or dictated with the keyboard microphone. Same
   extractor port and confirmation preview as bet 2, so cheap once 2 exists.
   Ambiguity becomes a clarifying question, never free time. Effort S after 2.
5. **Microsoft calendars via `calendarView`** with `Calendars.ReadBasic` and
   `$select=start,end,showAs`. `getSchedule` does not support personal
   outlook.com accounts **[V]**
   ([getSchedule](https://learn.microsoft.com/en-us/graph/api/calendar-getschedule)).
   ReadBasic still returns subjects **[A]**: select the minimum fields and
   never persist titles. Change subscriptions last a few days and need
   renewal **[V]**. Effort M. After Google.

## Smaller wins (Phase 1-2)

- Persona-first onboarding: "¿Qué ocupa tu semana?" (Trabajo / Clases /
  Turnos / Nada fijo) opens the matching prefilled routine. Templates already
  exist; this is ordering, effort S.
- "Copy last week" and per-day exceptions as the main editing gesture.
- Per-provider guides for getting an ICS link (Apple, Outlook), effort S.
- Badging API for pending plan confirmations on installed apps **[V]**
  ([WebKit](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/)).

## Not worth doing

- **A WhatsApp bot inside friend groups.** The Cloud API Groups feature caps
  groups at 8 participants and cannot add members **[V]**
  ([Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/groups/));
  messages are billed per template outside the 24 h window. A one-to-one bot
  for reminders stays a Phase 4 option.
- **iCloud through app-specific passwords, or scraping university portals.**
  High friction, credential risk, brittle. Apple's third-party calendar
  authorization was a pilot needing a paid developer account as of October
  2026 **[V]** ([Apple forum](https://developer.apple.com/forums/thread/850281)).
  Use ICS guides now and native EventKit later.
- **Native apps only for background sync.** Calendar refresh runs on the
  server. Native (Capacitor wrapping the web app) pays off only for reading
  the device calendar or widgets: Phase 4.

## Platform limits to remember

- A PWA cannot read the device calendar; only native apps can (EventKit,
  CalendarContract) **[A]**.
- Periodic Background Sync does not exist on iOS Safari **[V]**
  ([caniuse](https://caniuse.com/wf-periodic-background-sync)).

## Privacy and law (Chile)

Ley 21.719 takes effect on 2026-12-01 unless a postponement to 2027-10-15,
approved by the Senate on 2026-10-28, becomes law first **[V]**
([BCN](https://www.bcn.cl/balance-legislativo/detalle/ficha_LEY_21719_2024-12-13)).
Likely duties **[A]**, to confirm with a lawyer: consent per purpose at
calendar-connect time, data minimisation (free/busy only already fits),
access/correction/deletion/portability ("disconnect and delete" must purge
tokens and busy data), breach notification, and a privacy notice naming
processors abroad (Vercel, Supabase, Google, any model provider).
