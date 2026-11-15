# Roadmap (v2)

Each phase has one goal and one exit test. Nothing in a later phase starts
before the earlier exit test passes with real friends.

## Phase 0 — Foundation (done)

Goal: a clean repo the agentic workflow can build on.
Exit: stack decided (ADR 0002), monorepo scaffold, pure engine package with
tests, CI green, deploy preview on every push.

## Phase 1 — "Groups that know when they can meet" (MVP)

Goal: a real friend group sets up their profiles and finds a day to meet
without help. Model: ADR 0004.

- Create a group and share its invite link; join with one-tap sign-in
  (Google or magic link; ADR 0003). The link shows the group first.
- One availability profile per person, shared by all their groups: a calendar
  of busy time. Optional helpers: templates (student classes, office week,
  nurse shifts), one-off busy days and exceptions.
- Import from another calendar by ICS URL (busy time only, never titles).
- Group view: ranked upcoming days for the whole group, with reasons and the
  line diagram; members without a profile are unknown.
- From a good day: propose and confirm a plan; `.ics` and "add to Google
  Calendar"; export the group's confirmed plans as a subscribable ICS feed.
- Link preview (Open Graph) for the group invite, made for WhatsApp.

Exit: 3 real friend groups confirm a plan; median time to set up a profile
under 2 minutes.

## Phase 2 — "It just knows"

Goal: people stop typing availability.

- Live calendar connection with Google and Microsoft accounts (free/busy only).
- Push notifications (PWA) and reminders; nudges to people without a profile.
- Quick reactions on proposed days (👍 / 🤷 / 👎).

Exit: 50% of active members have a calendar connected or imported.

## Phase 3 — "What do we do?"

Goal: the plan includes the activity, not just the date.

- Suggestions per option: events (tickets), places to eat or drink, activities.
- Pluggable sources behind one port: event APIs, Google Places, curated
  lists, partner promotions. Scheduled ingestion, not manual scraping.
- Beta: real venues as suggestions; any promotion that the venue did not
  provide is clearly labelled as an example, never shown as a real offer.
- Group taste profile from past plans (categories, budget, area).
- Splitting costs and RSVPs with a +1.

Exit: 30% of confirmed plans include a suggested activity.

## Phase 4 — Scale and beyond

Ideas, not commitments, ranked by how much they help the north star:

- **Recurring plans:** "every other Thursday, padel" with automatic slot finding.
- **WhatsApp / Telegram bot:** create and answer plans without leaving the chat.
- **AI assistant:** "find a Friday dinner for the uni group under 15 lucas near
  Ñuñoa" runs the engine plus suggestions and drafts the message.
- **Venues and partners:** promotions for groups on low-demand days; a
  marketplace where places compete for confirmed groups. Main revenue path.
- **Premium for organizers:** large groups, recurring events, analytics.
- **Native apps** once PWA limits hurt (widgets, background calendar sync).
- **Other markets:** i18n is in from day one; Spanish (Chile) first.
